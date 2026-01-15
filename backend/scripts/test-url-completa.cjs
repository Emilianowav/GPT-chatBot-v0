require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const TELEFONO = '5493794946066';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function testURLCompleta() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const { FlowExecutor } = require('../dist/services/FlowExecutor.js');
    const ConversationState = mongoose.model('ConversationState', new mongoose.Schema({}, { strict: false }), 'conversation_states');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 TEST: URL COMPLETA EN PRODUCTOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await ConversationState.deleteMany({ phone: TELEFONO });
    
    const executor = new FlowExecutor();
    
    await executor.execute(
      FLOW_ID,
      {
        message: 'Busco harry potter 5',
        from: TELEFONO,
        timestamp: Date.now()
      },
      null
    );
    
    const globalVars = executor.getAllGlobalVariables();
    const productos = globalVars['woocommerce.productos'];
    
    console.log('\n📦 PRODUCTOS SIMPLIFICADOS:\n');
    if (productos && productos.length > 0) {
      productos.slice(0, 3).forEach((p, i) => {
        console.log(`${i + 1}. ${p.titulo}`);
        console.log(`   Precio: $${p.precio}`);
        console.log(`   URL: ${p.url}`);
        console.log(`   Stock: ${p.stock}`);
        console.log('');
      });
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ VERIFICACIÓN DE URLs:\n');
      
      const primerProducto = productos[0];
      const urlEsCompleta = primerProducto.url.startsWith('http');
      
      if (urlEsCompleta) {
        console.log('✅ URLs CORRECTAS - Son URLs completas');
        console.log(`   Ejemplo: ${primerProducto.url}`);
        console.log('');
        console.log('El bot enviará links clickeables que llevan al catálogo.');
      } else {
        console.log('❌ URLs INCORRECTAS - Son solo slugs');
        console.log(`   Ejemplo: ${primerProducto.url}`);
        console.log('');
        console.log('El bot enviará texto plano en lugar de links clickeables.');
      }
    } else {
      console.log('❌ No se encontraron productos');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testURLCompleta();
