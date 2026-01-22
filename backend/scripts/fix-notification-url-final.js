import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixNotificationUrl() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═'.repeat(80));
    console.log('🔧 CORREGIR URL DEL WEBHOOK DE MERCADOPAGO');
    console.log('═'.repeat(80));
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    const nodoMPIndex = wooFlow.nodes.findIndex(n => n.id === 'mercadopago-crear-preference');
    
    if (nodoMPIndex === -1) {
      console.log('❌ Nodo mercadopago-crear-preference no encontrado');
      return;
    }
    
    console.log('\n📋 URL ACTUAL:');
    console.log(`   ${wooFlow.nodes[nodoMPIndex].data.config.notificationUrl}`);
    
    console.log('\n✅ URL CORRECTA (la que funciona):');
    console.log('   https://gpt-chatbot-v0.onrender.com/api/modules/mercadopago/webhooks');
    
    console.log('\n📚 Esta es la ruta que existe en el backend:');
    console.log('   app.use("/api/modules/mercadopago", mercadopagoRoutes)');
    console.log('   router.use("/webhooks", webhooksRoutes)');
    console.log('   → Ruta final: /api/modules/mercadopago/webhooks ✅');
    
    // Actualizar URL
    wooFlow.nodes[nodoMPIndex].data.config.notificationUrl = 'https://gpt-chatbot-v0.onrender.com/api/modules/mercadopago/webhooks';
    
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
    
    console.log('\n═'.repeat(80));
    console.log('✅ URL DEL WEBHOOK CORREGIDA');
    console.log('═'.repeat(80));
    
    console.log('\n📋 CONFIGURACIÓN FINAL:');
    console.log('   Backend: /api/modules/mercadopago/webhooks');
    console.log('   MongoDB: https://gpt-chatbot-v0.onrender.com/api/modules/mercadopago/webhooks');
    console.log('   MercadoPago Panel: https://gpt-chatbot-v0.onrender.com/api/modules/mercadopago/webhooks');
    
    console.log('\n✅ TODO LISTO PARA FUNCIONAR');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixNotificationUrl();
