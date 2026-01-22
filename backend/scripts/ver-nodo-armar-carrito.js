import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verNodoArmarCarrito() {
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
    
    const nodoArmarCarrito = wooFlow.nodes.find(n => n.id === 'gpt-armar-carrito');
    
    if (!nodoArmarCarrito) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }
    
    console.log('\n📊 NODO GPT-ARMAR-CARRITO:\n');
    console.log(JSON.stringify(nodoArmarCarrito, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verNodoArmarCarrito();
