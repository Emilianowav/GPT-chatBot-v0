// 📋 Corregir nombre de plantilla a chofer_sanjose
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function corregir() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    console.log('✅ Conectado');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('configuraciones_modulo');
    
    const docId = new ObjectId('68ff85d78e9f378673d09ff7');
    
    console.log('\n📋 Corrigiendo nombre de plantilla...');
    
    const result = await collection.updateOne(
      { _id: docId },
      {
        $set: {
          'notificacionDiariaAgentes.plantillaMeta.nombre': 'chofer_sanjose'
        }
      }
    );
    
    console.log('✅ Actualizado:', result.modifiedCount, 'documento(s)');
    
    // Verificar
    const doc = await collection.findOne({ _id: docId });
    console.log('\n📊 VERIFICACIÓN:');
    console.log('Plantilla agentes:', doc?.notificacionDiariaAgentes?.plantillaMeta?.nombre);
    console.log('Plantilla clientes:', doc?.notificaciones?.[0]?.plantillaMeta?.nombre);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

corregir();
