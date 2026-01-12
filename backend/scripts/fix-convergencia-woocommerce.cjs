const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * SOLUCIÓN: Hacer que ambos caminos del router pasen por whatsapp-preguntar
 * 
 * ANTES:
 * router
 *   ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar → woocommerce
 *   └─ route-2 → woocommerce (PROBLEMA: woocommerce tiene 2 entradas)
 * 
 * DESPUÉS:
 * router
 *   ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar → woocommerce
 *   └─ route-2 → whatsapp-preguntar → woocommerce
 * 
 * Ahora whatsapp-preguntar tiene 2 entradas (válido - converge dos caminos)
 * Y woocommerce tiene solo 1 entrada
 */

async function fixConvergenciaWoocommerce() {
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
    
    console.log('\n🔧 CORRIGIENDO CONVERGENCIA A WOOCOMMERCE\n');
    console.log('═'.repeat(80));
    
    // Encontrar y modificar el edge: router (route-2) → woocommerce
    const edgeRouterToWoo = flow.edges.find(e => 
      e.source === 'router' && e.sourceHandle === 'route-2' && e.target === 'woocommerce'
    );
    
    if (edgeRouterToWoo) {
      console.log('❌ Encontrado: router (route-2) → woocommerce');
      console.log('✅ Cambiando a: router (route-2) → whatsapp-preguntar');
      edgeRouterToWoo.target = 'whatsapp-preguntar';
    }
    
    // Verificar que existe edge: whatsapp-preguntar → woocommerce
    const edgeWhatsappToWoo = flow.edges.find(e => 
      e.source === 'whatsapp-preguntar' && e.target === 'woocommerce'
    );
    
    if (!edgeWhatsappToWoo) {
      console.log('⚠️  No existe edge: whatsapp-preguntar → woocommerce');
      console.log('✅ Creando edge');
      flow.edges.push({
        id: 'edge-whatsapp-to-woocommerce',
        source: 'whatsapp-preguntar',
        target: 'woocommerce',
        type: 'default'
      });
    } else {
      console.log('✅ Ya existe: whatsapp-preguntar → woocommerce');
    }
    
    // Guardar cambios
    console.log('\n📍 Guardando cambios en MongoDB\n');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('✅ Cambios guardados');
    
    // Verificación
    console.log('\n📊 VERIFICACIÓN\n');
    console.log('─'.repeat(80));
    
    const analisis = {};
    flow.nodes.forEach(node => {
      const incoming = flow.edges.filter(e => e.target === node.id);
      const outgoing = flow.edges.filter(e => e.source === node.id);
      
      analisis[node.id] = {
        type: node.type,
        incoming: incoming.length,
        outgoing: outgoing.length,
        incomingFrom: incoming.map(e => `${e.source}${e.sourceHandle ? `[${e.sourceHandle}]` : ''}`)
      };
    });
    
    let errores = 0;
    
    Object.entries(analisis).forEach(([nodeId, data]) => {
      if (data.type !== 'router' && data.type !== 'webhook' && data.incoming > 1) {
        // Casos válidos de convergencia
        if (nodeId === 'whatsapp-preguntar' && data.incoming === 2) {
          console.log(`⚠️  ${nodeId}: ${data.incoming} entradas (válido - convergencia de búsqueda)`);
          console.log(`    Desde: ${data.incomingFrom.join(', ')}`);
        } else if (nodeId === 'gpt-mercadopago' && data.incoming === 2) {
          console.log(`⚠️  ${nodeId}: ${data.incoming} entradas (válido - checkout dual)`);
          console.log(`    Desde: ${data.incomingFrom.join(', ')}`);
        } else {
          console.log(`❌ ${nodeId}: ${data.incoming} entradas`);
          console.log(`    Desde: ${data.incomingFrom.join(', ')}`);
          errores++;
        }
      }
      
      if (data.type !== 'router' && data.outgoing > 1) {
        console.log(`❌ ${nodeId}: ${data.outgoing} salidas`);
        errores++;
      }
    });
    
    if (errores === 0) {
      console.log('✅ Todas las conexiones son válidas');
    } else {
      console.log(`\n❌ ${errores} errores encontrados`);
    }
    
    console.log('\n\n🎯 FLUJO CORREGIDO:\n');
    console.log('webhook → conversacional → formateador → router');
    console.log('  ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar');
    console.log('  └─ route-2 → whatsapp-preguntar');
    console.log('    → woocommerce → gpt-asistente-ventas → whatsapp → clasificador → router-intencion');
    console.log('      ├─ route-agregar → confirmacion → whatsapp → clasificador → router-continuar');
    console.log('      │                                                 └─ route-finalizar → mercadopago → whatsapp');
    console.log('      └─ route-checkout → mercadopago → whatsapp');
    
    console.log('\n✅ Corrección completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixConvergenciaWoocommerce();
