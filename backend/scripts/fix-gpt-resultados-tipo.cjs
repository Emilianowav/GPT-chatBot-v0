const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    const resultadosNode = flow.nodes.find(n => n.id === 'gpt-resultados');
    
    if (!resultadosNode) {
      console.log('❌ Nodo gpt-resultados no encontrado');
      return;
    }
    
    console.log('📝 ANTES:');
    console.log(`   tipo: ${resultadosNode.data.config.tipo}`);
    
    // Cambiar de formateador a conversacional
    const result = await flowsCollection.updateOne(
      { 
        _id: new ObjectId(FLOW_ID),
        'nodes.id': 'gpt-resultados'
      },
      {
        $set: {
          'nodes.$.data.config.tipo': 'conversacional'
        }
      }
    );
    
    console.log('\n✅ Tipo actualizado en PRODUCCIÓN');
    console.log(`   Nodos modificados: ${result.modifiedCount}`);
    console.log('\n📝 AHORA:');
    console.log('   tipo: conversacional');
    console.log('\n💡 El nodo ahora hará una llamada a GPT para formatear los productos');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

main();
