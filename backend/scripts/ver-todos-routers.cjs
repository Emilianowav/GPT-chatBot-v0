/**
 * Script para ver todos los routers del flujo
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verRouters() {
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
    console.log('🔍 TODOS LOS ROUTERS DEL FLUJO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar todos los routers
    const routers = flow.nodes.filter(n => n.type === 'router');
    
    console.log(`📋 ROUTERS ENCONTRADOS: ${routers.length}\n`);
    
    routers.forEach((router, index) => {
      console.log(`${index + 1}. ${router.id}`);
      console.log(`   Label: ${router.data?.label || 'sin label'}`);
      console.log(`   Type: ${router.type}`);
      
      // Buscar edges desde este router
      const edgesFromRouter = flow.edges.filter(e => e.source === router.id);
      console.log(`   Conexiones salientes: ${edgesFromRouter.length}`);
      
      edgesFromRouter.forEach(edge => {
        const targetNode = flow.nodes.find(n => n.id === edge.target);
        console.log(`      → ${edge.target} (${targetNode?.data?.label || 'sin label'})`);
        console.log(`         Handle: ${edge.sourceHandle || 'N/A'}`);
      });
      
      console.log('');
    });
    
    // Buscar el edge problemático
    const edgeProblematico = flow.edges.find(e => 
      e.id === 'reactflow__edge-routerroute-2-woocommerce'
    );
    
    if (edgeProblematico) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('❌ EDGE PROBLEMÁTICO DETECTADO');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`ID: ${edgeProblematico.id}`);
      console.log(`Source: ${edgeProblematico.source}`);
      console.log(`Target: ${edgeProblematico.target}`);
      console.log(`Source Handle: ${edgeProblematico.sourceHandle}`);
      console.log('\n💡 SOLUCIÓN: Eliminar este edge');
      console.log('═══════════════════════════════════════════════════════════\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verRouters()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
