import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verFlujoCompleto() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n📊 TODOS LOS NODOS:\n');
    wooFlow.nodes.forEach((n, i) => {
      console.log(`${i + 1}. ${n.id} (${n.type})`);
      if (n.data?.label) console.log(`   Label: ${n.data.label}`);
    });
    
    console.log('\n\n🔗 TODAS LAS CONEXIONES:\n');
    wooFlow.edges.forEach((e, i) => {
      console.log(`${i + 1}. ${e.source} → ${e.target}`);
      if (e.label) console.log(`   Label: ${e.label}`);
      if (e.sourceHandle) console.log(`   Handle: ${e.sourceHandle}`);
    });
    
    // Verificar qué pasa después de WooCommerce
    console.log('\n\n🔍 CONEXIONES DESDE WOOCOMMERCE:\n');
    const edgesFromWoo = wooFlow.edges.filter(e => e.source === 'woocommerce');
    if (edgesFromWoo.length === 0) {
      console.log('❌ NO HAY CONEXIONES DESDE WOOCOMMERCE');
    } else {
      edgesFromWoo.forEach(e => {
        console.log(`   → ${e.target}`);
        if (e.label) console.log(`      Label: ${e.label}`);
      });
    }
    
    // Verificar conexiones hacia gpt-armar-carrito
    console.log('\n\n🔍 CONEXIONES HACIA GPT-ARMAR-CARRITO:\n');
    const edgesToCarrito = wooFlow.edges.filter(e => e.target === 'gpt-armar-carrito');
    if (edgesToCarrito.length === 0) {
      console.log('❌ NO HAY CONEXIONES HACIA GPT-ARMAR-CARRITO');
    } else {
      edgesToCarrito.forEach(e => {
        console.log(`   ${e.source} → gpt-armar-carrito`);
        if (e.label) console.log(`      Label: ${e.label}`);
        if (e.sourceHandle) console.log(`      Handle: ${e.sourceHandle}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verFlujoCompleto();
