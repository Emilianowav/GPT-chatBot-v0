/**
 * Script para Eliminar Nodos Viejos Desconectados
 * 
 * OBJETIVO:
 * Eliminar el flujo viejo de la derecha (6 nodos) que está desconectado del webhook
 * 
 * NODOS A ELIMINAR:
 * - gpt-clasificador (viejo)
 * - router-intencion
 * - gpt-carrito
 * - whatsapp-confirmacion
 * - mercadopago (viejo)
 * - whatsapp-pago
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function eliminarNodosViejos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log('\n📊 Flujo actual:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    // ============================================================
    // PASO 1: Identificar nodos alcanzables desde el webhook
    // ============================================================
    
    console.log('\n🔍 PASO 1: Identificando nodos alcanzables desde webhook...');
    
    const webhook = flow.nodes.find(n => n.id === 'webhook-whatsapp');
    
    if (!webhook) {
      throw new Error('Webhook no encontrado');
    }
    
    // Función para encontrar todos los nodos alcanzables
    function encontrarNodosAlcanzables(nodeId, alcanzables = new Set()) {
      if (alcanzables.has(nodeId)) return alcanzables;
      
      alcanzables.add(nodeId);
      
      // Encontrar todas las conexiones salientes
      const salidas = flow.edges.filter(e => e.source === nodeId);
      
      salidas.forEach(edge => {
        encontrarNodosAlcanzables(edge.target, alcanzables);
      });
      
      return alcanzables;
    }
    
    const nodosAlcanzables = encontrarNodosAlcanzables(webhook.id);
    
    console.log(`   Nodos alcanzables desde webhook: ${nodosAlcanzables.size}`);
    console.log('\n   Lista de nodos alcanzables:');
    Array.from(nodosAlcanzables).forEach(id => {
      const node = flow.nodes.find(n => n.id === id);
      console.log(`      - ${id} [${node?.type}]`);
    });
    
    // ============================================================
    // PASO 2: Identificar nodos a eliminar (no alcanzables)
    // ============================================================
    
    console.log('\n🔍 PASO 2: Identificando nodos a eliminar...');
    
    const nodosAEliminar = flow.nodes.filter(n => !nodosAlcanzables.has(n.id));
    
    console.log(`\n   Nodos a eliminar: ${nodosAEliminar.length}`);
    
    if (nodosAEliminar.length === 0) {
      console.log('   ✅ No hay nodos desconectados para eliminar');
      return;
    }
    
    console.log('\n   Lista de nodos a eliminar:');
    nodosAEliminar.forEach(node => {
      console.log(`      - ${node.id} [${node.type}] "${node.data?.label || 'sin label'}"`);
    });
    
    // ============================================================
    // PASO 3: Confirmar eliminación
    // ============================================================
    
    console.log('\n⚠️  CONFIRMACIÓN:');
    console.log(`   Se eliminarán ${nodosAEliminar.length} nodos desconectados`);
    console.log(`   Se mantendrán ${nodosAlcanzables.size} nodos conectados al webhook`);
    
    // ============================================================
    // PASO 4: Eliminar nodos y sus conexiones
    // ============================================================
    
    console.log('\n🗑️  PASO 3: Eliminando nodos y conexiones...');
    
    const idsAEliminar = new Set(nodosAEliminar.map(n => n.id));
    
    // Eliminar nodos
    const nodosAnteriores = flow.nodes.length;
    flow.nodes = flow.nodes.filter(n => !idsAEliminar.has(n.id));
    console.log(`   Nodos eliminados: ${nodosAnteriores - flow.nodes.length}`);
    
    // Eliminar conexiones relacionadas a esos nodos
    const edgesAnteriores = flow.edges.length;
    flow.edges = flow.edges.filter(e => 
      !idsAEliminar.has(e.source) && !idsAEliminar.has(e.target)
    );
    console.log(`   Conexiones eliminadas: ${edgesAnteriores - flow.edges.length}`);
    
    // ============================================================
    // PASO 5: Verificar flujo resultante
    // ============================================================
    
    console.log('\n🔍 PASO 4: Verificando flujo resultante...');
    
    console.log(`\n   Nodos finales: ${flow.nodes.length}`);
    console.log(`   Conexiones finales: ${flow.edges.length}`);
    
    // Verificar que los nodos críticos siguen presentes
    const nodosCriticos = [
      'webhook-whatsapp',
      'gpt-clasificador-inteligente',
      'router-principal',
      'gpt-formateador',
      'gpt-armar-carrito',
      'router-carrito',
      'mercadopago-crear-preference',
      'whatsapp-link-pago'
    ];
    
    console.log('\n   Verificando nodos críticos:');
    let todosCriticosPresentes = true;
    nodosCriticos.forEach(id => {
      const existe = flow.nodes.find(n => n.id === id);
      if (existe) {
        console.log(`      ✅ ${id}`);
      } else {
        console.log(`      ❌ ${id} FALTA`);
        todosCriticosPresentes = false;
      }
    });
    
    if (!todosCriticosPresentes) {
      throw new Error('ERROR: Se eliminaron nodos críticos. Abortando.');
    }
    
    // ============================================================
    // PASO 6: Guardar cambios
    // ============================================================
    
    console.log('\n💾 PASO 5: Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ NODOS VIEJOS ELIMINADOS EXITOSAMENTE');
    console.log('='.repeat(60));
    
    console.log('\n📊 Resumen:');
    console.log(`   Nodos eliminados: ${nodosAEliminar.length}`);
    console.log(`   Nodos restantes: ${flow.nodes.length}`);
    console.log(`   Conexiones eliminadas: ${edgesAnteriores - flow.edges.length}`);
    console.log(`   Conexiones restantes: ${flow.edges.length}`);
    
    console.log('\n✅ Flujo limpio y optimizado');
    console.log('   Solo quedan los nodos conectados al webhook');
    
    console.log('\n🎯 Próximos pasos:');
    console.log('   1. Refresca el frontend para ver el flujo limpio');
    console.log('   2. Verifica que todo funciona correctamente');
    console.log('   3. Prueba el flujo completo desde WhatsApp');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
eliminarNodosViejos()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
