// 🧪 Script para enviar notificación de confirmación de prueba
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import { TurnoModel } from '../src/modules/calendar/models/Turno.js';
import { ContactoEmpresaModel } from '../src/models/ContactoEmpresa.js';
import { enviarNotificacionConfirmacion } from '../src/modules/calendar/services/confirmacionTurnosService.js';

const EMPRESA_ID = 'San Jose';

async function enviarNotificacionPrueba() {
  try {
    console.log('🧪 Enviando notificación de prueba...\n');
    await connectDB();
    
    // Buscar turnos de mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);
    
    const finDia = new Date(manana);
    finDia.setHours(23, 59, 59, 999);
    
    console.log(`📅 Buscando turnos para: ${manana.toLocaleDateString('es-AR')}`);
    
    const turnos = await TurnoModel.find({
      empresaId: EMPRESA_ID,
      fechaInicio: {
        $gte: manana,
        $lte: finDia
      },
      estado: { $in: ['pendiente', 'no_confirmado'] }
    }).populate('clienteId');
    
    console.log(`📋 Turnos encontrados: ${turnos.length}\n`);
    
    if (turnos.length === 0) {
      console.log('⚠️ No hay turnos para mañana');
      console.log('\n💡 Tip: Crea un turno para mañana desde el frontend o usa:');
      console.log('   npm run crear:turno-prueba');
      process.exit(0);
    }
    
    // Agrupar por cliente
    const turnosPorCliente = new Map<string, any[]>();
    
    for (const turno of turnos) {
      const clienteId = turno.clienteId.toString();
      if (!turnosPorCliente.has(clienteId)) {
        turnosPorCliente.set(clienteId, []);
      }
      turnosPorCliente.get(clienteId)!.push(turno);
    }
    
    console.log(`👥 Clientes únicos: ${turnosPorCliente.size}\n`);
    
    // Enviar notificación a cada cliente
    let enviadas = 0;
    let errores = 0;
    
    for (const [clienteId, turnosCliente] of turnosPorCliente.entries()) {
      try {
        const contacto = await ContactoEmpresaModel.findById(clienteId);
        
        if (!contacto) {
          console.log(`⚠️ Cliente ${clienteId} no encontrado`);
          continue;
        }
        
        console.log(`📨 Enviando notificación a: ${contacto.nombre} ${contacto.apellido} (${contacto.telefono})`);
        console.log(`   Turnos: ${turnosCliente.length}`);
        
        turnosCliente.forEach((turno, index) => {
          const fechaInicio = new Date(turno.fechaInicio);
          const hora = fechaInicio.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          console.log(`   ${index + 1}. ${hora} - ${turno.datos?.origen || 'N/A'} → ${turno.datos?.destino || 'N/A'}`);
        });
        
        const enviado = await enviarNotificacionConfirmacion(
          clienteId,
          turnosCliente,
          EMPRESA_ID
        );
        
        if (enviado) {
          enviadas++;
          console.log(`   ✅ Notificación enviada\n`);
        } else {
          errores++;
          console.log(`   ❌ Error al enviar notificación\n`);
        }
        
        // Esperar 2 segundos entre envíos
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        errores++;
        console.error(`❌ Error procesando cliente ${clienteId}:`, error);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`✅ Notificaciones enviadas: ${enviadas}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📋 Total clientes: ${turnosPorCliente.size}`);
    console.log(`🚗 Total turnos: ${turnos.length}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 PRÓXIMOS PASOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Revisa tu WhatsApp para ver el mensaje');
    console.log('2. Responde con:');
    console.log('   - "1" para confirmar todos los viajes');
    console.log('   - "2" para editar un viaje específico');
    console.log('   - Número del viaje para editarlo directamente');
    console.log('\n3. Si editas un viaje, podrás:');
    console.log('   - Cambiar origen');
    console.log('   - Cambiar destino');
    console.log('   - Cambiar hora');
    console.log('   - Confirmar el viaje');
    console.log('   - Cancelar el viaje');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

enviarNotificacionPrueba();
