const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * CORREGIR CONFIGURACIÓN DEL NODO MERCADOPAGO
 * 
 * El nodo mercadopago debe tener:
 * - label correcto
 * - config con items y total definidos
 */

async function corregirMercadoPago() {
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
    
    console.log('\n🔧 CORRIGIENDO NODO MERCADOPAGO\n');
    console.log('═'.repeat(80));
    
    const mercadopagoNode = flow.nodes.find(n => n.id === 'mercadopago');
    
    if (!mercadopagoNode) {
      console.log('❌ Nodo mercadopago no encontrado');
      return;
    }
    
    console.log('\n📍 Configuración actual:\n');
    console.log(JSON.stringify(mercadopagoNode, null, 2));
    
    // Actualizar configuración
    mercadopagoNode.data = {
      ...mercadopagoNode.data,
      label: 'MercadoPago',
      subtitle: 'Generar Link de Pago',
      config: {
        action: 'create_payment_link',
        items: '{{carrito.productos}}',
        total: '{{carrito.total}}'
      }
    };
    
    console.log('\n📍 Configuración nueva:\n');
    console.log(JSON.stringify(mercadopagoNode, null, 2));
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Nodo mercadopago actualizado\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

corregirMercadoPago();
