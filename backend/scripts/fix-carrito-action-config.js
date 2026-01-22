import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixCarritoActionConfig() {
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
    
    const nodoCarrito = wooFlow.nodes.find(n => n.id === 'carrito-agregar-producto');
    
    if (!nodoCarrito) {
      console.log('❌ Nodo carrito-agregar-producto no encontrado');
      return;
    }
    
    console.log('\n🔧 Corrigiendo configuración del nodo carrito-action...\n');
    
    // El usuario selecciona el número del producto (1, 2, 3, 4)
    // Necesitamos obtener el producto de productos_presentados usando ese índice
    
    nodoCarrito.data.config = {
      action: 'agregar',
      itemFields: {
        id: '{{productos_presentados[{{mensaje_usuario}} - 1].id}}',
        nombre: '{{productos_presentados[{{mensaje_usuario}} - 1].titulo}}',
        precio: '{{productos_presentados[{{mensaje_usuario}} - 1].precio}}',
        cantidad: 1,
        imagen: '{{productos_presentados[{{mensaje_usuario}} - 1].imagen}}',
        metadata: {
          permalink: '{{productos_presentados[{{mensaje_usuario}} - 1].url}}'
        }
      }
    };
    
    console.log('✅ Configuración actualizada:');
    console.log(JSON.stringify(nodoCarrito.data.config, null, 2));
    
    console.log('\n💾 Guardando cambios...');
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    console.log(`   Modified count: ${result.modifiedCount}`);
    
    console.log('\n✅ CONFIGURACIÓN CORREGIDA');
    console.log('\nEl nodo ahora obtiene los datos de productos_presentados usando mensaje_usuario como índice');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixCarritoActionConfig();
