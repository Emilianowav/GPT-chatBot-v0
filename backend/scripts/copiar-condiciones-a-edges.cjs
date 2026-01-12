const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * COPIAR CONDICIONES DE ROUTER A EDGES
 * 
 * FlowExecutor busca condiciones en: edge.data.condition
 * Pero están guardadas en: node.data.config.routes[].condition
 * 
 * Solución: Copiar las condiciones de los routers a los edges correspondientes
 */

async function copiarCondicionesAEdges() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔧 COPIANDO CONDICIONES DE ROUTERS A EDGES\n');
    console.log('═'.repeat(80));
    
    const routers = flow.nodes.filter(n => n.type === 'router');
    
    routers.forEach(router => {
      console.log(`\n📍 Router: ${router.id}`);
      
      if (!router.data.config.routes) {
        console.log('   ⚠️  Sin rutas configuradas');
        return;
      }
      
      router.data.config.routes.forEach(route => {
        // Buscar el edge que corresponde a esta ruta
        const edge = flow.edges.find(e => 
          e.source === router.id && e.sourceHandle === route.id
        );
        
        if (edge) {
          // Inicializar edge.data si no existe
          if (!edge.data) {
            edge.data = {};
          }
          
          // Copiar condición
          edge.data.condition = route.condition;
          
          console.log(`   ✅ ${route.id}: "${route.label}"`);
          console.log(`      Condición: ${route.condition}`);
          console.log(`      Edge: ${edge.id}`);
        } else {
          console.log(`   ⚠️  No se encontró edge para ruta: ${route.id}`);
        }
      });
    });
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('\n✅ Condiciones copiadas a edges\n');
    
    // Verificación
    console.log('📋 VERIFICACIÓN:\n');
    flow.edges.forEach(edge => {
      if (edge.data?.condition) {
        console.log(`   ${edge.id}:`);
        console.log(`      condition: ${edge.data.condition}`);
      }
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

copiarCondicionesAEdges();
