const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * CORREGIR CONDICIONES DE ROUTERS
 * 
 * El FlowExecutor espera condiciones en formato string o {field, operator, value}
 * Pero guardé {type: 'missing_variables', variables: [...]}
 * 
 * Solución: Convertir a formato string compatible
 */

async function fixCondicionesRouter() {
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
    
    console.log('\n🔧 CORRIGIENDO CONDICIONES DE ROUTERS\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // ROUTER 1: Pedir datos vs Buscar en WooCommerce
    // ============================================================================
    const router = flow.nodes.find(n => n.id === 'router');
    if (router && router.data.config.routes) {
      console.log('\n📍 Router 1 (router):');
      
      router.data.config.routes = [
        {
          id: 'route-1',
          label: 'Pedir Datos',
          condition: '{{gpt-conversacional.variables_faltantes}} not_empty'
        },
        {
          id: 'route-2',
          label: 'Buscar en WooCommerce',
          condition: '{{gpt-conversacional.variables_completas}} equal true'
        }
      ];
      
      console.log('   ✅ Ruta 1: Pedir Datos (si hay variables faltantes)');
      console.log('      Condición: {{gpt-conversacional.variables_faltantes}} not_empty');
      console.log('   ✅ Ruta 2: Buscar en WooCommerce (si variables completas)');
      console.log('      Condición: {{gpt-conversacional.variables_completas}} equal true');
    }
    
    // ============================================================================
    // ROUTER 2: Clasificar intención (buscar, agregar, checkout)
    // ============================================================================
    const routerIntencion = flow.nodes.find(n => n.id === 'router-intencion');
    if (routerIntencion && routerIntencion.data.config.routes) {
      console.log('\n📍 Router 2 (router-intencion):');
      
      routerIntencion.data.config.routes = [
        {
          id: 'route-buscar',
          label: 'Buscar Más',
          condition: '{{gpt-clasificador.respuesta_gpt}} contains buscar_mas'
        },
        {
          id: 'route-agregar',
          label: 'Agregar al Carrito',
          condition: '{{gpt-clasificador.respuesta_gpt}} contains agregar_carrito'
        },
        {
          id: 'route-checkout',
          label: 'Finalizar Compra',
          condition: '{{gpt-clasificador.respuesta_gpt}} contains finalizar_compra'
        }
      ];
      
      console.log('   ✅ Ruta 1: Buscar Más');
      console.log('      Condición: {{gpt-clasificador.respuesta_gpt}} contains buscar_mas');
      console.log('   ✅ Ruta 2: Agregar al Carrito');
      console.log('      Condición: {{gpt-clasificador.respuesta_gpt}} contains agregar_carrito');
      console.log('   ✅ Ruta 3: Finalizar Compra');
      console.log('      Condición: {{gpt-clasificador.respuesta_gpt}} contains finalizar_compra');
    }
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Condiciones de routers corregidas\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixCondicionesRouter();
