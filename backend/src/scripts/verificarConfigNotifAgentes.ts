// 📋 Verificar configuración de notificaciones diarias de agentes
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function verificar() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('configuraciones_modulo');
    
    const docId = new ObjectId('68ff85d78e9f378673d09ff7');
    
    const doc = await collection.findOne({ _id: docId });
    
    console.log('\n📊 CONFIGURACIÓN ACTUAL:');
    console.log('='.repeat(60));
    console.log('\n🔔 Notificación Diaria Agentes:');
    console.log(JSON.stringify(doc?.notificacionDiariaAgentes, null, 2));
    
    if (doc?.notificacionDiariaAgentes?.activa) {
      console.log('\n⚠️ NOTIFICACIONES DIARIAS ACTIVAS');
      console.log('   Hora de envío:', doc.notificacionDiariaAgentes.horaEnvio);
      console.log('   Enviar a todos:', doc.notificacionDiariaAgentes.enviarATodos);
      console.log('   Usar plantilla Meta:', doc.notificacionDiariaAgentes.usarPlantillaMeta);
      console.log('   Plantilla:', doc.notificacionDiariaAgentes.plantillaMeta?.nombre);
    } else {
      console.log('\n✅ Notificaciones diarias INACTIVAS');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

verificar();
