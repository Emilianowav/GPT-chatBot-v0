const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    // Agregar enabled: true al extractionConfig
    const result = await flowsCollection.updateOne(
      { 
        _id: new ObjectId(FLOW_ID),
        'nodes.id': 'gpt-formateador'
      },
      {
        $set: {
          'nodes.$.data.config.extractionConfig.enabled': true,
          'nodes.$.data.config.extractionConfig.method': 'advanced',
          'nodes.$.data.config.extractionConfig.contextSource': 'historial_completo'
        }
      }
    );
    
    console.log('✅ extractionConfig actualizado');
    console.log(`   Modificados: ${result.modifiedCount}`);
    console.log('\n📝 Cambios aplicados:');
    console.log('   - enabled: true');
    console.log('   - method: "advanced"');
    console.log('   - contextSource: "historial_completo"');
    console.log('\n💡 Ahora el formateador SÍ ejecutará la extracción');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
