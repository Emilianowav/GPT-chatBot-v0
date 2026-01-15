const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * CORREGIR NODOS WHATSAPP
 * 
 * FlowExecutor verifica: config.module === 'send-message'
 * Pero la configuración tiene: config.action = 'send_message'
 * 
 * Solución: Agregar config.module = 'send-message' a todos los nodos WhatsApp
 */

async function fixWhatsAppNodes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔧 CORRIGIENDO NODOS WHATSAPP\n');
    console.log('═'.repeat(80));
    
    const whatsappNodes = flow.nodes.filter(n => n.type === 'whatsapp');
    
    let cambios = 0;
    
    whatsappNodes.forEach(node => {
      console.log(`\n📱 ${node.id}:`);
      console.log(`   action: ${node.data.config.action}`);
      console.log(`   module (antes): ${node.data.config.module}`);
      
      // Agregar module basado en action
      if (node.data.config.action === 'send_message') {
        node.data.config.module = 'send-message';
        console.log(`   module (después): send-message ✅`);
        cambios++;
      }
    });
    
    console.log(`\n📊 ${cambios} nodos actualizados`);
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Nodos WhatsApp corregidos\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWhatsAppNodes();
