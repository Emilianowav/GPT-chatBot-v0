const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * CORREGIR VARIABLES EN NODOS WHATSAPP
 * 
 * Problemas:
 * 1. Los nodos WhatsApp usan {{gpt_response}} pero los nodos GPT devuelven "respuesta_gpt"
 * 2. phoneNumberId está vacío
 * 
 * Soluciones:
 * 1. Cambiar {{gpt_response}} por {{gpt-pedir-datos.respuesta_gpt}} (referencia al nodo anterior)
 * 2. Agregar phoneNumberId a la configuración del flujo o de cada nodo WhatsApp
 */

async function fixWhatsAppVariables() {
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
    
    console.log('\n🔧 CORRIGIENDO VARIABLES EN NODOS WHATSAPP\n');
    console.log('═'.repeat(80));
    
    // Mapeo de nodos WhatsApp a su nodo GPT anterior
    const whatsappToGPT = {
      'whatsapp-preguntar': 'gpt-pedir-datos',
      'whatsapp-asistente': 'gpt-asistente-ventas',
      'whatsapp-confirmacion': 'gpt-carrito',
      'whatsapp-pago': 'mercadopago' // Este debería usar el output de mercadopago
    };
    
    let cambios = 0;
    
    Object.entries(whatsappToGPT).forEach(([whatsappId, gptId]) => {
      const node = flow.nodes.find(n => n.id === whatsappId);
      
      if (node) {
        console.log(`\n📱 ${whatsappId}:`);
        console.log(`   Mensaje (antes): ${node.data.config.message}`);
        
        // Actualizar mensaje para referenciar el nodo GPT correcto
        if (gptId === 'mercadopago') {
          // Para mercadopago, usar payment_link
          node.data.config.message = `{{${gptId}.payment_link}}`;
        } else {
          // Para GPT, usar respuesta_gpt
          node.data.config.message = `{{${gptId}.respuesta_gpt}}`;
        }
        
        console.log(`   Mensaje (después): ${node.data.config.message}`);
        
        // Agregar phoneNumberId si no existe
        if (!node.data.config.phoneNumberId) {
          node.data.config.phoneNumberId = '906667632531979';
          console.log(`   phoneNumberId: 906667632531979 ✅`);
        }
        
        cambios++;
      }
    });
    
    console.log(`\n📊 ${cambios} nodos actualizados`);
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Variables de nodos WhatsApp corregidas\n');
    
    // Mostrar configuración final
    console.log('📋 CONFIGURACIÓN FINAL:\n');
    
    Object.keys(whatsappToGPT).forEach(whatsappId => {
      const node = flow.nodes.find(n => n.id === whatsappId);
      if (node) {
        console.log(`${whatsappId}:`);
        console.log(`  message: ${node.data.config.message}`);
        console.log(`  phoneNumberId: ${node.data.config.phoneNumberId}`);
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWhatsAppVariables();
