const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const API_CONFIG_ID = '695320fda03785dacc8d950b';

async function verConfig() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('api_configurations');
    
    const config = await collection.findOne({ _id: new ObjectId(API_CONFIG_ID) });
    
    if (!config) {
      console.log('❌ No se encontró la configuración');
      return;
    }
    
    console.log('📋 CONFIGURACIÓN WOOCOMMERCE:');
    console.log('═══════════════════════════════════════\n');
    console.log('ID:', config._id);
    console.log('Nombre:', config.nombre);
    console.log('Tipo:', config.tipo);
    console.log('BaseURL:', config.baseUrl);
    console.log('\n🔐 AUTENTICACIÓN:');
    console.log(JSON.stringify(config.autenticacion || config.auth, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verConfig();
