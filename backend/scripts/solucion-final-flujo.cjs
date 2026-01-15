const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * SOLUCIÓN FINAL - FLUJO 100% LINEAL
 * 
 * Cambio: router-inicial ahora tiene solo 1 salida hacia woocommerce
 * La lógica de "pedir datos" vs "buscar directo" se maneja DENTRO del GPT,
 * no con un router visual.
 * 
 * FLUJO SIMPLIFICADO:
 * 
 * webhook → gpt-conversacional → gpt-formateador → woocommerce
 *   → gpt-asistente-ventas → whatsapp-asistente 
 *   → gpt-clasificador-intencion → router-intencion (3 salidas):
 *     ├─ route-agregar → gpt-confirmacion → whatsapp-confirmacion
 *     │                   → gpt-clasificador-continuar → router-continuar:
 *     │                     ├─ route-seguir → [FIN]
 *     │                     └─ route-finalizar → gpt-mercadopago → whatsapp-mercadopago
 *     ├─ route-buscar-mas → [FIN]
 *     └─ route-checkout → gpt-mercadopago → whatsapp-mercadopago
 */

async function solucionFinalFlujo() {
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
    
    console.log('\n🔧 SOLUCIÓN FINAL - FLUJO 100% LINEAL\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // DECISIÓN: ELIMINAR router-inicial y nodos intermedios innecesarios
    // ============================================================================
    console.log('\n📍 Simplificando flujo: Eliminando router-inicial\n');
    
    // Eliminar nodos innecesarios
    const nodosAEliminar = ['router-inicial', 'gpt-pedir-datos', 'whatsapp-preguntar'];
    
    flow.nodes = flow.nodes.filter(node => !nodosAEliminar.includes(node.id));
    console.log(`✅ Eliminados ${nodosAEliminar.length} nodos: ${nodosAEliminar.join(', ')}`);
    
    // ============================================================================
    // RECONSTRUIR EDGES - FLUJO LINEAL SIMPLE
    // ============================================================================
    console.log('\n📍 Reconstruyendo edges - Flujo lineal\n');
    
    const nuevosEdges = [
      // FASE 1: Conversación → WooCommerce directo
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
        id: 'edge-formateador-to-woocommerce',
        source: 'gpt-formateador',
        target: 'woocommerce',
        type: 'default'
      },
      
      // FASE 2: Presentación de productos
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
      
      // FASE 3: Clasificación de intención
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
    ];
    
    flow.edges = nuevosEdges;
    console.log(`✅ ${nuevosEdges.length} edges creados`);
    
    // ============================================================================
    // ACTUALIZAR ROUTERS
    // ============================================================================
    console.log('\n📍 Actualizando routers\n');
    
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
    // GUARDAR EN MONGODB
    // ============================================================================
    console.log('\n📍 Guardando cambios en MongoDB\n');
    
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
    // VERIFICACIÓN FINAL
    // ============================================================================
    console.log('\n📊 VERIFICACIÓN FINAL\n');
    console.log('─'.repeat(80));
    
    let errores = 0;
    
    flow.nodes.forEach(node => {
      const incoming = flow.edges.filter(e => e.target === node.id).length;
      const outgoing = flow.edges.filter(e => e.source === node.id).length;
      
      // Verificar entradas múltiples
      if (node.type !== 'router' && node.type !== 'webhook' && incoming > 1) {
        // Excepción: gpt-mercadopago puede tener 2 entradas
        if (node.id === 'gpt-mercadopago' && incoming === 2) {
          console.log(`⚠️  ${node.id}: ${incoming} entradas (válido - checkout dual)`);
        } else {
          console.log(`❌ ${node.id}: ${incoming} entradas (debería tener 1)`);
          errores++;
        }
      }
      
      // Verificar salidas múltiples
      if (node.type !== 'router' && outgoing > 1) {
        console.log(`❌ ${node.id}: ${outgoing} salidas (debería tener 1)`);
        errores++;
      }
    });
    
    if (errores === 0) {
      console.log('✅ Todas las conexiones son válidas');
    } else {
      console.log(`\n❌ Se encontraron ${errores} errores`);
    }
    
    console.log('\n\n🎯 FLUJO FINAL - 100% LINEAL:\n');
    console.log('webhook → gpt-conversacional → gpt-formateador → woocommerce');
    console.log('  → gpt-asistente-ventas → whatsapp-asistente');
    console.log('  → gpt-clasificador-intencion → router-intencion (3 salidas):');
    console.log('    ├─ route-agregar → gpt-confirmacion → whatsapp-confirmacion');
    console.log('    │                   → gpt-clasificador-continuar → router-continuar:');
    console.log('    │                     ├─ route-seguir → [FIN - reinicia]');
    console.log('    │                     └─ route-finalizar → gpt-mercadopago → whatsapp-mercadopago');
    console.log('    ├─ route-buscar-mas → [FIN - reinicia]');
    console.log('    └─ route-checkout → gpt-mercadopago → whatsapp-mercadopago');
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Nodos totales: ${flow.nodes.length}`);
    console.log(`   Edges totales: ${flow.edges.length}`);
    console.log(`   Routers: ${flow.nodes.filter(n => n.type === 'router').length}`);
    
    console.log('\n✅ Solución final completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

solucionFinalFlujo();
