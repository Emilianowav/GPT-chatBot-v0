require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verRouterEdges() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }
    
    const routerEdges = flow.edges.filter(e => e.source === 'router');
    
    console.log('📋 ROUTER EDGES (en orden):');
    console.log('═'.repeat(80));
    
    routerEdges.forEach((e, i) => {
      console.log(`\n${i+1}. ${e.data?.routeLabel || e.data?.label}`);
      console.log('   ID:', e.id);
      console.log('   sourceHandle:', e.sourceHandle);
      console.log('   target:', e.target);
      console.log('   condition:', e.data?.condition);
    });
    
    console.log('\n═'.repeat(80));
    console.log('\n🔍 ANÁLISIS:');
    console.log('   Total de rutas:', routerEdges.length);
    console.log('   Orden de evaluación: Se evalúan en el orden del array');
    console.log('   Primera ruta que cumpla condición TRUE → se ejecuta');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verRouterEdges();
