const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * ELIMINAR EDGE INCORRECTO
 * 
 * Eliminar edge-buscar-mas que crea un ciclo incorrecto
 * router-intencion NO debe conectar a woocommerce
 */

async function limpiarEdgeIncorrecto() {
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
    
    console.log('\n🔧 LIMPIANDO EDGE INCORRECTO\n');
    console.log('═'.repeat(80));
    
    const edgeIncorrecto = flow.edges.find(e => e.id === 'edge-buscar-mas');
    
    if (edgeIncorrecto) {
      console.log(`\n❌ Eliminando edge incorrecto:`);
      console.log(`   ID: ${edgeIncorrecto.id}`);
      console.log(`   ${edgeIncorrecto.source} → ${edgeIncorrecto.target}`);
      
      flow.edges = flow.edges.filter(e => e.id !== 'edge-buscar-mas');
      
      console.log('\n✅ Edge eliminado');
    } else {
      console.log('\n✅ Edge ya no existe');
    }
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('\n📊 Edges actuales: ' + flow.edges.length);
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

limpiarEdgeIncorrecto();
