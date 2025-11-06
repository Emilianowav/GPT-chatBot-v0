// 📋 Script para activar notificación diaria de agentes
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function activar() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('configuraciones_modulo');
    
    // Buscar configuración de San Jose
    const config = await collection.findOne({ empresaId: 'San Jose' });
    
    if (!config) {
      console.log('❌ No se encontró configuración para San Jose');
      process.exit(1);
    }
    
    console.log('\n📊 ESTADO ACTUAL:');
    console.log('═══════════════════════════════════════');
    console.log('empresaId:', config.empresaId);
    console.log('_id:', config._id);
    
    if (config.notificacionDiariaAgentes) {
      console.log('\n✅ notificacionDiariaAgentes existe');
      console.log('   activa:', config.notificacionDiariaAgentes.activa);
      console.log('   horaEnvio:', config.notificacionDiariaAgentes.horaEnvio);
      console.log('   usarPlantillaMeta:', config.notificacionDiariaAgentes.usarPlantillaMeta);
      console.log('   plantillaMeta:', config.notificacionDiariaAgentes.plantillaMeta?.nombre);
    } else {
      console.log('\n❌ notificacionDiariaAgentes NO existe');
    }
    
    // Activar notificación
    console.log('\n📋 Activando notificación diaria de agentes...');
    
    const result = await collection.updateOne(
      { empresaId: 'San Jose' },
      {
        $set: {
          'notificacionDiariaAgentes.activa': true
        }
      }
    );
    
    console.log('✅ Actualizado:', result.modifiedCount, 'documento(s)');
    
    // Verificar
    const updated = await collection.findOne({ empresaId: 'San Jose' });
    
    console.log('\n📊 VERIFICACIÓN:');
    console.log('═══════════════════════════════════════');
    console.log('notificacionDiariaAgentes.activa:', updated?.notificacionDiariaAgentes?.activa);
    console.log('notificacionDiariaAgentes.horaEnvio:', updated?.notificacionDiariaAgentes?.horaEnvio);
    console.log('notificacionDiariaAgentes.usarPlantillaMeta:', updated?.notificacionDiariaAgentes?.usarPlantillaMeta);
    console.log('notificacionDiariaAgentes.plantillaMeta.nombre:', updated?.notificacionDiariaAgentes?.plantillaMeta?.nombre);
    console.log('═══════════════════════════════════════');
    
    if (updated?.notificacionDiariaAgentes?.activa) {
      console.log('\n✅ NOTIFICACIÓN DIARIA DE AGENTES ACTIVADA!');
      console.log('\n📝 Próximos pasos:');
      console.log('   1. Reinicia el servidor backend');
      console.log('   2. Recarga el frontend');
      console.log('   3. El flujo debería aparecer activo');
    } else {
      console.log('\n⚠️ La notificación sigue inactiva');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

activar();
