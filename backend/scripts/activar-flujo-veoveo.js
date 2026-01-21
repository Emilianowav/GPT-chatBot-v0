import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function activarFlujo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('69705b05e58836243159e64e');
    
    await flowsCollection.updateOne(
      { _id: flowId },
      { 
        $set: { 
          activo: true,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Flujo activado exitosamente');
    console.log('🆔 ID:', flowId.toString());
    console.log('📱 Listo para recibir mensajes de WhatsApp');
    console.log('\n🧪 Prueba enviando: "Busco García Márquez"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

activarFlujo();
