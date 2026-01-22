import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function eliminarNodoCarritoYUsarGPT() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Eliminando nodo carrito-agregar y restaurando flujo original...\n');
    
    // Eliminar nodo carrito-agregar
    const nodoIndex = wooFlow.nodes.findIndex(n => n.id === 'carrito-agregar');
    if (nodoIndex !== -1) {
      wooFlow.nodes.splice(nodoIndex, 1);
      console.log('✅ Nodo carrito-agregar eliminado');
    }
    
    // Eliminar edge desde carrito-agregar
    const edgeIndex1 = wooFlow.edges.findIndex(e => e.source === 'carrito-agregar');
    if (edgeIndex1 !== -1) {
      wooFlow.edges.splice(edgeIndex1, 1);
      console.log('✅ Edge desde carrito-agregar eliminado');
    }
    
    // Restaurar edge de router-principal a gpt-armar-carrito
    const edgeIndex2 = wooFlow.edges.findIndex(e => 
      e.source === 'router-principal' && 
      e.target === 'carrito-agregar'
    );
    
    if (edgeIndex2 !== -1) {
      wooFlow.edges[edgeIndex2].target = 'gpt-armar-carrito';
      console.log('✅ Edge restaurado: router-principal → gpt-armar-carrito');
    }
    
    // Actualizar configuración de gpt-armar-carrito
    const nodoGPT = wooFlow.nodes.find(n => n.id === 'gpt-armar-carrito');
    if (nodoGPT) {
      nodoGPT.data.config.globalVariablesOutput = ['carrito'];
      console.log('✅ gpt-armar-carrito configurado para guardar variable "carrito"');
      
      // Actualizar systemPrompt para que genere el objeto carrito
      nodoGPT.data.config.systemPrompt = `Eres el asistente de carrito de la librería Veo Veo.

IMPORTANTE: Debes responder SIEMPRE en formato JSON con esta estructura EXACTA:

{
  "respuesta_gpt": "mensaje para el usuario",
  "carrito": {
    "productos": [
      {
        "id": "id_del_producto",
        "nombre": "nombre del producto",
        "precio": precio_numerico,
        "cantidad": 1
      }
    ],
    "total": total_numerico
  }
}

INSTRUCCIONES:
1. El usuario acaba de seleccionar un producto de la lista
2. Usa productos_presentados[mensaje_usuario - 1] para obtener el producto
3. Crea el objeto carrito con el producto seleccionado
4. Calcula el total (precio * cantidad)
5. Genera un mensaje de confirmación amigable

Ejemplo de respuesta:
{
  "respuesta_gpt": "¡Genial! Agregué \\"Harry Potter\\" a tu carrito 📚\\n\\n💰 Total: $35000\\n\\n¿Querés finalizar la compra?",
  "carrito": {
    "productos": [
      {
        "id": "12345",
        "nombre": "HARRY POTTER Y EL MISTERIO DEL PRINCIPE",
        "precio": 35000,
        "cantidad": 1
      }
    ],
    "total": 35000
  }
}`;
      
      console.log('✅ systemPrompt actualizado');
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
    
    console.log('✅ Cambios guardados');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ FLUJO RESTAURADO Y CONFIGURADO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 FLUJO ACTUALIZADO:');
    console.log('   router-principal (agregar_carrito)');
    console.log('     ↓');
    console.log('   gpt-armar-carrito');
    console.log('     ↓ Genera objeto carrito con productos y total');
    console.log('     ↓ Guarda variable global "carrito"');
    console.log('   router-carrito');
    console.log('     ↓');
    console.log('   mercadopago-crear-preference');
    console.log('     ↓ Usa carrito.productos y carrito.total\n');
    
    console.log('✅ El GPT generará el objeto carrito en el formato correcto');
    console.log('✅ MercadoPago accederá a carrito.productos y carrito.total');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

eliminarNodoCarritoYUsarGPT();
