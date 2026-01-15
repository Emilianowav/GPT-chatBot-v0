const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const API_CONFIG_ID = '695320fda03785dacc8d950b';

async function fix() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('api_configurations');
    
    const config = await collection.findOne({ _id: new ObjectId(API_CONFIG_ID) });
    
    if (!config) {
      console.log('❌ Configuración no encontrada');
      return;
    }
    
    console.log('📋 URL ACTUAL:');
    console.log(`   ${config.baseUrl}`);
    
    // Corregir la URL
    const urlCorrecta = 'https://www.veoveolibros.com.ar';
    
    await collection.updateOne(
      { _id: new ObjectId(API_CONFIG_ID) },
      { $set: { baseUrl: urlCorrecta } }
    );
    
    console.log('\n✅ URL CORREGIDA:');
    console.log(`   ${urlCorrecta}`);
    console.log('\n📝 El servicio agregará automáticamente: /wp-json/wc/v3');
    console.log('📍 URL final: https://www.veoveolibros.com.ar/wp-json/wc/v3/products');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
