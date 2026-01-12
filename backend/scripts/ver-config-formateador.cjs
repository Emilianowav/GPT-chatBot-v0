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
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    if (!formateador) {
      console.error('❌ Nodo gpt-formateador no encontrado');
      return;
    }
    
    console.log('📋 CONFIGURACIÓN DEL NODO gpt-formateador:\n');
    console.log('tipo:', formateador.data.config.tipo);
    console.log('\nextractionConfig:');
    console.log(JSON.stringify(formateador.data.config.extractionConfig, null, 2));
    console.log('\nvariablesRecopilar:');
    console.log(JSON.stringify(formateador.data.config.variablesRecopilar, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
