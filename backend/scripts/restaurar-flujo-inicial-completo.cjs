const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * RESTAURAR FLUJO INICIAL COMPLETO
 * 
 * Volver al estado original antes de todos los cambios de arquitectura.
 * Mantener TODOS los nodos y edges tal como estaban funcionando.
 */

async function restaurarFlujoInicial() {
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
    
    console.log('\n🔄 RESTAURANDO FLUJO INICIAL COMPLETO\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // ELIMINAR NODOS NUEVOS (clasificadores)
    // ============================================================================
    console.log('\n📍 Eliminando nodos nuevos\n');
    
    const nodosAEliminar = ['gpt-clasificador-intencion', 'gpt-clasificador-continuar', 'router-continuar'];
    
    flow.nodes = flow.nodes.filter(node => !nodosAEliminar.includes(node.id));
    console.log(`✅ Eliminados: ${nodosAEliminar.join(', ')}`);
    
    // ============================================================================
    // RESTAURAR NOMBRES ORIGINALES
    // ============================================================================
    console.log('\n📍 Restaurando nombres originales\n');
    
    // router-intencion → router-algo-mas (nombre original)
    const routerIntencion = flow.nodes.find(n => n.id === 'router-intencion');
    if (routerIntencion) {
      // Mantener como router-intencion (ya era así)
      console.log('✅ router-intencion mantiene su nombre');
    }
    
    // Verificar que router-algo-mas exista
    let routerAlgoMas = flow.nodes.find(n => n.id === 'router-algo-mas');
    if (!routerAlgoMas) {
      console.log('⚠️  router-algo-mas no existe, creándolo');
      routerAlgoMas = {
        id: 'router-algo-mas',
        type: 'router',
        position: { x: 2600, y: 350 },
        data: {
          label: 'Router',
          subtitle: '¿Algo más?',
          config: {
            routes: [
              { id: 'route-seguir', label: 'Seguir Comprando', condition: 'seguir_comprando' },
              { id: 'route-finalizar', label: 'Finalizar Compra', condition: 'finalizar_compra' }
            ]
          }
        }
      };
      flow.nodes.push(routerAlgoMas);
    }
    
    // ============================================================================
    // RESTAURAR EDGES ORIGINALES
    // ============================================================================
    console.log('\n📍 Restaurando edges originales\n');
    
    const edgesOriginales = [
      // Flujo principal
      { id: 'edge-webhook-to-conversacional', source: 'webhook-whatsapp', target: 'gpt-conversacional' },
      { id: 'edge-conversacional-to-formateador', source: 'gpt-conversacional', target: 'gpt-formateador' },
      { id: 'edge-formateador-to-router', source: 'gpt-formateador', target: 'router' },
      
      // Router inicial (2 caminos)
      { id: 'router-route-1-gpt-pedir-datos', source: 'router', sourceHandle: 'route-1', target: 'gpt-pedir-datos' },
      { id: 'edge-pedir-datos-to-whatsapp', source: 'gpt-pedir-datos', target: 'whatsapp-preguntar' },
      { id: 'edge-whatsapp-to-woocommerce', source: 'whatsapp-preguntar', target: 'woocommerce' },
      { id: 'router-route-2-woocommerce', source: 'router', sourceHandle: 'route-2', target: 'woocommerce' },
      
      // Asistente de ventas
      { id: 'edge-woocommerce-to-asistente', source: 'woocommerce', target: 'gpt-asistente-ventas' },
      { id: 'edge-asistente-to-whatsapp', source: 'gpt-asistente-ventas', target: 'whatsapp-asistente' },
      { id: 'edge-whatsapp-to-router-intencion', source: 'whatsapp-asistente', target: 'router-intencion' },
      
      // Router intención (3 caminos originales)
      { id: 'edge-router-to-confirmacion', source: 'router-intencion', sourceHandle: 'route-agregar', target: 'gpt-confirmacion-carrito' },
      { id: 'edge-router-to-buscar-mas', source: 'router-intencion', sourceHandle: 'route-buscar-mas', target: 'gpt-conversacional' },
      { id: 'edge-router-to-default', source: 'router-intencion', sourceHandle: 'route-default', target: 'gpt-asistente-ventas' },
      
      // Confirmación carrito
      { id: 'edge-confirmacion-to-whatsapp', source: 'gpt-confirmacion-carrito', target: 'whatsapp-confirmacion-carrito' },
      { id: 'edge-whatsapp-to-router-algo-mas', source: 'whatsapp-confirmacion-carrito', target: 'router-algo-mas' },
      
      // Router algo más (2 caminos)
      { id: 'edge-router-mas-to-seguir', source: 'router-algo-mas', sourceHandle: 'route-seguir', target: 'gpt-conversacional' },
      { id: 'edge-router-mas-to-finalizar', source: 'router-algo-mas', sourceHandle: 'route-finalizar', target: 'gpt-mercadopago' },
      
      // Checkout final
      { id: 'edge-mercadopago-to-whatsapp', source: 'gpt-mercadopago', target: 'whatsapp-mercadopago' }
    ];
    
    flow.edges = edgesOriginales;
    console.log(`✅ ${edgesOriginales.length} edges restaurados`);
    
    // ============================================================================
    // ACTUALIZAR CONFIGURACIÓN DE ROUTERS
    // ============================================================================
    console.log('\n📍 Actualizando configuración de routers\n');
    
    // router
    const router = flow.nodes.find(n => n.id === 'router');
    if (router && router.data) {
      router.data.config = {
        routes: [
          { id: 'route-1', label: 'Pedir Datos', condition: 'necesita_datos' },
          { id: 'route-2', label: 'Buscar Directo', condition: 'buscar_directo' }
        ]
      };
      console.log('✅ router actualizado');
    }
    
    // router-intencion
    if (routerIntencion && routerIntencion.data) {
      routerIntencion.data.config = {
        routes: [
          { id: 'route-agregar', label: 'Agregar al Carrito', condition: 'agregar_carrito' },
          { id: 'route-buscar-mas', label: 'Buscar Más', condition: 'buscar_mas' },
          { id: 'route-default', label: 'Default', condition: 'default' }
        ]
      };
      console.log('✅ router-intencion actualizado');
    }
    
    // router-algo-mas
    if (routerAlgoMas && routerAlgoMas.data) {
      routerAlgoMas.data.config = {
        routes: [
          { id: 'route-seguir', label: 'Seguir Comprando', condition: 'seguir_comprando' },
          { id: 'route-finalizar', label: 'Finalizar Compra', condition: 'finalizar_compra' }
        ]
      };
      console.log('✅ router-algo-mas actualizado');
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
    console.log('\n\n📊 FLUJO INICIAL RESTAURADO:\n');
    console.log('webhook → conversacional → formateador → router');
    console.log('  ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar → woocommerce');
    console.log('  └─ route-2 → woocommerce');
    console.log('    → gpt-asistente-ventas → whatsapp-asistente → router-intencion');
    console.log('      ├─ route-agregar → gpt-confirmacion → whatsapp-confirmacion → router-algo-mas');
    console.log('      │                     ├─ route-seguir → gpt-conversacional (loop)');
    console.log('      │                     └─ route-finalizar → gpt-mercadopago → whatsapp-mercadopago');
    console.log('      ├─ route-buscar-mas → gpt-conversacional (loop)');
    console.log('      └─ route-default → gpt-asistente-ventas (loop)');
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    console.log(`   Routers: ${flow.nodes.filter(n => n.type === 'router').length}`);
    
    console.log('\n✅ Restauración completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

restaurarFlujoInicial();
