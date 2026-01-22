import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function revertirNodoCarritoAction() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔄 Revirtiendo cambios del nodo carrito-action...\n');
    
    // Eliminar nodo carrito-agregar-producto
    const nodoIndex = wooFlow.nodes.findIndex(n => n.id === 'carrito-agregar-producto');
    if (nodoIndex !== -1) {
      wooFlow.nodes.splice(nodoIndex, 1);
      console.log('✅ Nodo carrito-agregar-producto eliminado');
    }
    
    // Eliminar edge desde carrito-agregar-producto
    const edgeIndex1 = wooFlow.edges.findIndex(e => e.source === 'carrito-agregar-producto');
    if (edgeIndex1 !== -1) {
      wooFlow.edges.splice(edgeIndex1, 1);
      console.log('✅ Edge desde carrito-agregar-producto eliminado');
    }
    
    // Restaurar edge de router-principal a gpt-armar-carrito
    const edgeIndex2 = wooFlow.edges.findIndex(e => 
      e.source === 'router-principal' && 
      e.target === 'carrito-agregar-producto'
    );
    
    if (edgeIndex2 !== -1) {
      wooFlow.edges[edgeIndex2].target = 'gpt-armar-carrito';
      console.log('✅ Edge restaurado: router-principal → gpt-armar-carrito');
    }
    
    console.log('\n💾 Guardando cambios...');
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          edges: wooFlow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios revertidos');
    console.log(`   Modified count: ${result.modifiedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

revertirNodoCarritoAction();
