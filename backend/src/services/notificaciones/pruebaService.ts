// 🧪 Servicio de Pruebas de Notificaciones
// Funciones reutilizables para enviar notificaciones (usadas por cron y endpoints de prueba)

import { ConfiguracionModuloModel } from '../../modules/calendar/models/ConfiguracionModulo.js';
import { AgenteModel } from '../../modules/calendar/models/Agente.js';
import { TurnoModel } from '../../modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../../models/ContactoEmpresa.js';
import { EmpresaModel } from '../../models/Empresa.js';
import { reemplazarVariables, construirListaTurnos, enviarPlantillaMeta } from '../notificacionesMetaService.js';

/**
 * Enviar notificación de prueba (agente o cliente)
 * Usado por el endpoint de prueba del frontend
 */
export async function enviarNotificacionPrueba(
  tipo: 'agente' | 'cliente',
  empresaId: string,
  telefono: string
): Promise<boolean> {
  console.log(`\n🧪 [PruebaService] Enviando prueba ${tipo} para empresa ${empresaId}`);
  
  const config = await ConfiguracionModuloModel.findOne({ empresaId });
  if (!config) {
    throw new Error(`Configuración no encontrada para empresa ${empresaId}`);
  }

  if (tipo === 'agente') {
    // Buscar agente por teléfono
    const telefonoLimpio = telefono.replace(/\D/g, '');
    const agente = await AgenteModel.findOne({ 
      empresaId, 
      telefono: { $regex: telefonoLimpio.slice(-8) } 
    });
    
    if (!agente) {
      throw new Error(`Agente no encontrado con teléfono ${telefono}`);
    }
    
    return await enviarPruebaAgente(agente, config);
    
  } else {
    // Buscar cliente por teléfono
    const telefonoLimpio = telefono.replace(/\D/g, '');
    const cliente = await ContactoEmpresaModel.findOne({ 
      empresaId, 
      telefono: { $regex: telefonoLimpio.slice(-8) } 
    });
    
    if (!cliente) {
      throw new Error(`Cliente no encontrado con teléfono ${telefono}`);
    }
    
    // Buscar turnos del cliente para mañana (según lógica de confirmación)
    const ahora = new Date();
    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);
    const finManana = new Date(manana);
    finManana.setHours(23, 59, 59, 999);
    
    const turnos = await TurnoModel.find({
      empresaId,
      clienteId: cliente._id,
      fechaInicio: { $gte: manana, $lte: finManana },
      estado: { $ne: 'cancelado' }
    }).sort({ fechaInicio: 1 });
    
    return await enviarConfirmacionConTurnos(cliente, turnos, config);
  }
}

/**
 * Enviar notificación a agente con sus turnos del día
 * ✅ LÓGICA EXACTA usada por agentesService.ts
 */
export async function enviarPruebaAgente(agente: any, config: any): Promise<boolean> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📤 [PruebaAgente] INICIANDO ENVÍO DE NOTIFICACIÓN`);
  console.log(`   👤 Agente: ${agente.nombre} ${agente.apellido}`);
  console.log(`   📞 Teléfono: ${agente.telefono}`);
  console.log(`   🏢 Empresa: ${config.empresaId}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const notifConfig = config.plantillasMeta?.notificacionDiariaAgentes;
  if (!notifConfig?.activa) {
    throw new Error('Plantilla de notificación diaria de agentes no está activa');
  }
  
  // Buscar turnos del agente para hoy
  const ahora = new Date();
  const inicio = new Date(ahora);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);
  
  console.log(`   🔍 Buscando turnos entre:`);
  console.log(`      Inicio: ${inicio.toISOString()}`);
  console.log(`      Fin: ${fin.toISOString()}`);
  console.log(`      Estados: ${notifConfig.programacion?.filtroEstado || ['pendiente', 'confirmado']}`);
  
  const turnos = await TurnoModel.find({
    empresaId: config.empresaId,
    agenteId: agente._id,
    fechaInicio: { $gte: inicio, $lt: fin },
    estado: { $in: notifConfig.programacion?.filtroEstado || ['pendiente', 'confirmado'] }
  })
  .sort({ fechaInicio: 1 })
  .lean();
  
  console.log(`   📊 Turnos encontrados: ${turnos.length}`);
  
  if (turnos.length > 0) {
    console.log(`   📋 Primer turno (ejemplo):`, {
      _id: turnos[0]._id,
      clienteId: turnos[0].clienteId,
      clienteIdType: typeof turnos[0].clienteId,
      datos: turnos[0].datos
    });
  }
  
  // ✅ Buscar clientes manualmente (clienteId es String, no ObjectId)
  const turnosConNombre = await Promise.all(turnos.map(async (t: any) => {
    let clienteNombre = 'Sin cliente';
    
    if (t.clienteId) {
      try {
        console.log(`      🔍 Buscando cliente ID: ${t.clienteId} (tipo: ${typeof t.clienteId})`);
        const cliente = await ContactoEmpresaModel.findById(t.clienteId);
        if (cliente) {
          clienteNombre = `${cliente.nombre} ${cliente.apellido}`;
          console.log(`      ✅ Cliente encontrado: ${clienteNombre}`);
        } else {
          console.log(`      ⚠️ Cliente NO encontrado en ContactoEmpresa con ID: ${t.clienteId}`);
          // Verificar si existe en la colección
          const count = await ContactoEmpresaModel.countDocuments({ _id: t.clienteId });
          console.log(`      📊 Count en BD: ${count}`);
          // Intentar buscar por empresaId para ver si hay clientes
          const clientesEmpresa = await ContactoEmpresaModel.countDocuments({ empresaId: config.empresaId });
          console.log(`      📊 Total clientes en empresa ${config.empresaId}: ${clientesEmpresa}`);
        }
      } catch (error) {
        console.error(`      ❌ Error buscando cliente ${t.clienteId}:`, error);
      }
    } else {
      console.log(`      ⚠️ Turno sin clienteId`);
    }
    
    return {
      ...t,
      clienteNombre
    };
  }));
  
  console.log(`   📋 Turnos con nombre procesados:`, turnosConNombre.map(t => ({
    clienteId: t.clienteId,
    clienteNombre: t.clienteNombre,
    origen: t.datos?.origen,
    destino: t.datos?.destino
  })));
  
  const listaTurnos = construirListaTurnos(turnosConNombre, config);
  console.log(`   📝 Lista generada: ${listaTurnos}`);
  
  const tipo = notifConfig.tipo || 'plantilla_meta';
  console.log(`   📋 Tipo de notificación: ${tipo}`);
  
  // ✅ OPCIÓN 1: Plantilla de Meta
  if (tipo === 'plantilla_meta') {
    const nombrePlantilla = notifConfig.nombre;
    const parametros = (notifConfig.parametros || []).sort((a: any, b: any) => a.orden - b.orden);
    
    console.log(`   📋 Plantilla: ${nombrePlantilla}`);
    console.log(`   🔧 Parámetros configurados: ${parametros.length}`);
    
    // Preparar componentes según parámetros configurados
    const components: any[] = [];
    
    if (parametros.length > 0) {
      const bodyParameters = parametros.map((param: any) => {
        let valor: string;
        
        // Reemplazar variables en el valor
        valor = reemplazarVariables(param.valor, {
          nombre: agente.nombre,
          lista_turnos: listaTurnos
        });
        
        return {
          type: 'text',
          text: valor
        };
      });
      
      components.push({
        type: 'body',
        parameters: bodyParameters
      });
    }
    
    // Construir payload (solo incluir components si hay parámetros)
    const payload: any = {
      messaging_product: 'whatsapp',
      to: agente.telefono,
      type: 'template',
      template: {
        name: nombrePlantilla,
        language: { code: notifConfig.idioma || 'es' }
      }
    };
    
    // Solo agregar components si hay parámetros
    if (components.length > 0) {
      payload.template.components = components;
    }
    
    console.log(`   📦 Payload generado:`, JSON.stringify(payload, null, 2));
    
    // Obtener phoneNumberId de la empresa
    const empresa = await EmpresaModel.findOne({ nombre: config.empresaId });
    const phoneNumberId = empresa?.phoneNumberId || process.env.META_PHONE_NUMBER_ID;
    console.log(`   📞 Phone Number ID: ${phoneNumberId}`);
    
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    
    await enviarPlantillaMeta(agente.telefono, url, payload);
    
  } else {
    // ✅ OPCIÓN 2: Texto directo
    const mensajeDirecto = notifConfig.mensajeDirecto || '';
    console.log(`   📝 Mensaje directo configurado`);
    
    // Reemplazar variables en el mensaje
    const mensajeFinal = reemplazarVariables(mensajeDirecto, {
      nombre: agente.nombre,
      lista_turnos: listaTurnos
    });
    
    console.log(`   📤 Mensaje final: ${mensajeFinal.substring(0, 100)}...`);
    
    // Obtener phoneNumberId de la empresa
    const empresa = await EmpresaModel.findOne({ nombre: config.empresaId });
    const phoneNumberId = empresa?.phoneNumberId || process.env.META_PHONE_NUMBER_ID;
    console.log(`   📞 Phone Number ID: ${phoneNumberId}`);
    
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: agente.telefono,
      type: 'text',
      text: { body: mensajeFinal }
    };
    
    await enviarPlantillaMeta(agente.telefono, url, payload);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ [PruebaAgente] NOTIFICACIÓN ENVIADA EXITOSAMENTE`);
  console.log(`   👤 Agente: ${agente.nombre} ${agente.apellido}`);
  console.log(`   📝 Mensaje incluía: ${turnosConNombre.length} turno(s)`);
  console.log(`${'='.repeat(80)}\n`);
  return true;
}

/**
 * Enviar confirmación a cliente con sus turnos
 * ✅ LÓGICA EXACTA usada por confirmacionService.ts
 */
export async function enviarConfirmacionConTurnos(
  cliente: any,
  turnos: any[],
  config: any
): Promise<boolean> {
  console.log(`\n📤 [ConfirmacionCliente] Enviando a ${cliente.nombre} ${cliente.apellido}`);
  
  const notifConfig = config.plantillasMeta?.confirmacionTurnos;
  if (!notifConfig?.activa) {
    throw new Error('Plantilla de confirmación de turnos no está activa');
  }
  
  if (!cliente.telefono || cliente.telefono.trim() === '') {
    throw new Error(`Cliente sin teléfono válido: ${cliente._id}`);
  }
  
  console.log(`   📊 Turnos a confirmar: ${turnos.length}`);
  console.log(`   📞 Teléfono: ${cliente.telefono}`);
  
  // Construir mensaje con los turnos
  let mensajeTurnos = '';
  
  if (turnos.length === 0) {
    mensajeTurnos = `No tienes ${config.nomenclatura?.turnos?.toLowerCase() || 'turnos'} programados.`;
  } else {
    for (let i = 0; i < turnos.length; i++) {
      const turno = turnos[i];
      const fechaInicio = new Date(turno.fechaInicio);
      
      const fecha = fechaInicio.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
      });
      
      const hora = fechaInicio.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
      });
      
      mensajeTurnos += `${i + 1}. ${fecha} a las ${hora}`;
      
      // ✅ SIEMPRE incluir origen y destino si existen
      if (turno.datos?.origen) {
        mensajeTurnos += ` | Origen: ${turno.datos.origen}`;
      }
      
      if (turno.datos?.destino) {
        mensajeTurnos += ` | Destino: ${turno.datos.destino}`;
      }
      
      if (i < turnos.length - 1) {
        mensajeTurnos += ' || ';
      }
    }
  }
  
  console.log(`   📝 Mensaje generado: ${mensajeTurnos.substring(0, 100)}...`);
  
  const tipo = notifConfig.tipo || 'plantilla_meta';
  console.log(`   📋 Tipo de notificación: ${tipo}`);
  
  // ✅ OPCIÓN 1: Plantilla de Meta
  if (tipo === 'plantilla_meta') {
    const nombrePlantilla = notifConfig.nombre;
    const parametros = (notifConfig.parametros || []).sort((a: any, b: any) => a.orden - b.orden);
    
    console.log(`   📋 Plantilla: ${nombrePlantilla}`);
    console.log(`   🔧 Parámetros configurados: ${parametros.length}`);
    
    // Preparar componentes según parámetros configurados
    const components: any[] = [];
    
    if (parametros.length > 0) {
      const bodyParameters = parametros.map((param: any) => {
        let valor: string;
        
        // Reemplazar variables en el valor
        valor = reemplazarVariables(param.valor, {
          nombre: cliente.nombre,
          turnos: mensajeTurnos
        });
        
        return {
          type: 'text',
          text: valor
        };
      });
      
      components.push({
        type: 'body',
        parameters: bodyParameters
      });
    }
    
    // Construir payload (solo incluir components si hay parámetros)
    const payload: any = {
      messaging_product: 'whatsapp',
      to: cliente.telefono,
      type: 'template',
      template: {
        name: nombrePlantilla,
        language: { code: notifConfig.idioma || 'es' }
      }
    };
    
    // Solo agregar components si hay parámetros
    if (components.length > 0) {
      payload.template.components = components;
    }
    
    console.log(`   📦 Payload generado:`, JSON.stringify(payload, null, 2));
    
    // Obtener phoneNumberId de la empresa
    const empresa = await EmpresaModel.findOne({ nombre: config.empresaId });
    const phoneNumberId = empresa?.phoneNumberId || process.env.META_PHONE_NUMBER_ID;
    console.log(`   📞 Phone Number ID: ${phoneNumberId}`);
    
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    
    await enviarPlantillaMeta(cliente.telefono, url, payload);
    
  } else {
    // ✅ OPCIÓN 2: Texto directo
    const mensajeDirecto = notifConfig.mensajeDirecto || '';
    console.log(`   📝 Mensaje directo configurado`);
    
    // Reemplazar variables en el mensaje
    const mensajeFinal = reemplazarVariables(mensajeDirecto, {
      nombre: cliente.nombre,
      turnos: mensajeTurnos
    });
    
    console.log(`   📤 Mensaje final: ${mensajeFinal.substring(0, 100)}...`);
    
    // Obtener phoneNumberId de la empresa
    const empresa = await EmpresaModel.findOne({ nombre: config.empresaId });
    const phoneNumberId = empresa?.phoneNumberId || process.env.META_PHONE_NUMBER_ID;
    console.log(`   📞 Phone Number ID: ${phoneNumberId}`);
    
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: cliente.telefono,
      type: 'text',
      text: { body: mensajeFinal }
    };
    
    await enviarPlantillaMeta(cliente.telefono, url, payload);
  }
  
  console.log(`✅ Confirmación enviada a ${cliente.nombre}`);
  return true;
}
