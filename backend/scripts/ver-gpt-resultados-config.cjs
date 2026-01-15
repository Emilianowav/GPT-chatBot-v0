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
    
    const resultadosNode = flow.nodes.find(n => n.id === 'gpt-resultados' || n.data?.label?.includes('resultados'));
    
    if (!resultadosNode) {
      console.log('❌ Nodo gpt-resultados no encontrado');
      console.log('\n📋 Nodos disponibles:');
      flow.nodes.forEach(n => {
        console.log(`   - ${n.id}: ${n.data?.label || 'sin label'} (${n.data?.config?.tipo || 'sin tipo'})`);
      });
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('GPT RESULTADOS - CONFIGURACIÓN COMPLETA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`📋 ID: ${resultadosNode.id}`);
    console.log(`📋 LABEL: ${resultadosNode.data?.label}`);
    console.log(`📋 TIPO: ${resultadosNode.data?.config?.tipo}`);
    console.log(`📋 MODELO: ${resultadosNode.data?.config?.modelo}\n`);
    
    if (resultadosNode.data?.config?.systemPrompt) {
      console.log('📝 SYSTEM PROMPT:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(resultadosNode.data.config.systemPrompt);
      console.log('═══════════════════════════════════════════════════════════\n');
    }
    
    if (resultadosNode.data?.config?.personalidad) {
      console.log('👤 PERSONALIDAD:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(resultadosNode.data.config.personalidad);
      console.log('═══════════════════════════════════════════════════════════\n');
    }
    
    console.log('📋 CONFIGURACIÓN COMPLETA (JSON):');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(JSON.stringify(resultadosNode.data.config, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

main();
