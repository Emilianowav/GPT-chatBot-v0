// 📅 Script para enviar notificaciones diarias de confirmación de viajes
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { enviarNotificacionConfirmacionViajes } from '../services/notificacionesViajesService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

/**
 * Enviar notificaciones a todos los clientes con viajes para mañana
 */
async function enviarNotificacionesDiarias() {
  try {
    console.log('🚀 Iniciando envío de notificaciones diarias...');

    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Calcular rango de fechas para mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);

    const finDia = new Date(manana);
    finDia.setHours(23, 59, 59, 999);

    console.log('📅 Buscando turnos para:', manana.toLocaleDateString('es-AR'));

    // Obtener todos los turnos para mañana
    const turnos = await TurnoModel.find({
      fechaInicio: {
        $gte: manana,
        $lte: finDia
      },
      estado: { $in: ['pendiente', 'confirmado'] }
    }).populate('empresaId');

    console.log(`📋 Turnos encontrados: ${turnos.length}`);

    // Agrupar turnos por cliente y empresa
    const turnosPorCliente = new Map<string, { empresaTelefono: string; count: number }>();

    for (const turno of turnos) {
      const clienteId = turno.clienteId;
      const empresaTelefono = (turno as any).empresaId?.telefono;

      if (!clienteId || !empresaTelefono) {
        console.warn('⚠️ Turno sin cliente o empresa:', turno._id);
        continue;
      }

      const clave = `${clienteId}_${empresaTelefono}`;
      
      if (!turnosPorCliente.has(clave)) {
        turnosPorCliente.set(clave, {
          empresaTelefono,
          count: 1
        });
      } else {
        const info = turnosPorCliente.get(clave)!;
        info.count++;
      }
    }

    console.log(`👥 Clientes únicos: ${turnosPorCliente.size}`);

    // Enviar notificación a cada cliente
    let enviadas = 0;
    let errores = 0;

    for (const [clave, info] of turnosPorCliente.entries()) {
      const [clienteTelefono, empresaTelefono] = clave.split('_');

      try {
        console.log(`📨 Enviando notificación a ${clienteTelefono} (${info.count} viajes)...`);
        
        await enviarNotificacionConfirmacionViajes(
          clienteTelefono,
          empresaTelefono
        );

        enviadas++;
        console.log(`✅ Notificación enviada a ${clienteTelefono}`);

        // Esperar 1 segundo entre envíos para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errores++;
        console.error(`❌ Error al enviar notificación a ${clienteTelefono}:`, error);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`  ✅ Notificaciones enviadas: ${enviadas}`);
    console.log(`  ❌ Errores: ${errores}`);
    console.log(`  📋 Total clientes: ${turnosPorCliente.size}`);

  } catch (error) {
    console.error('💥 Error en envío de notificaciones:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

// Ejecutar script
enviarNotificacionesDiarias()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
