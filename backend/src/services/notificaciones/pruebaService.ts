// 🧪 Servicio de Pruebas de Notificaciones

import { ConfiguracionModuloModel } from '../../modules/calendar/models/ConfiguracionModulo.js';
import { AgenteModel } from '../../modules/calendar/models/Agente.js';
import { TurnoModel } from '../../modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../../models/ContactoEmpresa.js';
import { EmpresaModel } from '../../models/Empresa.js';
import { reemplazarVariables, construirListaTurnos, enviarPlantillaMeta } from '../notificacionesMetaService.js';
import { normalizarTelefono } from '../../utils/telefonoUtils.js';

/**
 * Normalizar teléfono para búsqueda flexible
 * Intenta múltiples formatos para encontrar el registro
 */
function obtenerVariantesTelefono(telefono: string): string[] {
  const limpio = telefono.replace(/[^\d]/g, '');
  
  const variantes = new Set<string>();
  
  // Formato original
  variantes.add(telefono);
  variantes.add(limpio);
  
  // Con +
  if (!telefono.startsWith('+')) {
    variantes.add(`+${limpio}`);
  }
  
  // Sin 54 inicial si lo tiene
  if (limpio.startsWith('54')) {
    variantes.add(limpio.substring(2));
    variantes.add(`+${limpio.substring(2)}`);
  }
  
  // Con 54 si no lo tiene
  if (!limpio.startsWith('54') && limpio.length >= 10) {
    variantes.add(`54${limpio}`);
    variantes.add(`+54${limpio}`);
  }
  
  // Sin 9 después del código de área (549 -> 54)
  if (limpio.startsWith('549')) {
    const sinNueve = `54${limpio.substring(3)}`;
    variantes.add(sinNueve);
    variantes.add(`+${sinNueve}`);
  }
  
  return Array.from(variantes);
}

/**
 * Enviar notificación de prueba
 */
export async function enviarNotificacionPrueba(
  tipo: 'agente' | 'cliente',
  empresaId: string,
  telefono: string
): Promise<boolean> {
  try {
    console.log(`\n🧪 Enviando notificación de prueba:`);
    console.log(`   Tipo: ${tipo}`);
    console.log(`   Empresa: ${empresaId}`);
    console.log(`   Teléfono: ${telefono}`);
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    if (!config) {
      throw new Error(`Configuración no encontrada para: ${empresaId}`);
    }
    
    // Obtener variantes del teléfono para búsqueda flexible
    const variantes = obtenerVariantesTelefono(telefono);
    console.log(`   🔍 Buscando con variantes:`, variantes);
    
    if (tipo === 'agente') {
      // Buscar agente con cualquier variante del teléfono
      const agente = await AgenteModel.findOne({ 
        empresaId, 
        telefono: { $in: variantes }
      });
      
      if (!agente) {
        throw new Error(`Agente no encontrado con teléfono: ${telefono} (probadas ${variantes.length} variantes)`);
      }
      
      console.log(`   ✅ Agente encontrado: ${agente.nombre} ${agente.apellido} (tel: ${agente.telefono})`);
      await enviarPruebaAgente(agente, config);
      
    } else if (tipo === 'cliente') {
      // Buscar cliente con cualquier variante del teléfono
      const cliente = await ContactoEmpresaModel.findOne({ 
        empresaId, 
        telefono: { $in: variantes }
      });
      
      if (!cliente) {
        throw new Error(`Cliente no encontrado con teléfono: ${telefono} (probadas ${variantes.length} variantes)`);
      }
      
      console.log(`   ✅ Cliente encontrado: ${cliente.nombre} ${cliente.apellido} (tel: ${cliente.telefono})`);
      await enviarPruebaCliente(cliente, config);
    }
    
    console.log(`✅ Notificación de prueba enviada`);
    return true;
    
  } catch (error) {
    console.error('❌ Error enviando prueba:', error);
    throw error;
  }
}

export async function enviarPruebaAgente(agente: any, config: any) {
  const notifConfig = config.plantillasMeta?.notificacionDiariaAgentes;
  if (!notifConfig || !notifConfig.activa) {
    throw new Error('Plantilla de agentes no configurada o inactiva');
  }
  
  const ahora = new Date();
  const inicio = new Date(ahora);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);
  
  const turnos = await TurnoModel.find({
    empresaId: config.empresaId,
    agenteId: agente._id,
    fechaInicio: { $gte: inicio, $lt: fin },
    estado: { $in: ['pendiente', 'confirmado'] }
  }).sort({ fechaInicio: 1 });
  
  // ✅ Buscar clientes manualmente si clienteId es string
  const turnosConNombre = [];
  for (const turno of turnos) {
    let clienteNombre = '';
    
    if (turno.clienteId) {
      let cliente: any;
      
      // Si clienteId es string, buscar manualmente
      if (typeof turno.clienteId === 'string') {
        cliente = await ContactoEmpresaModel.findById(turno.clienteId);
      } else {
        // Si ya está populado
        cliente = turno.clienteId;
      }
      
      if (cliente) {
        clienteNombre = `${cliente.nombre} ${cliente.apellido}`;
      }
    }
    
    turnosConNombre.push({
      ...turno.toObject(),
      clienteNombre
    });
  }
  
  const empresa = await EmpresaModel.findOne({ nombre: config.empresaId });
  if (!empresa || !(empresa as any).phoneNumberId) {
    throw new Error('phoneNumberId no encontrado');
  }
  
  const variables: Record<string, any> = {
    phoneNumberId: (empresa as any).phoneNumberId,
    telefono: agente.telefono,
    agente: `${agente.nombre} ${agente.apellido}`,
    lista_turnos: construirListaTurnos(turnosConNombre, config)
  };
  
  const url = reemplazarVariables(notifConfig.metaApiUrl, variables);
  const payload = reemplazarVariables(notifConfig.metaPayload, variables);
  
  await enviarPlantillaMeta(agente.telefono, url, payload);
}

export async function enviarPruebaCliente(cliente: any, config: any) {
  const notifConfig = config.plantillasMeta?.confirmacionTurnos;
  if (!notifConfig || !notifConfig.activa) {
    throw new Error('Plantilla de clientes no configurada o inactiva');
  }
  
  const ahora = new Date();
  const manana = new Date(ahora);
  manana.setDate(manana.getDate() + 1);
  manana.setHours(0, 0, 0, 0);
  const finManana = new Date(manana);
  finManana.setHours(23, 59, 59, 999);
  
  const turnos = await TurnoModel.find({
    empresaId: config.empresaId,
    clienteId: cliente._id,
    fechaInicio: { $gte: manana, $lte: finManana }
  }).populate('clienteId');
  
  if (turnos.length === 0) {
    throw new Error(`No hay turnos para mañana para: ${cliente.telefono}`);
  }
  
  const empresa = await EmpresaModel.findOne({ nombre: config.empresaId });
  if (!empresa || !(empresa as any).phoneNumberId) {
    throw new Error('phoneNumberId no encontrado');
  }
  
  let detallesViaje = '';
  
  turnos.forEach((turno, index) => {
    const fechaInicio = new Date(turno.fechaInicio);
    const hora = fechaInicio.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    });
    
    const origen = turno.datos?.origen || 'No especificado';
    const destino = turno.datos?.destino || 'No especificado';
    const pasajeros = turno.datos?.pasajeros || '1';
    
    if (turnos.length > 1) {
      detallesViaje += `Viaje ${index + 1}: `;
    }
    
    detallesViaje += `Hora: ${hora} | Origen: ${origen} | Destino: ${destino} | Pasajeros: ${pasajeros}`;
    
    if (index < turnos.length - 1) {
      detallesViaje += ' || ';
    }
  });
  
  const variables: Record<string, any> = {
    phoneNumberId: (empresa as any).phoneNumberId,
    telefono: cliente.telefono,
    nombre_cliente: `${cliente.nombre} ${cliente.apellido}`,
    fecha_hora: detallesViaje
  };
  
  const url = reemplazarVariables(notifConfig.metaApiUrl, variables);
  const payload = reemplazarVariables(notifConfig.metaPayload, variables);
  
  await enviarPlantillaMeta(cliente.telefono, url, payload);
  
  // ✅ Guardar estado de conversación para que el flujo pueda procesar la respuesta
  const { ConversationStateModel } = await import('../../models/ConversationState.js');
  await ConversationStateModel.findOneAndUpdate(
    { telefono: cliente.telefono, empresaId: config.empresaId },
    {
      flujo_activo: 'notificacion_viajes',
      estado_actual: 'esperando_opcion_inicial',
      data: {
        turnosIds: turnos.map((t: any) => t._id.toString()),
        viajes: turnos.map((t: any) => ({
          fechaInicio: t.fechaInicio,
          datos: t.datos
        }))
      },
      prioridad: 'urgente',
      ultima_interaccion: new Date()
    },
    { upsert: true, new: true }
  );
  
  console.log(`✅ Estado de conversación guardado para ${cliente.telefono}`);
}

/**
 * Enviar confirmación a cliente con turnos específicos (para cron automático)
 */
export async function enviarConfirmacionConTurnos(
  cliente: any,
  turnos: any[],
  config: any
): Promise<void> {
  const notifConfig = config.plantillasMeta?.confirmacionTurnos;
  if (!notifConfig || !notifConfig.activa) {
    throw new Error('Plantilla de clientes no configurada o inactiva');
  }
  
  if (!cliente.telefono) {
    throw new Error(`Cliente sin teléfono: ${cliente._id}`);
  }
  
  const empresa = await EmpresaModel.findOne({ nombre: config.empresaId });
  if (!empresa || !(empresa as any).phoneNumberId) {
    throw new Error('phoneNumberId no encontrado');
  }
  
  let detallesViaje = '';
  
  turnos.forEach((turno, index) => {
    const fechaInicio = new Date(turno.fechaInicio);
    const hora = fechaInicio.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    });
    
    const origen = turno.datos?.origen || 'No especificado';
    const destino = turno.datos?.destino || 'No especificado';
    const pasajeros = turno.datos?.pasajeros || '1';
    
    if (turnos.length > 1) {
      detallesViaje += `Viaje ${index + 1}: `;
    }
    
    detallesViaje += `Hora: ${hora} | Origen: ${origen} | Destino: ${destino} | Pasajeros: ${pasajeros}`;
    
    if (index < turnos.length - 1) {
      detallesViaje += ' || ';
    }
  });
  
  const variables: Record<string, any> = {
    phoneNumberId: (empresa as any).phoneNumberId,
    telefono: cliente.telefono,
    nombre_cliente: `${cliente.nombre} ${cliente.apellido}`,
    fecha_hora: detallesViaje
  };
  
  const url = reemplazarVariables(notifConfig.metaApiUrl, variables);
  const payload = reemplazarVariables(notifConfig.metaPayload, variables);
  
  await enviarPlantillaMeta(cliente.telefono, url, payload);
  
  // ✅ Guardar estado de conversación para que el flujo pueda procesar la respuesta
  const { ConversationStateModel } = await import('../../models/ConversationState.js');
  await ConversationStateModel.findOneAndUpdate(
    { telefono: cliente.telefono, empresaId: config.empresaId },
    {
      flujo_activo: 'notificacion_viajes',
      estado_actual: 'esperando_opcion_inicial',
      data: {
        turnosIds: turnos.map((t: any) => t._id.toString()),
        viajes: turnos.map((t: any) => ({
          fechaInicio: t.fechaInicio,
          datos: t.datos
        }))
      },
      prioridad: 'urgente',
      ultima_interaccion: new Date()
    },
    { upsert: true, new: true }
  );
  
  console.log(`✅ Estado de conversación guardado para ${cliente.telefono} (automático)`);
}
