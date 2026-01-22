import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verRouterPrincipal() {
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
    
    // Buscar router-principal
    const routerPrincipal = wooFlow.nodes.find(n => n.id === 'router-principal');
    
    if (!routerPrincipal) {
      console.log('❌ router-principal no encontrado');
      return;
    }
    
    console.log('\n📊 ROUTER PRINCIPAL:\n');
    console.log(JSON.stringify(routerPrincipal, null, 2));
    
    // Buscar edges desde router-principal
    console.log('\n\n🔗 EDGES DESDE ROUTER-PRINCIPAL:\n');
    const edgesFromRouter = wooFlow.edges.filter(e => e.source === 'router-principal');
    edgesFromRouter.forEach(e => {
      console.log(`\n→ ${e.target}`);
      console.log(`  sourceHandle: ${e.sourceHandle}`);
      console.log(`  label: ${e.label || 'N/A'}`);
      console.log(`  data:`, JSON.stringify(e.data, null, 2));
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verRouterPrincipal();
