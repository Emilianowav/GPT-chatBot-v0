const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * CORRECCIÓN FINAL:
 * 
 * Problema 1: woocommerce tiene 2 entradas
 *   - Desde router-inicial (route-pedir-datos → ... → woocommerce)
 *   - Desde router-inicial (route-buscar → woocommerce)
 * 
 * Solución: Eliminar edge directo router-inicial → woocommerce
 *           Ambos caminos deben pasar por whatsapp-preguntar primero
 * 
 * Problema 2: gpt-mercadopago tiene 2 entradas
 *   - Desde router-continuar (route-finalizar)
 *   - Desde router-intencion (route-checkout)
 * 
 * Solución: Esto es correcto. Necesitamos crear un nodo intermedio
 *           o aceptar que mercadopago puede recibir desde 2 routers diferentes.
 *           MEJOR: Mantener ambas entradas ya que son caminos lógicamente diferentes.
 */

async function corregirEntradasMultiples() {
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
    
    console.log('\n🔧 CORRIGIENDO ENTRADAS MÚLTIPLES\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // CORRECCIÓN 1: woocommerce debe tener solo 1 entrada
    // ============================================================================
    console.log('\n📍 Problema 1: woocommerce tiene 2 entradas\n');
    
    // Eliminar edge directo: router-inicial → woocommerce
    const edgeDirectoWoo = flow.edges.findIndex(e => 
      e.source === 'router-inicial' && e.target === 'woocommerce'
    );
    
    if (edgeDirectoWoo !== -1) {
      console.log('❌ Eliminando: router-inicial → woocommerce (directo)');
      flow.edges.splice(edgeDirectoWoo, 1);
    }
    
    // Asegurar que route-buscar vaya a whatsapp-preguntar
    const edgeRouterToWhatsapp = flow.edges.find(e => 
      e.source === 'router-inicial' && e.sourceHandle === 'route-buscar'
    );
    
    if (!edgeRouterToWhatsapp) {
      console.log('✅ Creando: router-inicial (route-buscar) → whatsapp-preguntar');
      flow.edges.push({
        id: 'edge-router-buscar-to-whatsapp',
        source: 'router-inicial',
        sourceHandle: 'route-buscar',
        target: 'whatsapp-preguntar',
        type: 'default'
      });
    } else if (edgeRouterToWhatsapp.target !== 'whatsapp-preguntar') {
      console.log('✅ Corrigiendo: router-inicial (route-buscar) → whatsapp-preguntar');
      edgeRouterToWhatsapp.target = 'whatsapp-preguntar';
    }
    
    console.log('✅ Ahora ambos caminos pasan por whatsapp-preguntar antes de woocommerce');
    
    // ============================================================================
    // CORRECCIÓN 2: gpt-mercadopago - Aceptar 2 entradas válidas
    // ============================================================================
    console.log('\n📍 Problema 2: gpt-mercadopago tiene 2 entradas\n');
    console.log('   Análisis: Las 2 entradas son lógicamente válidas:');
    console.log('   1. router-continuar (route-finalizar) - Usuario agregó al carrito y quiere finalizar');
    console.log('   2. router-intencion (route-checkout) - Usuario quiere checkout directo sin agregar');
    console.log('✅ Manteniendo ambas entradas (es correcto para este caso)');
    
    // ============================================================================
    // GUARDAR CAMBIOS
    // ============================================================================
    console.log('\n📍 Guardando cambios en MongoDB\n');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('✅ Cambios guardados');
    
    // ============================================================================
    // VERIFICACIÓN FINAL
    // ============================================================================
    console.log('\n📊 VERIFICACIÓN FINAL\n');
    console.log('─'.repeat(80));
    
    const verificacion = {};
    flow.nodes.forEach(node => {
      const incoming = flow.edges.filter(e => e.target === node.id);
      const outgoing = flow.edges.filter(e => e.source === node.id);
      
      verificacion[node.id] = {
        incoming: incoming.length,
        outgoing: outgoing.length,
        type: node.type,
        incomingFrom: incoming.map(e => `${e.source}${e.sourceHandle ? `[${e.sourceHandle}]` : ''}`)
      };
    });
    
    let errores = 0;
    let advertencias = 0;
    
    Object.entries(verificacion).forEach(([nodeId, data]) => {
      if (data.type !== 'router' && data.type !== 'webhook' && data.incoming > 1) {
        // Excepción: gpt-mercadopago puede tener 2 entradas (checkout directo y desde carrito)
        if (nodeId === 'gpt-mercadopago' && data.incoming === 2) {
          console.log(`⚠️  ${nodeId}: ${data.incoming} entradas (válido - checkout dual)`);
          console.log(`    Desde: ${data.incomingFrom.join(', ')}`);
          advertencias++;
        } else {
          console.log(`❌ ${nodeId}: ${data.incoming} entradas (debería tener 1)`);
          console.log(`    Desde: ${data.incomingFrom.join(', ')}`);
          errores++;
        }
      }
      if (data.type !== 'router' && data.outgoing > 1) {
        console.log(`❌ ${nodeId}: ${data.outgoing} salidas (debería tener 1)`);
        errores++;
      }
    });
    
    if (errores === 0) {
      console.log('✅ Todas las conexiones son válidas');
      if (advertencias > 0) {
        console.log(`ℹ️  ${advertencias} advertencia(s) - casos especiales válidos`);
      }
    } else {
      console.log(`\n❌ Se encontraron ${errores} errores`);
    }
    
    console.log('\n\n🎯 FLUJO FINAL CORREGIDO:\n');
    console.log('webhook → conversacional → formateador → router-inicial');
    console.log('  ├─ route-pedir-datos → gpt-pedir-datos → whatsapp-preguntar → woocommerce');
    console.log('  └─ route-buscar → whatsapp-preguntar → woocommerce');
    console.log('    → gpt-asistente-ventas → whatsapp → clasificador → router-intencion');
    console.log('      ├─ route-agregar → confirmacion → whatsapp → clasificador → router-continuar');
    console.log('      │   ├─ route-seguir → [FIN]');
    console.log('      │   └─ route-finalizar → mercadopago → whatsapp');
    console.log('      ├─ route-buscar-mas → [FIN]');
    console.log('      └─ route-checkout → mercadopago → whatsapp');
    
    console.log('\n✅ Corrección completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

corregirEntradasMultiples();
