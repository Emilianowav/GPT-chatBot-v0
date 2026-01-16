/**
 * Script para Corregir phoneNumberId en Nodo WhatsApp
 * 
 * OBJETIVO:
 * Remover phoneNumberId del config del nodo para que use el del flowConfig
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixPhoneNumberId() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═'.repeat(80));
    console.log('🔧 CORRIGIENDO PHONENUMBERID EN NODO WHATSAPP');
    console.log('═'.repeat(80));
    
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`\n✅ Flow encontrado: ${flow.nombre}`);
    
    // Buscar el nodo whatsapp-link-pago
    const nodoIndex = flow.nodes.findIndex(n => n.id === 'whatsapp-link-pago');
    
    if (nodoIndex === -1) {
      console.log('❌ Nodo whatsapp-link-pago no encontrado');
      return;
    }
    
    console.log('\n📋 CONFIGURACIÓN ACTUAL:');
    console.log(JSON.stringify(flow.nodes[nodoIndex].data.config, null, 2));
    
    // Remover phoneNumberId del config (usará el del flowConfig)
    delete flow.nodes[nodoIndex].data.config.phoneNumberId;
    
    console.log('\n📝 NUEVA CONFIGURACIÓN:');
    console.log(JSON.stringify(flow.nodes[nodoIndex].data.config, null, 2));
    
    // Guardar en BD
    const result = await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, updatedAt: new Date() } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ Nodo actualizado exitosamente');
      console.log('\n📊 CAMBIO APLICADO:');
      console.log('   ❌ Removido: phoneNumberId (usará el del flowConfig)');
      console.log('   ✅ El nodo ahora usará el phoneNumberId del webhook inicial');
      
      console.log('\n💡 PRÓXIMO PASO:');
      console.log('   1. Limpiar estado: node scripts/limpiar-mi-numero.js');
      console.log('   2. Probar flujo: "Busco Harry Potter 3" → "lo quiero"');
      console.log('   3. Deberías recibir el mensaje con el link de pago');
    } else {
      console.log('\n⚠️  No se modificó el nodo');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
fixPhoneNumberId()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
