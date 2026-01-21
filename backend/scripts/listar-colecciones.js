import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'neural_chatbot';

async function listarColecciones() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();

    console.log('\n📋 Colecciones en la base de datos:', DB_NAME);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const collection of collections) {
      console.log(`  - ${collection.name}`);
    }

    // Buscar específicamente api_configurations
    const apiConfigsCollection = db.collection('api_configurations');
    const count = await apiConfigsCollection.countDocuments();
    
    console.log('\n🔍 Documentos en api_configurations:', count);
    
    if (count > 0) {
      const docs = await apiConfigsCollection.find({}).toArray();
      console.log('\n📄 Documentos encontrados:');
      docs.forEach((doc, index) => {
        console.log(`\n${index + 1}. ${doc.nombre || doc.name || 'Sin nombre'}`);
        console.log(`   Tipo: ${doc.tipo || 'N/A'}`);
        console.log(`   API Key: ${doc.autenticacion?.configuracion?.apiKey ? '***' + doc.autenticacion.configuracion.apiKey.slice(-8) : 'No encontrada'}`);
        console.log(`   Variables API Key: ${doc.variables?.apiKey ? '***' + doc.variables.apiKey.slice(-8) : 'No encontrada'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

listarColecciones();
