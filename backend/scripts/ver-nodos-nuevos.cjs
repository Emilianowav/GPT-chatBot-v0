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

    console.log('📋 Flujo:', flow.nombre);
    console.log('   Total nodos:', flow.nodes.length);
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Buscar nodos nuevos
    const gptAsistente = flow.nodes.find(n => n.id === 'gpt-asistente-ventas');
    const whatsappAsistente = flow.nodes.find(n => n.id === 'whatsapp-asistente');

    console.log('🔍 NODO: gpt-asistente-ventas');
    console.log('═══════════════════════════════════════════════════════════');
    if (gptAsistente) {
      console.log('✅ Encontrado');
      console.log('\nData:');
      console.log(JSON.stringify(gptAsistente.data, null, 2));
      console.log('\nConfig:');
      console.log(JSON.stringify(gptAsistente.data?.config, null, 2));
    } else {
      console.log('❌ No encontrado');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    console.log('🔍 NODO: whatsapp-asistente');
    console.log('═══════════════════════════════════════════════════════════');
    if (whatsappAsistente) {
      console.log('✅ Encontrado');
      console.log('\nData:');
      console.log(JSON.stringify(whatsappAsistente.data, null, 2));
      console.log('\nConfig:');
      console.log(JSON.stringify(whatsappAsistente.data?.config, null, 2));
    } else {
      console.log('❌ No encontrado');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Comparar con un nodo que SÍ funciona
    const whatsappResultados = flow.nodes.find(n => n.id === 'whatsapp-resultados');
    console.log('🔍 NODO COMPARACIÓN: whatsapp-resultados (que SÍ funciona)');
    console.log('═══════════════════════════════════════════════════════════');
    if (whatsappResultados) {
      console.log('✅ Encontrado');
      console.log('\nData:');
      console.log(JSON.stringify(whatsappResultados.data, null, 2));
      console.log('\nConfig:');
      console.log(JSON.stringify(whatsappResultados.data?.config, null, 2));
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    const gptConversacional = flow.nodes.find(n => n.id === 'gpt-conversacional');
    console.log('🔍 NODO COMPARACIÓN: gpt-conversacional (que SÍ funciona)');
    console.log('═══════════════════════════════════════════════════════════');
    if (gptConversacional) {
      console.log('✅ Encontrado');
      console.log('\nData:');
      console.log(JSON.stringify(gptConversacional.data, null, 2));
      console.log('\nConfig:');
      console.log(JSON.stringify(gptConversacional.data?.config, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
