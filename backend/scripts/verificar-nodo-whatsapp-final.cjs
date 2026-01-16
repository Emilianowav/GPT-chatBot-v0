/**
 * Script para Verificar Nodo WhatsApp Final
 * 
 * OBJETIVO:
 * Verificar la configuración del nodo whatsapp-link-pago
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarNodoWhatsApp() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═'.repeat(80));
    console.log('🔍 VERIFICANDO NODO WHATSAPP FINAL');
    console.log('═'.repeat(80));
    
    const flow = await db.collection('flows').findOne({ _id: new MongoClient.ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    const nodoWhatsApp = flow.nodes.find(n => n.id === 'whatsapp-link-pago');
    
    if (!nodoWhatsApp) {
      console.log('❌ Nodo whatsapp-link-pago no encontrado');
      return;
    }
    
    console.log('\n📋 NODO WHATSAPP-LINK-PAGO:');
    console.log(JSON.stringify(nodoWhatsApp, null, 2));
    
    console.log('\n' + '═'.repeat(80));
    console.log('📊 ANÁLISIS:');
    console.log('═'.repeat(80));
    
    if (!nodoWhatsApp.config) {
      console.log('❌ NO TIENE CONFIG');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   El nodo debe tener config.message con el texto a enviar');
      console.log('   Ejemplo: config.message = "{{mercadopago-crear-preference.mensaje}}"');
    } else if (!nodoWhatsApp.config.message) {
      console.log('❌ CONFIG NO TIENE MESSAGE');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   Agregar config.message con el texto a enviar');
    } else {
      console.log('✅ CONFIG PRESENTE:');
      console.log(`   message: ${nodoWhatsApp.config.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarNodoWhatsApp()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
