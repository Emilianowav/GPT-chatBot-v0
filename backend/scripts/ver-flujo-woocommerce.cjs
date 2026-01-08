const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verFlujoWooCommerce() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 FLUJO:', flow.nombre);
    console.log('=' .repeat(80));

    console.log('\n🔷 NODOS:');
    flow.nodes.forEach(node => {
      console.log(`\n  ${node.id}`);
      console.log(`  Tipo: ${node.type}`);
      if (node.data?.config) {
        const config = node.data.config;
        if (config.tipo) console.log(`  Config.tipo: ${config.tipo}`);
        if (config.module) console.log(`  Config.module: ${config.module}`);
        if (config.routes) console.log(`  Rutas: ${config.routes.length}`);
      }
    });

    console.log('\n\n🔗 CONEXIONES (EDGES):');
    flow.edges.forEach(edge => {
      console.log(`\n  ${edge.source} → ${edge.target}`);
      console.log(`  ID: ${edge.id}`);
      if (edge.sourceHandle) console.log(`  Handle: ${edge.sourceHandle}`);
      if (edge.data?.condition) {
        console.log(`  Condición: ${JSON.stringify(edge.data.condition, null, 2)}`);
      }
    });

    console.log('\n\n📋 ORDEN DE EJECUCIÓN ESPERADO:');
    console.log('  1. webhook-trigger (inicio)');
    console.log('  2. gpt-conversacional (habla con usuario)');
    console.log('  3. whatsapp-respuesta-gpt (envía respuesta)');
    console.log('  4. gpt-formateador (extrae datos)');
    console.log('  5. validador-datos (verifica datos)');
    console.log('  6. router-validacion (decide si buscar)');
    console.log('  7a. woocommerce-search (si datos completos)');
    console.log('  7b. mensaje-datos-incompletos (si faltan datos)');
    console.log('  8. router-productos (verifica si hay productos)');
    console.log('  9. whatsapp-resultados (envía lista)');

    console.log('\n\n🔍 ANÁLISIS DE PROBLEMA:');
    
    // Verificar si hay edges directos que salten el router
    const edgesFromGPT = flow.edges.filter(e => e.source === 'gpt-conversacional');
    const edgesFromFormateador = flow.edges.filter(e => e.source === 'gpt-formateador');
    const edgesFromValidador = flow.edges.filter(e => e.source === 'validador-datos');
    
    console.log(`\n  Edges desde gpt-conversacional: ${edgesFromGPT.length}`);
    edgesFromGPT.forEach(e => console.log(`    → ${e.target}`));
    
    console.log(`\n  Edges desde gpt-formateador: ${edgesFromFormateador.length}`);
    edgesFromFormateador.forEach(e => console.log(`    → ${e.target}`));
    
    console.log(`\n  Edges desde validador-datos: ${edgesFromValidador.length}`);
    edgesFromValidador.forEach(e => console.log(`    → ${e.target}`));

    // Verificar router-validacion
    const routerNode = flow.nodes.find(n => n.id === 'router-validacion');
    if (routerNode && routerNode.data?.config?.routes) {
      console.log('\n\n🔀 ROUTER-VALIDACION:');
      routerNode.data.config.routes.forEach((route, i) => {
        console.log(`\n  Ruta ${i + 1}: ${route.label || 'Sin label'}`);
        console.log(`  Condición: ${JSON.stringify(route.condition)}`);
        console.log(`  Target: ${route.targetNodeId || 'No especificado'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verFlujoWooCommerce();
