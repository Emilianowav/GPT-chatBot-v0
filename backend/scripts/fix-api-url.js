import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'neural_chatbot';

async function fixApiUrl() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db(DB_NAME);
    const apiConfigCollection = db.collection('api_configurations');
    
    // Buscar la API de Mis Canchas
    const api = await apiConfigCollection.findOne({
      nombre: /Mis Canchas/i
    });
    
    if (!api) {
      console.log('❌ No se encontró la API de Mis Canchas');
      return;
    }
    
    console.log('📋 API encontrada:', {
      _id: api._id,
      nombre: api.nombre,
      baseUrl: api.baseUrl
    });
    
    // Corregir URL si tiene el error
    if (api.baseUrl.includes('https:/web')) {
      const nuevaUrl = api.baseUrl.replace('https:/web', 'https://web');
      
      console.log('🔧 Corrigiendo URL:');
      console.log('   Antes:', api.baseUrl);
      console.log('   Después:', nuevaUrl);
      
      const result = await apiConfigCollection.updateOne(
        { _id: api._id },
        { $set: { baseUrl: nuevaUrl } }
      );
      
      console.log('✅ URL actualizada:', result.modifiedCount, 'documento(s) modificado(s)');
    } else {
      console.log('✅ La URL ya está correcta:', api.baseUrl);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

fixApiUrl();
