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
    
    const whatsappNode = flow.nodes.find(n => n.id === 'whatsapp-resultados' || n.data?.label?.includes('resultados'));
    
    if (!whatsappNode) {
      console.log('❌ Nodo whatsapp-resultados no encontrado');
      console.log('\n📋 Nodos disponibles:');
      flow.nodes.forEach(n => {
        console.log(`   - ${n.id}: ${n.data?.label || 'sin label'}`);
      });
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('WHATSAPP RESULTADOS - CONFIGURACIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`📋 ID: ${whatsappNode.id}`);
    console.log(`📋 LABEL: ${whatsappNode.data?.label}`);
    console.log(`📋 TYPE: ${whatsappNode.type}\n`);
    
    console.log('📝 CONFIG:');
    console.log(JSON.stringify(whatsappNode.data.config, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

main();
