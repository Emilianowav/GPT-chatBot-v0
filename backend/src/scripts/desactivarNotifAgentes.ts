// 📋 Desactivar notificaciones diarias de agentes temporalmente
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function desactivar() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('configuraciones_modulo');
    
    const docId = new ObjectId('68ff85d78e9f378673d09ff7');
    
    console.log('\n📋 Desactivando notificaciones diarias automáticas...');
    
    const result = await collection.updateOne(
      { _id: docId },
      {
        $set: {
          'notificacionDiariaAgentes.activa': false
        }
      }
    );
    
    console.log('✅ Actualizado:', result.modifiedCount, 'documento(s)');
    
    // Verificar
    const doc = await collection.findOne({ _id: docId });
    console.log('\n📊 VERIFICACIÓN:');
    console.log('Notificaciones diarias activas:', doc?.notificacionDiariaAgentes?.activa);
    console.log('\n💡 Las notificaciones automáticas están DESACTIVADAS');
    console.log('   Solo se enviarán cuando uses el botón "Probar" desde el frontend');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

desactivar();
