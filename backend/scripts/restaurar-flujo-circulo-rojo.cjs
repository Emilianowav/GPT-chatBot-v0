const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * RESTAURAR SOLO EL FLUJO DEL CÍRCULO ROJO
 * 
 * El flujo que funcionaba correctamente:
 * webhook → gpt-conversacional → gpt-formateador → router → woocommerce 
 *   → gpt-asistente-ventas → whatsapp-asistente
 * 
 * ELIMINAR todo lo demás (routers adicionales, nodos de carrito, checkout, etc.)
 */

async function restaurarFlujoCirculoRojo() {
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
    
    console.log('\n🔴 RESTAURANDO FLUJO DEL CÍRCULO ROJO (EL QUE FUNCIONABA)\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // NODOS A MANTENER (solo los del círculo rojo)
    // ============================================================================
    const nodosAMantener = [
      'webhook-whatsapp',
      'gpt-conversacional',
      'gpt-formateador',
      'router',
      'woocommerce',
      'gpt-asistente-ventas',
      'whatsapp-asistente'
    ];
    
    console.log('\n📍 Nodos a mantener:\n');
    nodosAMantener.forEach(id => console.log(`  ✅ ${id}`));
    
    // Filtrar solo los nodos que queremos mantener
    const nodosOriginales = flow.nodes.length;
    flow.nodes = flow.nodes.filter(node => nodosAMantener.includes(node.id));
    
    console.log(`\n📊 Nodos eliminados: ${nodosOriginales - flow.nodes.length}`);
    console.log(`📊 Nodos restantes: ${flow.nodes.length}`);
    
    // ============================================================================
    // EDGES DEL FLUJO FUNCIONAL
    // ============================================================================
    console.log('\n📍 Definiendo edges del flujo funcional\n');
    
    const edgesFuncionales = [
      { id: 'edge-1', source: 'webhook-whatsapp', target: 'gpt-conversacional', type: 'default' },
      { id: 'edge-2', source: 'gpt-conversacional', target: 'gpt-formateador', type: 'default' },
      { id: 'edge-3', source: 'gpt-formateador', target: 'router', type: 'default' },
      { id: 'edge-4', source: 'router', sourceHandle: 'route-1', target: 'woocommerce', type: 'default' },
      { id: 'edge-5', source: 'woocommerce', target: 'gpt-asistente-ventas', type: 'default' },
      { id: 'edge-6', source: 'gpt-asistente-ventas', target: 'whatsapp-asistente', type: 'default' }
    ];
    
    flow.edges = edgesFuncionales;
    console.log(`✅ ${edgesFuncionales.length} edges definidos`);
    
    // ============================================================================
    // ACTUALIZAR ROUTER (solo 1 ruta)
    // ============================================================================
    console.log('\n📍 Actualizando router\n');
    
    const router = flow.nodes.find(n => n.id === 'router');
    if (router && router.data) {
      router.data.config = {
        routes: [
          { id: 'route-1', label: 'Buscar Productos', condition: 'buscar' }
        ]
      };
      console.log('✅ Router configurado con 1 ruta');
    }
    
    // ============================================================================
    // GUARDAR EN MONGODB
    // ============================================================================
    console.log('\n📍 Guardando en MongoDB\n');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    
    // ============================================================================
    // RESUMEN
    // ============================================================================
    console.log('\n\n🎯 FLUJO FUNCIONAL RESTAURADO:\n');
    console.log('webhook-whatsapp');
    console.log('  → gpt-conversacional');
    console.log('  → gpt-formateador');
    console.log('  → router');
    console.log('  → woocommerce');
    console.log('  → gpt-asistente-ventas');
    console.log('  → whatsapp-asistente');
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    console.log(`   Routers: 1`);
    
    console.log('\n✅ Este es el flujo que estaba funcionando correctamente\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

restaurarFlujoCirculoRojo();
