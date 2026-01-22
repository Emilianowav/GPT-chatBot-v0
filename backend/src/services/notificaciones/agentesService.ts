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
    
    const configuraciones = await ConfiguracionModuloModel.find({
      'plantillasMeta.notificacionDiariaAgentes.activa': true
    });
    
    if (configuraciones.length === 0) {
      console.log(`   ℹ️ No hay empresas con notificación diaria activa\n`);
      return;
    }
    
    for (const config of configuraciones) {
      try {
        
        const notifConfig = config.plantillasMeta?.notificacionDiariaAgentes;
        if (!notifConfig) continue;
        
        const programacion = notifConfig.programacion;
        if (!programacion) continue;
        
        let debeEnviar = false;
        
        if (programacion.metodoVerificacion === 'hora_fija') {
          const horaEnvio = programacion.horaEnvio || '06:00';
          const [horaConfig, minutoConfig] = horaEnvio.split(':').map(Number);
          
          
          const diferenciaMinutos = Math.abs((horaActual * 60 + minutoActual) - (horaConfig * 60 + minutoConfig));
          console.log(`         Diferencia minutos: ${diferenciaMinutos}`);
          
          // ✅ Verificar día de la semana si está configurado
          const diasSemana = programacion.diasSemana;
          const diaActualSemana = ahoraArgentina.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
          
          if (diasSemana && Array.isArray(diasSemana) && diasSemana.length > 0) {
            const esDiaPermitido = diasSemana.includes(diaActualSemana);
            console.log(`         Día actual: ${diaActualSemana} (${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaActualSemana]})`);
            console.log(`         Días permitidos: ${diasSemana.map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d]).join(', ')}`);
            console.log(`         Es día permitido: ${esDiaPermitido}`);
            
            if (!esDiaPermitido) {
              console.log(`         ⏭️ Saltando envío - hoy no es un día configurado`);
              continue;
            }
          }
          
          // ✅ Verificar que no se haya enviado recientemente (últimos 5 minutos)
          const ultimoEnvio = notifConfig.ultimoEnvio;
          let minutosDesdUltimoEnvio = 999;
          
          if (ultimoEnvio) {
            const ultimoEnvioArgentina = new Date(ultimoEnvio.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
            const diferenciaMs = ahoraArgentina.getTime() - ultimoEnvioArgentina.getTime();
            minutosDesdUltimoEnvio = Math.floor(diferenciaMs / 60000);
            console.log(`         Último envío: ${ultimoEnvioArgentina.toLocaleTimeString('es-AR')}`);
            console.log(`         Minutos desde último envío: ${minutosDesdUltimoEnvio}`);
          } else {
            console.log(`         Último envío: Nunca`);
            console.log(`         Minutos desde último envío: ${minutosDesdUltimoEnvio}`);
          }
          
          // Solo enviar si estamos en la ventana de tiempo Y no se envió en los últimos 5 minutos
          debeEnviar = diferenciaMinutos <= 2 && minutosDesdUltimoEnvio >= 5;
          console.log(`         Debe enviar: ${debeEnviar}`);
          
        } else if (programacion.metodoVerificacion === 'inicio_jornada_agente') {
          // ❌ ELIMINADO: Lógica duplicada que causaba envíos múltiples
          // Esta lógica ahora se maneja en enviarNotificacionesDiariasPorEmpresa
          console.log(`      ⚠️ Modo 'inicio_jornada_agente' no soportado actualmente`);
          console.log(`      💡 Usar 'hora_fija' en su lugar`);
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
  console.log(`\n${'*'.repeat(80)}`);
  console.log(`🔔 [ENVÍO AUTOMÁTICO] Iniciando envío diario para empresa`);
  console.log(`   🏢 Empresa: ${config.empresaId}`);
  console.log(`   ⏰ Hora: ${new Date().toLocaleTimeString('es-AR')}`);
  console.log(`${'*'.repeat(80)}\n`);
  
  const { empresaId } = config;
  const notifConfig = config.plantillasMeta?.notificacionDiariaAgentes;
  
  if (!notifConfig || !notifConfig.activa) return;
  
  // ✅ NUEVO: Calcular fecha objetivo según anticipación
  const anticipacion = notifConfig.programacion?.anticipacion ?? notifConfig.anticipacion ?? 0;
  console.log(`   📅 Anticipación configurada: ${anticipacion} días`);
  
  const ahora = new Date();
  const fechaObjetivo = new Date(ahora);
  fechaObjetivo.setDate(fechaObjetivo.getDate() + anticipacion);
  
  const inicio = new Date(fechaObjetivo);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);
  
  console.log(`   🔍 Buscando turnos de agentes para:`);
  console.log(`      Fecha objetivo: ${fechaObjetivo.toLocaleDateString('es-AR')}`);
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
