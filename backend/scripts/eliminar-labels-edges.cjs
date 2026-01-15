const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * ELIMINAR LABELS DE EDGES
 * 
 * Las etiquetas que aparecen en las conexiones son por edge.data.label
 * Voy a eliminar todos los data.label de los edges
 */

async function eliminarLabelsEdges() {
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
    
    console.log('\n🔧 ELIMINANDO LABELS DE EDGES\n');
    console.log('═'.repeat(80));
    
    let edgesModificados = 0;
    
    flow.edges.forEach(edge => {
      if (edge.data) {
        console.log(`\n📍 ${edge.id}:`);
        if (edge.data.label) {
          console.log(`   ❌ Eliminando label: "${edge.data.label}"`);
          delete edge.data.label;
          edgesModificados++;
        }
        
        // Si data quedó vacío, eliminarlo completamente
        if (Object.keys(edge.data).length === 0) {
          delete edge.data;
        }
      }
    });
    
    console.log(`\n📊 ${edgesModificados} edges modificados`);
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('\n✅ Labels eliminados de edges\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

eliminarLabelsEdges();
