/**
 * Script para eliminar la conexión incorrecta router → WooCommerce
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';
const EDGE_PROBLEMATICO = 'reactflow__edge-routerroute-2-woocommerce';

async function eliminarConexion() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🗑️  ELIMINANDO CONEXIÓN INCORRECTA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar el edge problemático
    const edgeIndex = flow.edges.findIndex(e => e.id === EDGE_PROBLEMATICO);
    
    if (edgeIndex === -1) {
      console.log('⚠️  Edge no encontrado, puede que ya esté eliminado');
      return;
    }
    
    const edge = flow.edges[edgeIndex];
    console.log('📋 EDGE A ELIMINAR:');
    console.log(`   ID: ${edge.id}`);
    console.log(`   Source: ${edge.source} (Router)`);
    console.log(`   Target: ${edge.target} (WooCommerce)`);
    console.log(`   Source Handle: ${edge.sourceHandle}`);
    
    // Eliminar el edge
    flow.edges.splice(edgeIndex, 1);
    
    // Guardar cambios
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          edges: flow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Edge eliminado correctamente');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total edges antes: ${flow.edges.length + 1}`);
    console.log(`Total edges después: ${flow.edges.length}`);
    console.log('\n✅ FLUJO CORREGIDO:');
    console.log('   ❌ Router → WooCommerce (eliminado)');
    console.log('   ✅ whatsapp-solicitar-datos → WooCommerce (mantiene)');
    console.log('\n💡 Ahora solo Router Carrito puede llegar a WooCommerce');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
eliminarConexion()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
