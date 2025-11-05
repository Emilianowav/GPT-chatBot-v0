// Script para forzar actualización directa en MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function forzarActualizacion() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db!.collection('configuraciones_modulo');

    // Ver configuración actual
    console.log('📋 Configuración ANTES de actualizar:\n');
    const configAntes = await collection.findOne({ empresaId: 'San Jose' });
    console.log(JSON.stringify(configAntes, null, 2));

    // Actualizar DIRECTAMENTE con MongoDB driver
    console.log('\n🔧 Actualizando diasAntes a 1...\n');
    
    const resultado = await collection.updateOne(
      { empresaId: 'San Jose' },
      {
        $set: {
          'notificaciones.$[].diasAntes': 1
        }
      }
    );

    console.log(`✅ Documentos modificados: ${resultado.modifiedCount}`);

    // Ver configuración después
    console.log('\n📋 Configuración DESPUÉS de actualizar:\n');
    const configDespues = await collection.findOne({ empresaId: 'San Jose' });
    console.log(JSON.stringify(configDespues, null, 2));

    // Verificar específicamente el valor de diasAntes
    console.log('\n🔍 Verificación específica:');
    if (configDespues && configDespues.notificaciones) {
      configDespues.notificaciones.forEach((notif: any, index: number) => {
        console.log(`   Notificación ${index + 1}:`);
        console.log(`      diasAntes: ${notif.diasAntes}`);
        console.log(`      tipo: ${typeof notif.diasAntes}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

forzarActualizacion();
