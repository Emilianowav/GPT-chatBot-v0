// 📅 Servicio de Notificaciones Diarias para Agentes
import { TurnoModel, EstadoTurno } from '../modules/calendar/models/Turno.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { ClienteModel } from '../models/Cliente.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';
import { EmpresaModel } from '../models/Empresa.js';

/**
 * Formatear fecha y hora
 */
function formatearFechaHora(fecha: Date): { fecha: string; hora: string } {
  return {
    fecha: fecha.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    hora: fecha.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
}

/**
 * Enviar notificación vía WhatsApp usando el número del chatbot
 */
async function enviarNotificacion(
  telefono: string, 
  mensaje: string, 
  empresaId: string
): Promise<boolean> {
  try {
    console.log('📤 Enviando notificación diaria:');
    console.log('  Teléfono:', telefono);
    console.log('  Empresa:', empresaId);
    console.log('  Mensaje:', mensaje);
    
    // Obtener configuración de la empresa para el phoneNumberId
    // empresaId puede ser el nombre de la empresa o el ObjectId
    let empresa;
    
    // Intentar primero por nombre (más común en este sistema)
    empresa = await EmpresaModel.findOne({ nombre: empresaId });
    
    // Si no se encuentra y el ID parece ser un ObjectId válido, intentar por _id
    if (!empresa && empresaId.match(/^[0-9a-fA-F]{24}$/)) {
      empresa = await EmpresaModel.findOne({ _id: empresaId });
    }
    
    if (!empresa) {
      console.error('❌ Empresa no encontrada:', empresaId);
      return false;
    }
    
    // Obtener phoneNumberId de la empresa
    const phoneNumberId = (empresa as any).phoneNumberId;
    
    if (!phoneNumberId) {
      console.error('❌ phoneNumberId no configurado para empresa:', empresaId);
      return false;
    }
    
    // Enviar mensaje vía WhatsApp API
    await enviarMensajeWhatsAppTexto(telefono, mensaje, phoneNumberId);
    
    console.log('✅ Notificación diaria enviada exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error al enviar notificación:', error);
    return false;
  }
}

/**
 * Procesar plantilla de mensaje con variables
 */
function procesarPlantilla(plantilla: string, variables: Record<string, any>): string {
  let mensaje = plantilla;
  
  Object.entries(variables).forEach(([clave, valor]) => {
    const regex = new RegExp(`\\{${clave}\\}`, 'g');
    mensaje = mensaje.replace(regex, valor || '');
  });
  
  return mensaje;
}

/**
 * Enviar notificaciones diarias a agentes con sus turnos del día
 */
export async function enviarNotificacionesDiariasAgentes() {
  try {
    console.log('📅 Procesando notificaciones diarias para agentes...');
    
    // Obtener todas las configuraciones con notificaciones diarias activas
    const configuraciones = await ConfiguracionModuloModel.find({
      'notificacionDiariaAgentes.activa': true
    });
    
    console.log(`📋 Encontradas ${configuraciones.length} empresas con notificaciones diarias activas`);
    
    for (const config of configuraciones) {
      try {
        await enviarNotificacionesDiariasPorEmpresa(config);
      } catch (error) {
        console.error(`❌ Error procesando empresa ${config.empresaId}:`, error);
      }
    }
    
    console.log('✅ Procesamiento de notificaciones diarias completado');
    
  } catch (error) {
    console.error('❌ Error en enviarNotificacionesDiariasAgentes:', error);
  }
}

/**
 * Calcular rango de fechas según configuración de filtros
 */
function calcularRangoFechas(rangoHorario: any): { inicio: Date, fin: Date } {
  const ahora = new Date();
  let inicio = new Date(ahora);
  inicio.setHours(0, 0, 0, 0);
  let fin = new Date(inicio);
  
  if (!rangoHorario || !rangoHorario.activo) {
    // Por defecto: solo hoy
    fin.setDate(fin.getDate() + 1);
    return { inicio, fin };
  }
  
  switch (rangoHorario.tipo) {
    case 'hoy':
      fin.setDate(fin.getDate() + 1);
      break;
      
    case 'manana':
      inicio.setDate(inicio.getDate() + 1);
      fin.setDate(fin.getDate() + 2);
      break;
      
    case 'proximos_dias':
      const dias = rangoHorario.diasAdelante || 1;
      fin.setDate(fin.getDate() + dias + 1);
      break;
      
    case 'personalizado':
      if (rangoHorario.fechaInicio) {
        inicio = new Date(rangoHorario.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
      }
      if (rangoHorario.fechaFin) {
        fin = new Date(rangoHorario.fechaFin);
        fin.setHours(23, 59, 59, 999);
      } else {
        fin.setDate(inicio.getDate() + 1);
      }
      break;
      
    default:
      fin.setDate(fin.getDate() + 1);
  }
  
  return { inicio, fin };
}

/**
 * Enviar notificaciones diarias para una empresa específica
 */
async function enviarNotificacionesDiariasPorEmpresa(config: any) {
  const { empresaId, notificacionDiariaAgentes, nomenclatura } = config;
  
  if (!notificacionDiariaAgentes || !notificacionDiariaAgentes.activa) {
    return;
  }
  
  // Calcular rango de fechas según filtros
  const { inicio, fin } = calcularRangoFechas(notificacionDiariaAgentes.rangoHorario);
  
  console.log(`📅 Rango de fechas: ${inicio.toISOString()} - ${fin.toISOString()}`);
  
  // Buscar agentes según configuración
  let agentes;
  
  if (notificacionDiariaAgentes.agentesEspecificos && notificacionDiariaAgentes.agentesEspecificos.length > 0) {
    // Solo agentes específicos
    agentes = await AgenteModel.find({ 
      _id: { $in: notificacionDiariaAgentes.agentesEspecificos },
      empresaId, 
      activo: true 
    });
  } else if (notificacionDiariaAgentes.enviarATodos) {
    // Todos los agentes activos
    agentes = await AgenteModel.find({ empresaId, activo: true });
  } else {
    // Solo agentes con turnos en el rango
    const agentesConTurnos = await TurnoModel.distinct('agenteId', {
      empresaId,
      fechaInicio: { $gte: inicio, $lt: fin },
      estado: { $in: ['pendiente', 'confirmado'] }
    });
    
    agentes = await AgenteModel.find({
      _id: { $in: agentesConTurnos },
      empresaId,
      activo: true
    });
  }
  
  if (agentes.length === 0) {
    console.log(`⚠️ No hay agentes para notificar en empresa ${empresaId}`);
    return;
  }
  
  console.log(`📤 Enviando notificaciones a ${agentes.length} agentes de empresa ${empresaId}`);
  
  // Enviar notificación a cada agente
  for (const agente of agentes) {
    try {
      await enviarNotificacionDiariaAgente(
        agente,
        empresaId,
        inicio,
        fin,
        notificacionDiariaAgentes,
        nomenclatura
      );
    } catch (error) {
      console.error(`❌ Error enviando notificación a agente ${agente._id}:`, error);
    }
  }
}

/**
 * Enviar notificación diaria a un agente específico
 */
async function enviarNotificacionDiariaAgente(
  agente: any,
  empresaId: string,
  hoy: Date,
  manana: Date,
  config: any,
  nomenclatura: any
) {
  if (!agente.telefono) {
    console.log(`⚠️ Agente ${agente._id} no tiene teléfono configurado`);
    return;
  }
  
  // Buscar turnos del día para este agente
  const turnos = await TurnoModel.find({
    empresaId,
    agenteId: agente._id,
    fechaInicio: { $gte: hoy, $lt: manana },
    estado: { $in: ['pendiente', 'confirmado'] }
  }).sort({ fechaInicio: 1 });
  
  if (turnos.length === 0 && !config.enviarATodos) {
    // No tiene turnos y no se envía a todos
    return;
  }
  
  // Construir mensaje
  let mensaje = procesarPlantilla(config.plantillaMensaje, {
    agente: `${agente.nombre} ${agente.apellido}`,
    turnos: nomenclatura.turnos.toLowerCase(),
    cantidad: turnos.length
  });
  
  mensaje += '\n\n';
  
  if (turnos.length === 0) {
    mensaje += `No tienes ${nomenclatura.turnos.toLowerCase()} programados para hoy. 🎉`;
  } else {
    mensaje += `📋 *${turnos.length} ${turnos.length === 1 ? nomenclatura.turno : nomenclatura.turnos}:*\n\n`;
    
    // Agregar detalles de cada turno
    for (let i = 0; i < turnos.length; i++) {
      const turno = turnos[i];
      const { hora } = formatearFechaHora(new Date(turno.fechaInicio));
      
      mensaje += `${i + 1}. 🕐 ${hora}`;
      
      // Obtener datos del cliente
      const cliente = await ClienteModel.findOne({
        _id: turno.clienteId,
        empresaId
      });
      
      // Agregar detalles según configuración
      const detalles: string[] = [];
      
      if (config.incluirDetalles.nombreCliente && cliente) {
        detalles.push(`${cliente.nombre} ${cliente.apellido}`);
      }
      
      if (config.incluirDetalles.telefonoCliente && cliente) {
        detalles.push(`📞 ${cliente.telefono}`);
      }
      
      if (config.incluirDetalles.origen && turno.datos.origen) {
        detalles.push(`📍 Origen: ${turno.datos.origen}`);
      }
      
      if (config.incluirDetalles.destino && turno.datos.destino) {
        detalles.push(`🎯 Destino: ${turno.datos.destino}`);
      }
      
      if (config.incluirDetalles.notasInternas && turno.notasInternas) {
        detalles.push(`📝 ${turno.notasInternas}`);
      }
      
      if (detalles.length > 0) {
        mensaje += '\n   ' + detalles.join('\n   ');
      }
      
      mensaje += '\n\n';
    }
  }
  
  mensaje += `\n¡Que tengas un excelente día! 💪`;
  
  // Enviar notificación
  const enviada = await enviarNotificacion(
    agente.telefono,
    mensaje,
    empresaId
  );
  
  if (enviada) {
    console.log(`✅ Notificación diaria enviada a ${agente.nombre} ${agente.apellido} (${turnos.length} turnos)`);
  }
}

/**
 * Verificar si es hora de enviar notificaciones diarias
 */
export function esHoraDeEnviarNotificacionesDiarias(horaConfiguracion: string): boolean {
  const ahora = new Date();
  const [horaConfig, minutoConfig] = horaConfiguracion.split(':').map(Number);
  
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  
  // Verificar si estamos en la hora configurada (con margen de 5 minutos)
  return horaActual === horaConfig && minutoActual >= minutoConfig && minutoActual < minutoConfig + 5;
}
