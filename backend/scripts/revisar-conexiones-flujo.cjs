/**
 * Script para revisar las conexiones del flujo y detectar conexiones incorrectas
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revisarConexiones() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 REVISANDO CONEXIONES DEL FLUJO VEO VEO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar nodos importantes
    const routerPrincipal = flow.nodes.find(n => n.id === 'router-principal');
    const routerCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    const woocommerce = flow.nodes.find(n => n.type === 'woocommerce');
    
    console.log('📋 NODOS CLAVE:');
    console.log(`   Router Principal: ${routerPrincipal ? '✅' : '❌'} (${routerPrincipal?.id})`);
    console.log(`   Router Carrito: ${routerCarrito ? '✅' : '❌'} (${routerCarrito?.id})`);
    console.log(`   WooCommerce: ${woocommerce ? '✅' : '❌'} (${woocommerce?.id})`);
    
    // Buscar edges que conectan a WooCommerce
    const edgesToWoo = flow.edges.filter(e => e.target === woocommerce?.id);
    
    console.log('\n\n🔗 CONEXIONES A WOOCOMMERCE:');
    edgesToWoo.forEach(edge => {
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      console.log(`\n   Edge: ${edge.id}`);
      console.log(`      Source: ${edge.source} (${sourceNode?.data?.label || 'sin label'})`);
      console.log(`      Target: ${edge.target} (WooCommerce)`);
      console.log(`      Source Handle: ${edge.sourceHandle || 'N/A'}`);
      
      // Detectar si viene del router principal (INCORRECTO)
      if (edge.source === 'router-principal') {
        console.log(`      ⚠️  CONEXIÓN INCORRECTA: Router Principal → WooCommerce`);
      }
    });
    
    // Buscar edges desde Router Principal
    const edgesFromRouterPrincipal = flow.edges.filter(e => e.source === 'router-principal');
    
    console.log('\n\n🔗 CONEXIONES DESDE ROUTER PRINCIPAL:');
    edgesFromRouterPrincipal.forEach(edge => {
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      console.log(`\n   Edge: ${edge.id}`);
      console.log(`      Source: ${edge.source} (Router Principal)`);
      console.log(`      Target: ${edge.target} (${targetNode?.data?.label || 'sin label'})`);
      console.log(`      Source Handle: ${edge.sourceHandle || 'N/A'}`);
      
      if (edge.target === woocommerce?.id) {
        console.log(`      ❌ PROBLEMA: Router Principal conectado a WooCommerce`);
      }
    });
    
    // Buscar edges desde Router Carrito
    const edgesFromRouterCarrito = flow.edges.filter(e => e.source === 'router-carrito');
    
    console.log('\n\n🔗 CONEXIONES DESDE ROUTER CARRITO:');
    edgesFromRouterCarrito.forEach(edge => {
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      console.log(`\n   Edge: ${edge.id}`);
      console.log(`      Source: ${edge.source} (Router Carrito)`);
      console.log(`      Target: ${edge.target} (${targetNode?.data?.label || 'sin label'})`);
      console.log(`      Source Handle: ${edge.sourceHandle || 'N/A'}`);
    });
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total edges: ${flow.edges.length}`);
    console.log(`Edges a WooCommerce: ${edgesToWoo.length}`);
    console.log(`Edges desde Router Principal: ${edgesFromRouterPrincipal.length}`);
    console.log(`Edges desde Router Carrito: ${edgesFromRouterCarrito.length}`);
    
    // Detectar problema
    const problemaDetectado = edgesToWoo.some(e => e.source === 'router-principal');
    if (problemaDetectado) {
      console.log('\n❌ PROBLEMA DETECTADO:');
      console.log('   Router Principal está conectado directamente a WooCommerce');
      console.log('   Esto es incorrecto, solo Router Carrito debe conectar a WooCommerce');
    } else {
      console.log('\n✅ No se detectaron problemas en las conexiones');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
revisarConexiones()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
