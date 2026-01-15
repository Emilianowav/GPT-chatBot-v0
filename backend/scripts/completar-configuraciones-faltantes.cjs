const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';
const WOOCOMMERCE_API_ID = '695320fda03785dacc8d950b';

/**
 * COMPLETAR CONFIGURACIONES FALTANTES
 * 
 * 1. Agregar apiConfigId a WooCommerce
 * 2. Agregar data a edges para que se vea el icono de tuerca
 */

async function completarConfiguraciones() {
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
    
    console.log('\n🔧 COMPLETANDO CONFIGURACIONES FALTANTES\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // 1. CONFIGURAR WOOCOMMERCE
    // ============================================================================
    console.log('\n📍 1. Configurando WooCommerce\n');
    
    const woocommerceNode = flow.nodes.find(n => n.id === 'woocommerce');
    if (woocommerceNode) {
      woocommerceNode.data.config = {
        ...woocommerceNode.data.config,
        action: 'search_products',
        apiConfigId: WOOCOMMERCE_API_ID,
        searchField: 'titulo',
        outputMapping: {
          productos: 'products',
          cantidad: 'total'
        }
      };
      
      console.log('   ✅ apiConfigId: ' + WOOCOMMERCE_API_ID);
      console.log('   ✅ action: search_products');
      console.log('   ✅ searchField: titulo');
    }
    
    // ============================================================================
    // 2. AGREGAR DATA A EDGES (para visualización)
    // ============================================================================
    console.log('\n📍 2. Agregando data a edges\n');
    
    let edgesActualizados = 0;
    
    flow.edges.forEach(edge => {
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      
      // Agregar label descriptivo
      if (!edge.data) {
        edge.data = {};
      }
      
      // Agregar label basado en el tipo de conexión
      if (sourceNode?.type === 'router') {
        const route = sourceNode.data?.config?.routes?.find(r => r.id === edge.sourceHandle);
        if (route) {
          edge.data.label = route.label;
          edge.data.condition = route.condition;
          console.log(`   ✅ ${edge.id}: "${route.label}"`);
          edgesActualizados++;
        }
      } else {
        // Para edges normales, agregar label simple
        const targetNode = flow.nodes.find(n => n.id === edge.target);
        edge.data.label = `→ ${targetNode?.data?.label || edge.target}`;
      }
    });
    
    console.log(`\n   📊 ${edgesActualizados} edges de router actualizados`);
    
    // ============================================================================
    // 3. GUARDAR CAMBIOS
    // ============================================================================
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n✅ Configuraciones completadas y guardadas\n');
    
    // ============================================================================
    // 4. RESUMEN
    // ============================================================================
    console.log('📋 RESUMEN:\n');
    console.log('   ✅ WooCommerce configurado con apiConfigId');
    console.log('   ✅ Edges actualizados con labels y condiciones');
    console.log('   ✅ Flujo listo para usar\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

completarConfiguraciones();
