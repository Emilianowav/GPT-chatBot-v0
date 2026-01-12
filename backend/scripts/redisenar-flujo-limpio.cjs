const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * REDISEÑO COMPLETO - FLUJO LINEAL SIN LOOPS VISUALES
 * 
 * ARQUITECTURA PROPUESTA:
 * 
 * 1. CONVERSACIÓN INICIAL
 *    webhook → gpt-conversacional → gpt-formateador → router-inicial
 * 
 * 2. BÚSQUEDA (2 caminos que convergen)
 *    router-inicial:
 *      ├─ route-pedir-datos → gpt-pedir-datos → whatsapp-preguntar → woocommerce
 *      └─ route-buscar → woocommerce
 *    
 *    woocommerce → gpt-asistente-ventas
 * 
 * 3. PRESENTACIÓN Y DECISIÓN
 *    gpt-asistente-ventas → whatsapp-asistente → gpt-clasificador-intencion → router-intencion
 * 
 * 4. TRES CAMINOS FINALES (sin loops)
 *    router-intencion:
 *      ├─ route-agregar → gpt-confirmacion-carrito → whatsapp-confirmacion 
 *      │                   → gpt-clasificador-continuar → router-continuar
 *      │                     ├─ route-seguir → [FIN - reinicia conversación]
 *      │                     └─ route-finalizar → gpt-mercadopago → whatsapp-mercadopago
 *      ├─ route-buscar-mas → [FIN - reinicia conversación]
 *      └─ route-checkout → gpt-mercadopago → whatsapp-mercadopago
 * 
 * NOTA: Los "loops" se manejan a nivel de lógica de negocio (reiniciar conversación),
 *       NO a nivel visual con edges que vuelven atrás.
 */

async function redisenarFlujoLimpio() {
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
    
    console.log('\n🔧 REDISEÑANDO FLUJO - ELIMINANDO LOOPS VISUALES\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // PASO 1: LIMPIAR TODOS LOS EDGES
    // ============================================================================
    console.log('\n📍 PASO 1: Reconstruir edges desde cero\n');
    
    const nuevosEdges = [
      // FASE 1: Conversación Inicial
      {
        id: 'edge-webhook-to-conversacional',
        source: 'webhook-whatsapp',
        target: 'gpt-conversacional',
        type: 'default'
      },
      {
        id: 'edge-conversacional-to-formateador',
        source: 'gpt-conversacional',
        target: 'gpt-formateador',
        type: 'default'
      },
      {
        id: 'edge-formateador-to-router',
        source: 'gpt-formateador',
        target: 'router-inicial',
        type: 'default'
      },
      
      // FASE 2: Búsqueda (2 caminos)
      {
        id: 'edge-router-to-pedir-datos',
        source: 'router-inicial',
        sourceHandle: 'route-pedir-datos',
        target: 'gpt-pedir-datos',
        type: 'default'
      },
      {
        id: 'edge-pedir-datos-to-whatsapp',
        source: 'gpt-pedir-datos',
        target: 'whatsapp-preguntar',
        type: 'default'
      },
      {
        id: 'edge-whatsapp-to-woocommerce',
        source: 'whatsapp-preguntar',
        target: 'woocommerce',
        type: 'default'
      },
      {
        id: 'edge-router-to-woocommerce',
        source: 'router-inicial',
        sourceHandle: 'route-buscar',
        target: 'woocommerce',
        type: 'default'
      },
      
      // FASE 3: Presentación
      {
        id: 'edge-woocommerce-to-asistente',
        source: 'woocommerce',
        target: 'gpt-asistente-ventas',
        type: 'default'
      },
      {
        id: 'edge-asistente-to-whatsapp',
        source: 'gpt-asistente-ventas',
        target: 'whatsapp-asistente',
        type: 'default'
      },
      {
        id: 'edge-whatsapp-to-clasificador',
        source: 'whatsapp-asistente',
        target: 'gpt-clasificador-intencion',
        type: 'default'
      },
      {
        id: 'edge-clasificador-to-router',
        source: 'gpt-clasificador-intencion',
        target: 'router-intencion',
        type: 'default'
      },
      
      // FASE 4: Camino Agregar al Carrito
      {
        id: 'edge-router-to-confirmacion',
        source: 'router-intencion',
        sourceHandle: 'route-agregar',
        target: 'gpt-confirmacion-carrito',
        type: 'default'
      },
      {
        id: 'edge-confirmacion-to-whatsapp',
        source: 'gpt-confirmacion-carrito',
        target: 'whatsapp-confirmacion-carrito',
        type: 'default'
      },
      {
        id: 'edge-whatsapp-to-clasificador-continuar',
        source: 'whatsapp-confirmacion-carrito',
        target: 'gpt-clasificador-continuar',
        type: 'default'
      },
      {
        id: 'edge-clasificador-to-router-continuar',
        source: 'gpt-clasificador-continuar',
        target: 'router-continuar',
        type: 'default'
      },
      
      // FASE 5: Checkout desde router-continuar
      {
        id: 'edge-continuar-to-mercadopago',
        source: 'router-continuar',
        sourceHandle: 'route-finalizar',
        target: 'gpt-mercadopago',
        type: 'default'
      },
      
      // FASE 6: Checkout directo desde router-intencion
      {
        id: 'edge-router-to-mercadopago',
        source: 'router-intencion',
        sourceHandle: 'route-checkout',
        target: 'gpt-mercadopago',
        type: 'default'
      },
      {
        id: 'edge-mercadopago-to-whatsapp',
        source: 'gpt-mercadopago',
        target: 'whatsapp-mercadopago',
        type: 'default'
      }
      
      // NOTA: route-buscar-mas y route-seguir NO tienen edges visuales
      // Estos se manejan a nivel de lógica (reiniciar conversación)
    ];
    
    console.log(`✅ ${nuevosEdges.length} edges definidos`);
    
    // ============================================================================
    // PASO 2: ACTUALIZAR ROUTERS
    // ============================================================================
    console.log('\n📍 PASO 2: Actualizar configuración de routers\n');
    
    // router-inicial
    const routerInicial = flow.nodes.find(n => n.id === 'router-inicial');
    if (routerInicial && routerInicial.data) {
      routerInicial.data.config = {
        routes: [
          {
            id: 'route-pedir-datos',
            label: 'Pedir Datos',
            condition: 'necesita_datos'
          },
          {
            id: 'route-buscar',
            label: 'Buscar Directo',
            condition: 'buscar_directo'
          }
        ]
      };
      console.log('✅ router-inicial actualizado');
    }
    
    // router-intencion
    const routerIntencion = flow.nodes.find(n => n.id === 'router-intencion');
    if (routerIntencion && routerIntencion.data) {
      routerIntencion.data.config = {
        routes: [
          {
            id: 'route-agregar',
            label: 'Agregar al Carrito',
            condition: 'agregar_carrito'
          },
          {
            id: 'route-buscar-mas',
            label: 'Buscar Más (reinicia)',
            condition: 'buscar_mas'
          },
          {
            id: 'route-checkout',
            label: 'Checkout Directo',
            condition: 'finalizar_compra'
          }
        ]
      };
      console.log('✅ router-intencion actualizado');
    }
    
    // router-continuar
    const routerContinuar = flow.nodes.find(n => n.id === 'router-continuar');
    if (routerContinuar && routerContinuar.data) {
      routerContinuar.data.config = {
        routes: [
          {
            id: 'route-seguir',
            label: 'Seguir Comprando (reinicia)',
            condition: 'seguir_comprando'
          },
          {
            id: 'route-finalizar',
            label: 'Finalizar Compra',
            condition: 'finalizar_compra'
          }
        ]
      };
      console.log('✅ router-continuar actualizado');
    }
    
    // ============================================================================
    // PASO 3: GUARDAR EN MONGODB
    // ============================================================================
    console.log('\n📍 PASO 3: Guardar cambios en MongoDB\n');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: nuevosEdges
        } 
      }
    );
    
    console.log('✅ Cambios guardados en MongoDB');
    
    // ============================================================================
    // VERIFICACIÓN
    // ============================================================================
    console.log('\n📊 VERIFICACIÓN DE CONEXIONES\n');
    console.log('─'.repeat(80));
    
    const verificacion = {};
    flow.nodes.forEach(node => {
      const incoming = nuevosEdges.filter(e => e.target === node.id).length;
      const outgoing = nuevosEdges.filter(e => e.source === node.id).length;
      
      verificacion[node.id] = { incoming, outgoing, type: node.type };
    });
    
    let errores = 0;
    Object.entries(verificacion).forEach(([nodeId, data]) => {
      if (data.type !== 'router' && data.type !== 'webhook' && data.incoming > 1) {
        console.log(`❌ ${nodeId}: ${data.incoming} entradas (debería tener 1)`);
        errores++;
      }
      if (data.type !== 'router' && data.outgoing > 1) {
        console.log(`❌ ${nodeId}: ${data.outgoing} salidas (debería tener 1)`);
        errores++;
      }
    });
    
    if (errores === 0) {
      console.log('✅ Todas las conexiones son válidas');
    } else {
      console.log(`\n⚠️  Se encontraron ${errores} problemas`);
    }
    
    console.log('\n\n🎯 FLUJO FINAL (SIN LOOPS VISUALES):\n');
    console.log('webhook → conversacional → formateador → router-inicial');
    console.log('  ├─ route-pedir-datos → gpt-pedir-datos → whatsapp → woocommerce');
    console.log('  └─ route-buscar → woocommerce');
    console.log('    → gpt-asistente-ventas → whatsapp → clasificador → router-intencion');
    console.log('      ├─ route-agregar → confirmacion → whatsapp → clasificador → router-continuar');
    console.log('      │   ├─ route-seguir → [FIN - reinicia]');
    console.log('      │   └─ route-finalizar → mercadopago → whatsapp');
    console.log('      ├─ route-buscar-mas → [FIN - reinicia]');
    console.log('      └─ route-checkout → mercadopago → whatsapp');
    
    console.log('\n✅ Rediseño completado\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

redisenarFlujoLimpio();
