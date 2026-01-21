/**
 * 🔧 SIMPLIFICAR RESERVA SAN JOSE
 * 
 * Quita campos: origen, destino, horario
 * Deja solo: fecha y pasajeros
 * Permite completar datos desde CRM después
 */

import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

async function simplificarReserva() {
  try {
    console.log('\n🔧 SIMPLIFICANDO RESERVA - SAN JOSE\n');
    console.log('='.repeat(80));
    
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Actualizar configuración del módulo
    const result = await db.collection('configuraciones_modulo').updateOne(
      { empresaId: 'San Jose' },
      {
        $set: {
          'camposPersonalizados': [
            {
              clave: 'fecha',
              etiqueta: '📅 Fecha del viaje',
              tipo: 'fecha',
              requerido: true,
              placeholder: 'DD/MM/AAAA',
              orden: 1
            },
            {
              clave: 'pasajeros',
              etiqueta: '👥 Cantidad de pasajeros',
              tipo: 'numero',
              requerido: true,
              placeholder: '1, 2, 3...',
              validacion: {
                min: 1,
                max: 10
              },
              orden: 2
            }
          ],
          'mensajesFlujo.datosIncompletos': '⚠️ Este viaje tiene datos incompletos. El operador te contactará para confirmar origen, destino y horario.',
          'alertarDatosIncompletos': true
        }
      }
    );
    
    console.log('✅ Configuración actualizada');
    console.log(`   Documentos modificados: ${result.modifiedCount}`);
    
    console.log('\n📋 CAMPOS PERSONALIZADOS ACTUALIZADOS:');
    console.log('   1. Fecha del viaje (requerido)');
    console.log('   2. Cantidad de pasajeros (requerido)');
    
    console.log('\n❌ CAMPOS ELIMINADOS:');
    console.log('   - Origen');
    console.log('   - Destino');
    console.log('   - Horario');
    
    console.log('\n✅ Ahora el operador podrá completar estos datos desde el CRM');
    console.log('✅ Se mostrará alerta en turnos con datos incompletos\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB\n');
  }
}

simplificarReserva().catch(console.error);
