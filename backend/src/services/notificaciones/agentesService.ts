// 🔔 Servicio de Notificaciones Diarias para Agentes

import { ConfiguracionModuloModel } from '../../modules/calendar/models/ConfiguracionModulo.js';
import { AgenteModel } from '../../modules/calendar/models/Agente.js';
import { TurnoModel } from '../../modules/calendar/models/Turno.js';
import { EmpresaModel } from '../../models/Empresa.js';
import { reemplazarVariables, construirListaTurnos, enviarPlantillaMeta } from '../notificacionesMetaService.js';

/**
 * Procesar notificaciones diarias de agentes
 */
export async function procesarNotificacionesDiariasAgentes() {
  try {
    const ahora = new Date();
    const ahoraArgentina = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const horaActual = ahoraArgentina.getHours();
    const minutoActual = ahoraArgentina.getMinutes();
    const diaActual = ahoraArgentina.toISOString().split('T')[0];
    
    const horaFormateada = `${String(horaActual).padStart(2, '0')}:${String(minutoActual).padStart(2, '0')}`;
    console.log(`\n⏰ [${horaFormateada}] Verificando notificaciones diarias de agentes...`);
    
    const configuraciones = await ConfiguracionModuloModel.find({
      'plantillasMeta.notificacionDiariaAgentes.activa': true
    });
    
    console.log(`   📋 Configuraciones activas: ${configuraciones.length}`);
    
    if (configuraciones.length === 0) {
      console.log(`   ℹ️ No hay empresas con notificación diaria activa\n`);
      return;
    }
    
    for (let config of configuraciones) {
      try {
        console.log(`   🏢 Procesando: ${config.empresaId}`);
        
        config = await ConfiguracionModuloModel.findById(config._id) || config;
        
        const notifConfig = config.plantillasMeta?.notificacionDiariaAgentes;
        if (!notifConfig) continue;
        
        const programacion = notifConfig.programacion;
        if (!programacion) continue;
        
        let debeEnviar = false;
        
        if (programacion.metodoVerificacion === 'hora_fija') {
          const horaEnvio = programacion.horaEnvio || '06:00';
          const [horaConfig, minutoConfig] = horaEnvio.split(':').map(Number);
          
          console.log(`      📅 Verificando envío:`);
          console.log(`         Hora configurada: ${horaEnvio}`);
          console.log(`         Hora actual: ${horaFormateada}`);
          
          // ✅ ELIMINADO: Verificación "Ya se envió hoy" para permitir múltiples envíos
          
          const diferenciaMinutos = Math.abs((horaActual * 60 + minutoActual) - (horaConfig * 60 + minutoConfig));
          console.log(`         Diferencia minutos: ${diferenciaMinutos}`);
          debeEnviar = diferenciaMinutos <= 2;
          console.log(`         Debe enviar: ${debeEnviar}`);
          
        } else if (programacion.metodoVerificacion === 'inicio_jornada_agente') {
          const minutosAntes = programacion.minutosAntes || 30;
          
          const inicioHoy = new Date(ahoraArgentina);
          inicioHoy.setHours(0, 0, 0, 0);
          const finHoy = new Date(inicioHoy);
          finHoy.setDate(finHoy.getDate() + 1);
          
          const agentesConTurnos = await TurnoModel.distinct('agenteId', {
            empresaId: config.empresaId,
            fechaInicio: { $gte: inicioHoy, $lt: finHoy },
            estado: { $in: programacion.filtroEstado || ['pendiente', 'confirmado'] }
          });
          
          for (const agenteId of agentesConTurnos) {
            const agente = await AgenteModel.findById(agenteId);
            if (!agente || !agente.disponibilidad) continue;
            
            const diaSemanHoy = ahoraArgentina.getDay();
            const dispHoy = agente.disponibilidad.find((d: any) => d.diaSemana === diaSemanHoy && d.activo);
            
            if (!dispHoy || !dispHoy.horaInicio) continue;
            
            const [horaInicio, minInicio] = dispHoy.horaInicio.split(':').map(Number);
            const minutosInicio = horaInicio * 60 + minInicio;
            const minutosEnvio = minutosInicio - minutosAntes;
            
            const minutosActuales = horaActual * 60 + minutoActual;
            const diferencia = Math.abs(minutosActuales - minutosEnvio);
            
            if (diferencia <= 2) {
              console.log(`      ✅ Enviando a ${agente.nombre}`);
              const { enviarPruebaAgente } = await import('./pruebaService.js');
              await enviarPruebaAgente(agente, config);
            }
          }
          
          continue;
        }
        
        if (debeEnviar) {
          console.log(`⏰ Enviando notificaciones para ${config.empresaId}`);
          await enviarNotificacionesDiariasPorEmpresa(config);
          
          await ConfiguracionModuloModel.findByIdAndUpdate(
            config._id,
            { 'plantillasMeta.notificacionDiariaAgentes.ultimoEnvio': ahora }
          );
          
          console.log(`✅ Notificaciones enviadas`);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando ${config.empresaId}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en procesarNotificacionesDiariasAgentes:', error);
  }
}

async function enviarNotificacionesDiariasPorEmpresa(config: any) {
  const { empresaId } = config;
  const notifConfig = config.plantillasMeta?.notificacionDiariaAgentes;
  
  if (!notifConfig || !notifConfig.activa) return;
  
  const ahora = new Date();
  const inicio = new Date(ahora);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);
  
  console.log(`   🔍 Buscando turnos de agentes entre:`);
  console.log(`      Inicio: ${inicio.toISOString()}`);
  console.log(`      Fin: ${fin.toISOString()}`);
  console.log(`      Estados: ${notifConfig.programacion?.filtroEstado || ['pendiente', 'confirmado']}`);
  
  const agentesConTurnos = await TurnoModel.distinct('agenteId', {
    empresaId,
    fechaInicio: { $gte: inicio, $lt: fin },
    estado: { $in: notifConfig.programacion?.filtroEstado || ['pendiente', 'confirmado'] }
  });
  
  console.log(`   📊 Agentes con turnos encontrados: ${agentesConTurnos.length}`);
  
  const agentes = await AgenteModel.find({
    _id: { $in: agentesConTurnos },
    empresaId,
    activo: true
  });
  
  console.log(`   👤 Agentes activos: ${agentes.length}`);
  
  if (agentes.length === 0) {
    console.log(`   ⚠️ No hay agentes con turnos para hoy`);
    return;
  }
  
  console.log(`📤 Enviando a ${agentes.length} agentes`);
  
  // ✅ USAR LA MISMA LÓGICA QUE EL SERVICIO DE PRUEBA
  const { enviarPruebaAgente } = await import('./pruebaService.js');
  
  for (const agente of agentes) {
    try {
      console.log(`📤 Enviando a: ${agente.nombre} ${agente.apellido}`);
      await enviarPruebaAgente(agente, config);
      console.log(`✅ Enviado a ${agente.nombre}`);
    } catch (error) {
      console.error(`❌ Error enviando a ${agente._id}:`, error);
    }
  }
}
