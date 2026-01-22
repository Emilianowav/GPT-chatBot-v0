import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarFlujoCarrito() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═'.repeat(80));
    console.log('🔍 VERIFICAR NODOS DE CARRITO EN FLUJO');
    console.log('═'.repeat(80));
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ WooCommerce Flow no encontrado');
      return;
    }
    
    console.log(`\n📋 Flow: ${wooFlow.name}`);
    console.log(`   Nodos totales: ${wooFlow.nodes.length}`);
    console.log(`   Edges totales: ${wooFlow.edges.length}`);
    
    // Buscar nodos relacionados con carrito
    console.log('\n🔍 Buscando nodos de carrito...\n');
    
    const nodosCarrito = wooFlow.nodes.filter(n => 
      n.type === 'carrito-action' || 
      n.type === 'mercadopago' ||
      n.id.includes('carrito') ||
      n.id.includes('mercadopago')
    );
    
    if (nodosCarrito.length === 0) {
      console.log('❌ NO SE ENCONTRARON NODOS DE CARRITO');
      console.log('\n📋 Nodos disponibles:');
      wooFlow.nodes.forEach(n => {
        console.log(`   - ${n.id} (${n.type})`);
      });
    } else {
      console.log(`✅ Encontrados ${nodosCarrito.length} nodos de carrito:\n`);
      nodosCarrito.forEach(n => {
        console.log(`   📦 ${n.id}`);
        console.log(`      Tipo: ${n.type}`);
        console.log(`      Label: ${n.data?.label || 'N/A'}`);
        if (n.data?.config) {
          console.log(`      Config:`);
          if (n.data.config.action) {
            console.log(`         action: ${n.data.config.action}`);
          }
          if (n.data.config.notificationUrl) {
            console.log(`         notificationUrl: ${n.data.config.notificationUrl}`);
          }
        }
        console.log('');
      });
    }
    
    // Verificar edges que conectan con carrito
    console.log('\n🔗 Edges relacionados con carrito:\n');
    const edgesCarrito = wooFlow.edges.filter(e => 
      nodosCarrito.some(n => n.id === e.source || n.id === e.target)
    );
    
    if (edgesCarrito.length === 0) {
      console.log('❌ NO HAY CONEXIONES A NODOS DE CARRITO');
    } else {
      edgesCarrito.forEach(e => {
        console.log(`   ${e.source} → ${e.target}`);
        if (e.label) console.log(`      Label: ${e.label}`);
      });
    }
    
    // Mostrar flujo completo simplificado
    console.log('\n📊 FLUJO COMPLETO (simplificado):\n');
    
    // Encontrar nodo inicial
    const nodoInicial = wooFlow.nodes.find(n => n.type === 'trigger' || n.id === '1');
    if (nodoInicial) {
      const visitados = new Set();
      const mostrarFlujo = (nodeId, nivel = 0) => {
        if (visitados.has(nodeId) || nivel > 20) return;
        visitados.add(nodeId);
        
        const nodo = wooFlow.nodes.find(n => n.id === nodeId);
        if (!nodo) return;
        
        const indent = '  '.repeat(nivel);
        console.log(`${indent}${nivel}. ${nodo.id} (${nodo.type})`);
        
        // Buscar edges que salen de este nodo
        const edgesSalientes = wooFlow.edges.filter(e => e.source === nodeId);
        edgesSalientes.forEach(edge => {
          if (edge.label) {
            console.log(`${indent}   → ${edge.label}`);
          }
          mostrarFlujo(edge.target, nivel + 1);
        });
      };
      
      mostrarFlujo(nodoInicial.id);
    }
    
    console.log('\n═'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarFlujoCarrito();
