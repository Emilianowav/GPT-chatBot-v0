/**
 * Script para Configurar Nodo WhatsApp Link Pago
 * 
 * OBJETIVO:
 * Configurar el nodo whatsapp-link-pago para que envíe el mensaje generado por MercadoPago
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function configurarWhatsAppLinkPago() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═'.repeat(80));
    console.log('🔍 CONFIGURANDO NODO WHATSAPP-LINK-PAGO');
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
    console.log(JSON.stringify(flow.nodes[nodoIndex], null, 2));
    
    // Actualizar configuración del nodo
    flow.nodes[nodoIndex].data = flow.nodes[nodoIndex].data || {};
    flow.nodes[nodoIndex].data.config = {
      module: 'send-message',
      message: '{{mercadopago-crear-preference.mensaje}}',
      to: '{{1.from}}',
      phoneNumberId: '{{phoneNumberId}}'
    };
    
    console.log('\n📝 NUEVA CONFIGURACIÓN:');
    console.log(JSON.stringify(flow.nodes[nodoIndex].data.config, null, 2));
    
    // Guardar en BD
    const result = await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, updatedAt: new Date() } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ Nodo actualizado exitosamente');
      console.log('\n📊 CONFIGURACIÓN APLICADA:');
      console.log('   module: send-message');
      console.log('   message: {{mercadopago-crear-preference.mensaje}}');
      console.log('   to: {{1.from}}');
      console.log('   phoneNumberId: {{phoneNumberId}}');
      
      console.log('\n💡 PRÓXIMO PASO:');
      console.log('   1. Limpiar estado: node scripts/limpiar-mi-numero.js');
      console.log('   2. Probar flujo: "Busco Harry Potter 3" → "lo quiero"');
      console.log('   3. Deberías recibir el mensaje con el link de pago');
    } else {
      console.log('\n⚠️  No se modificó el nodo (puede que ya estuviera configurado)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
configurarWhatsAppLinkPago()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
