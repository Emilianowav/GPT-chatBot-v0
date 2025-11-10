// 🔔 Servicio de Notificaciones de Confirmación para Clientes

import { ConfiguracionModuloModel } from '../../modules/calendar/models/ConfiguracionModulo.js';
import { TurnoModel } from '../../modules/calendar/models/Turno.js';
import { EmpresaModel } from '../../models/Empresa.js';
import { reemplazarVariables, enviarPlantillaMeta } from '../notificacionesMetaService.js';

/**
 * Procesar notificaciones de confirmación
 */
export async function procesarNotificacionesConfirmacion() {
  try {
    const ahora = new Date();
    const horaActual = ahora.getUTCHours();
    const minutoActual = ahora.getUTCMinutes();
    const horaFormateada = `${String(horaActual).padStart(2, '0')}:${String(minutoActual).padStart(2, '0')}`;
    
    console.log(`\n⏰ [${horaFormateada}] Verificando notificaciones de confirmación...`);
    
    const configuraciones = await ConfiguracionModuloModel.find({
      'plantillasMeta.confirmacionTurnos.activa': true
    });
    
    console.log(`   📋 Configuraciones activas: ${configuraciones.length}`);
    
    if (configuraciones.length === 0) {
      console.log(`   ℹ️ No hay empresas con confirmación activa\n`);
      return;
    }
    
    for (const config of configuraciones) {
      try {
        console.log(`   🏢 Procesando: ${config.empresaId}`);
        
        const notifConfig = config.plantillasMeta?.confirmacionTurnos;
        if (!notifConfig) continue;
        
        const programacion = notifConfig.programacion;
        if (!programacion) continue;
        
        let debeEnviar = false;
        let fechaInicio: Date;
        let fechaFin: Date;
        
        if (programacion.metodoVerificacion === 'hora_fija') {
          const horaEnvio = programacion.horaEnvio || '22:00';
          const [horaConfig, minutoConfig] = horaEnvio.split(':').map(Number);
          
          const horaUTC = (horaConfig + 3) % 24;
          const diferenciaMinutos = Math.abs((horaActual * 60 + minutoActual) - (horaUTC * 60 + minutoConfig));
          debeEnviar = diferenciaMinutos <= 2;
          
          if (debeEnviar) {
            const diasAntes = programacion.diasAntes || 1;
            fechaInicio = new Date(ahora);
            fechaInicio.setDate(fechaInicio.getDate() + diasAntes);
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin = new Date(fechaInicio);
            fechaFin.setHours(23, 59, 59, 999);
          }
          
        } else if (programacion.metodoVerificacion === 'horas_antes_turno') {
          const horasAntes = programacion.horasAntes || 24;
          const horasMs = horasAntes * 60 * 60 * 1000;
          
          fechaInicio = new Date(ahora.getTime() + horasMs - 5 * 60 * 1000);
          fechaFin = new Date(ahora.getTime() + horasMs + 5 * 60 * 1000);
          debeEnviar = true;
        }
        
        if (debeEnviar && fechaInicio! && fechaFin!) {
          console.log(`⏰ Enviando confirmaciones para ${config.empresaId}`);
          await enviarConfirmacionesPorEmpresa(config, fechaInicio!, fechaFin!);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando ${config.empresaId}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en procesarNotificacionesConfirmacion:', error);
  }
}

async function enviarConfirmacionesPorEmpresa(
  config: any,
  fechaInicio: Date,
  fechaFin: Date
) {
  const { empresaId } = config;
  const notifConfig = config.plantillasMeta?.confirmacionTurnos;
  
  if (!notifConfig || !notifConfig.activa) return;
  
  console.log(`   🔍 Buscando turnos entre:`);
  console.log(`      Inicio: ${fechaInicio.toISOString()}`);
  console.log(`      Fin: ${fechaFin.toISOString()}`);
  console.log(`      Estados: ${notifConfig.programacion?.filtroEstado || ['no_confirmado', 'pendiente']}`);
  
  const hace12Horas = new Date(Date.now() - 12 * 60 * 60 * 1000);
  
  const turnos = await TurnoModel.find({
    empresaId,
    fechaInicio: { $gte: fechaInicio, $lte: fechaFin },
    estado: { $in: notifConfig.programacion?.filtroEstado || ['no_confirmado', 'pendiente'] },
    $or: [
      { notificaciones: { $exists: false } },
      { notificaciones: { $size: 0 } },
      {
        'notificaciones': {
          $not: {
            $elemMatch: {
              tipo: 'confirmacion',
              enviadaEn: { $gte: hace12Horas }
            }
          }
        }
      }
    ]
  });
  
  if (turnos.length === 0) {
    console.log(`ℹ️ No hay turnos para confirmar`);
    return;
  }
  
  console.log(`📤 Enviando confirmaciones para ${turnos.length} turnos`);
  
  const turnosPorCliente = new Map<string, any[]>();
  const { ContactoEmpresaModel } = await import('../../models/ContactoEmpresa.js');
  
  for (const turno of turnos) {
    // ✅ Validar que el turno tenga cliente
    if (!turno.clienteId) {
      console.log(`⚠️ Turno ${turno._id} sin cliente, saltando...`);
      continue;
    }
    
    // ✅ Manejar clienteId como string o ObjectId
    let clienteId: string;
    if (typeof turno.clienteId === 'string') {
      clienteId = turno.clienteId;
    } else if ((turno.clienteId as any)._id) {
      clienteId = (turno.clienteId as any)._id.toString();
    } else {
      console.log(`⚠️ Turno ${turno._id} con clienteId inválido, saltando...`);
      continue;
    }
    
    // ✅ Buscar el cliente manualmente si no está populado
    let clienteObj: any = turno.clienteId;
    if (typeof turno.clienteId === 'string') {
      const cliente = await ContactoEmpresaModel.findById(clienteId);
      if (!cliente) {
        console.log(`⚠️ Cliente ${clienteId} no encontrado, saltando turno ${turno._id}...`);
        continue;
      }
      clienteObj = cliente;
    }
    
    if (!turnosPorCliente.has(clienteId)) {
      turnosPorCliente.set(clienteId, []);
    }
    // Guardar turno con cliente como objeto separado
    turnosPorCliente.get(clienteId)!.push({ turno, cliente: clienteObj });
  }
  
  console.log(`📊 Enviando a ${turnosPorCliente.size} clientes`);
  
  // ✅ USAR FUNCIÓN ESPECÍFICA PARA CRON (no busca turnos de nuevo)
  const { enviarConfirmacionConTurnos } = await import('./pruebaService.js');
  
  for (const [clienteId, turnosData] of turnosPorCliente.entries()) {
    try {
      const cliente = turnosData[0].cliente;
      const turnos = turnosData.map(td => td.turno);
      
      console.log(`   🔍 Validando cliente ${clienteId}:`);
      console.log(`      - Existe: ${!!cliente}`);
      console.log(`      - Tiene telefono: ${!!cliente?.telefono}`);
      console.log(`      - Valor telefono: "${cliente?.telefono}"`);
      console.log(`      - Tipo telefono: ${typeof cliente?.telefono}`);
      
      if (!cliente) {
        console.error(`❌ Cliente no existe: ${clienteId}`);
        continue;
      }
      
      if (!cliente.telefono || cliente.telefono.trim() === '') {
        console.error(`❌ Cliente sin teléfono válido: ${clienteId}`);
        console.log(`   Cliente object:`, cliente);
        continue;
      }
      
      console.log(`📤 Enviando a: ${cliente.nombre} ${cliente.apellido} (${cliente.telefono})`);
      await enviarConfirmacionConTurnos(cliente, turnos, config);
      console.log(`✅ Enviado a ${cliente.nombre}`);
      
      // Marcar turnos como notificados
      for (const turno of turnos) {
        if (!turno.notificaciones) turno.notificaciones = [];
        turno.notificaciones.push({
          tipo: 'confirmacion',
          programadaPara: new Date(),
          enviada: true,
          enviadaEn: new Date(),
          plantilla: notifConfig.nombre
        });
        await turno.save();
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error enviando a cliente ${clienteId}:`, error);
    }
  }
}
