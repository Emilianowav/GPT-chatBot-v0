// Script para diagnosticar por qué no llegó una notificación específica
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function diagnosticarNotificacion() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI, {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    const empresaId = 'San Jose';
    const ahora = new Date();

    console.log('📅 DIAGNÓSTICO DE NOTIFICACIONES AUTOMÁTICAS');
    console.log('='.repeat(60));
    console.log(`Hora actual: ${ahora.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
    console.log(`Timestamp: ${ahora.toISOString()}\n`);

    // 1. Verificar configuración
    console.log('1️⃣ VERIFICANDO CONFIGURACIÓN...');
    const config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      console.log('❌ No existe configuración para', empresaId);
      process.exit(1);
    }

    const notifConfirmacion = config.notificaciones.find(n => n.tipo === 'confirmacion');
    if (!notifConfirmacion) {
      console.log('❌ No existe notificación de confirmación');
      process.exit(1);
    }

    console.log('✅ Configuración encontrada:');
    console.log(`   - Activa: ${notifConfirmacion.activa}`);
    console.log(`   - Momento: ${notifConfirmacion.momento}`);
    console.log(`   - Horas antes: ${(notifConfirmacion as any).horasAntesTurno || 'N/A'}`);
    console.log(`   - Días antes: ${notifConfirmacion.diasAntes || 'N/A'}`);
    console.log(`   - Hora envío: ${notifConfirmacion.horaEnvio || 'N/A'}`);
    console.log(`   - Estados filtrados: ${notifConfirmacion.filtros?.estados?.join(', ') || 'todos'}\n`);

    if (!notifConfirmacion.activa) {
      console.log('⚠️ LA NOTIFICACIÓN ESTÁ DESACTIVADA');
      process.exit(0);
    }

    // 2. Calcular rango de búsqueda
    console.log('2️⃣ CALCULANDO RANGO DE BÚSQUEDA...');
    let fechaInicio: Date;
    let fechaFin: Date;

    if (notifConfirmacion.momento === 'horas_antes_turno' && (notifConfirmacion as any).horasAntesTurno) {
      const horasMs = (notifConfirmacion as any).horasAntesTurno * 60 * 60 * 1000;
      fechaInicio = new Date(ahora.getTime() + horasMs - 5 * 60 * 1000); // -5 min
      fechaFin = new Date(ahora.getTime() + horasMs + 5 * 60 * 1000); // +5 min
      
      console.log(`✅ Modo: ${(notifConfirmacion as any).horasAntesTurno} horas antes`);
      console.log(`   Buscando turnos entre:`);
      console.log(`   - Desde: ${fechaInicio.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
      console.log(`   - Hasta: ${fechaFin.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}\n`);
    } else {
      console.log('⚠️ Modo no soportado en este diagnóstico');
      process.exit(0);
    }

    // 3. Buscar turnos que deberían recibir notificación
    console.log('3️⃣ BUSCANDO TURNOS...');
    
    const filtro: any = {
      empresaId,
      fechaInicio: {
        $gte: fechaInicio,
        $lte: fechaFin
      }
    };

    // Aplicar filtros de estado
    if (notifConfirmacion.filtros?.estados && notifConfirmacion.filtros.estados.length > 0) {
      filtro.estado = { $in: notifConfirmacion.filtros.estados };
      console.log(`   Filtrando por estados: ${notifConfirmacion.filtros.estados.join(', ')}`);
    }

    // Filtrar solo sin notificar
    if (notifConfirmacion.filtros?.soloSinNotificar) {
      filtro['notificaciones.enviada'] = { $ne: true };
      console.log(`   Filtrando: solo turnos sin notificar`);
    }

    console.log('\n   Query MongoDB:', JSON.stringify(filtro, null, 2));

    const turnos = await TurnoModel.find(filtro)
      .populate('clienteId')
      .populate('agenteId')
      .sort({ fechaInicio: 1 });

    console.log(`\n   Turnos encontrados: ${turnos.length}\n`);

    if (turnos.length === 0) {
      console.log('❌ NO SE ENCONTRARON TURNOS QUE CUMPLAN LOS CRITERIOS\n');
      console.log('💡 POSIBLES CAUSAS:');
      console.log('   1. El turno no está en el rango de tiempo (±5 minutos)');
      console.log('   2. El estado del turno no está en los filtros');
      console.log('   3. El turno ya tiene notificacionEnviada = true');
      console.log('   4. El turno no existe o fue eliminado\n');

      // Buscar turnos cercanos sin filtros
      console.log('🔍 BUSCANDO TURNOS CERCANOS (sin filtros)...');
      const turnosCercanos = await TurnoModel.find({
        empresaId,
        fechaInicio: {
          $gte: new Date(ahora.getTime() + 23 * 60 * 60 * 1000),
          $lte: new Date(ahora.getTime() + 25 * 60 * 60 * 1000)
        }
      }).populate('clienteId');

      if (turnosCercanos.length > 0) {
        console.log(`\n✅ Encontrados ${turnosCercanos.length} turnos en las próximas 24h:`);
        turnosCercanos.forEach((turno, i) => {
          console.log(`\n   ${i + 1}. Turno ID: ${turno._id}`);
          console.log(`      Fecha/Hora: ${turno.fechaInicio.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
          console.log(`      Estado: ${turno.estado}`);
          const notifEnviada = (turno as any).notificaciones?.some((n: any) => n.enviada);
          console.log(`      Notificación enviada: ${notifEnviada || false}`);
          console.log(`      Cliente: ${(turno.clienteId as any)?.nombre || 'N/A'}`);
          console.log(`      Teléfono: ${(turno.clienteId as any)?.telefono || 'N/A'}`);
          
          // Calcular diferencia
          const diffMs = turno.fechaInicio.getTime() - ahora.getTime();
          const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          console.log(`      Tiempo restante: ${diffHoras}h ${diffMinutos}m`);
          
          // Diagnosticar por qué no se envió
          const problemas = [];
          if (!notifConfirmacion.filtros?.estados?.includes(turno.estado)) {
            problemas.push(`Estado "${turno.estado}" no está en filtros`);
          }
          if (notifEnviada) {
            problemas.push('Ya tiene notificación enviada');
          }
          if (diffHoras < 23 || diffHoras > 25) {
            problemas.push(`Fuera del rango de 24h (${diffHoras}h)`);
          }
          
          if (problemas.length > 0) {
            console.log(`      ⚠️ Problemas: ${problemas.join(', ')}`);
          } else {
            console.log(`      ✅ Debería recibir notificación`);
          }
        });
      } else {
        console.log('\n❌ No hay turnos en las próximas 24 horas');
      }
    } else {
      console.log('✅ TURNOS QUE DEBERÍAN RECIBIR NOTIFICACIÓN:\n');
      turnos.forEach((turno, i) => {
        const notifEnviada = (turno as any).notificaciones?.some((n: any) => n.enviada);
        console.log(`${i + 1}. Turno ID: ${turno._id}`);
        console.log(`   Fecha/Hora: ${turno.fechaInicio.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
        console.log(`   Estado: ${turno.estado}`);
        console.log(`   Cliente: ${(turno.clienteId as any)?.nombre || 'N/A'}`);
        console.log(`   Teléfono: ${(turno.clienteId as any)?.telefono || 'N/A'}`);
        console.log(`   Notificación enviada: ${notifEnviada || false}\n`);
      });

      console.log('💡 ESTOS TURNOS DEBERÍAN RECIBIR LA NOTIFICACIÓN');
      console.log('   Si no llegó, verifica:');
      console.log('   1. Que el cron job esté corriendo en Render');
      console.log('   2. Los logs de Render para ver errores de envío');
      console.log('   3. Que MODO_DEV=false en las variables de entorno');
      console.log('   4. Que el token de WhatsApp sea válido');
    }

    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnosticarNotificacion();
