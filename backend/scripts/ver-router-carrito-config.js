import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verRouterCarritoConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔍 Verificando configuración de router-carrito...\n');
    
    // Buscar nodo router-carrito
    const routerCarrito = wooFlow.nodes.find(n => n.id === 'router-carrito');
    
    if (routerCarrito) {
      console.log('📋 NODO ROUTER-CARRITO:');
      console.log(`   ID: ${routerCarrito.id}`);
      console.log(`   Type: ${routerCarrito.type}`);
      console.log(`   Label: ${routerCarrito.data?.label}`);
      console.log(`\n   Config:`);
      console.log(JSON.stringify(routerCarrito.data?.config, null, 2));
    }
    
    // Buscar edges del router-carrito
    const edgesRouter = wooFlow.edges.filter(e => e.source === 'router-carrito');
    
    console.log('\n📋 EDGES DEL ROUTER-CARRITO:\n');
    
    edgesRouter.forEach((edge, index) => {
      console.log(`   ${index + 1}. ${edge.source} → ${edge.target}`);
      console.log(`      ID: ${edge.id}`);
      console.log(`      sourceHandle: ${edge.sourceHandle}`);
      console.log(`      Label: ${edge.data?.label || 'sin label'}`);
      console.log(`      Condition (raw):`);
      console.log(JSON.stringify(edge.data?.condition, null, 2));
      console.log('');
    });
    
    console.log('\n⚠️  PROBLEMA DETECTADO:');
    console.log('   El router espera condiciones en formato STRING, no OBJECT');
    console.log('   Ejemplo correcto: "{{accion_siguiente}} equals \'pagar\'"');
    console.log('   Ejemplo incorrecto: { field: "accion_siguiente", operator: "equals", value: "pagar" }');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verRouterCarritoConfig();
