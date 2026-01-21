const { MongoClient, ObjectId } = require('mongodb');

async function revisarFlujoV2() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('bot_crm');
    
    const flow = await db.collection('flows').findOne({
      _id: new ObjectId('696aef0863e98384f9248968')
    });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('=== FLUJO VEO VEO V2 ===\n');
    console.log('Nombre:', flow.nombre);
    console.log('Total nodos:', flow.nodes.length);
    console.log('Total edges:', flow.edges.length);
    
    console.log('\n=== NODOS ===');
    flow.nodes.forEach(node => {
      console.log(`\n${node.id}:`);
      console.log(`  Tipo: ${node.type}`);
      console.log(`  Label: ${node.data?.label || 'sin label'}`);
      console.log(`  Subtitle: ${node.data?.subtitle || 'sin subtitle'}`);
    });
    
    console.log('\n\n=== EDGES DEL ROUTER ===');
    const routerEdges = flow.edges.filter(e => e.source === 'router');
    console.log(`Total edges desde router: ${routerEdges.length}`);
    
    routerEdges.forEach(edge => {
      const target = flow.nodes.find(n => n.id === edge.target);
      console.log(`\n${edge.id}:`);
      console.log(`  Source: ${edge.source}`);
      console.log(`  SourceHandle: ${edge.sourceHandle || 'NO HANDLE'}`);
      console.log(`  Target: ${edge.target} (${target?.type})`);
      console.log(`  Target Label: ${target?.data?.label || 'sin label'}`);
    });
    
    console.log('\n\n=== CONEXIONES A WOOCOMMERCE ===');
    const wooEdges = flow.edges.filter(e => e.target === 'woocommerce');
    console.log(`Total edges hacia woocommerce: ${wooEdges.length}`);
    
    wooEdges.forEach(edge => {
      const source = flow.nodes.find(n => n.id === edge.source);
      console.log(`\n${edge.id}:`);
      console.log(`  Source: ${edge.source} (${source?.type})`);
      console.log(`  Source Label: ${source?.data?.label || 'sin label'}`);
      console.log(`  Source Subtitle: ${source?.data?.subtitle || 'sin subtitle'}`);
      console.log(`  Target: ${edge.target}`);
    });
    
    console.log('\n\n=== NODO ROUTER - CONFIGURACIÓN ===');
    const router = flow.nodes.find(n => n.id === 'router');
    if (router) {
      console.log('Config:', JSON.stringify(router.data?.config, null, 2));
      console.log('RouteHandles:', router.data?.routeHandles);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

revisarFlujoV2();
