require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const TELEFONO = '5493794946066';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarURLProductos() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const { FlowExecutor } = require('../dist/services/FlowExecutor.js');
    const ConversationState = mongoose.model('ConversationState', new mongoose.Schema({}, { strict: false }), 'conversation_states');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICAR URL DE PRODUCTOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await ConversationState.deleteMany({ phone: TELEFONO });
    
    const executor = new FlowExecutor();
    
    await executor.execute(
      FLOW_ID,
      {
        message: 'Busco harry potter',
        from: TELEFONO,
        timestamp: Date.now()
      },
      null
    );
    
    const globalVars = executor.getAllGlobalVariables();
    const productos = globalVars['woocommerce.productos'];
    const productosCompletos = globalVars['woocommerce.productos_completos'];
    
    console.log('📦 PRODUCTOS SIMPLIFICADOS (enviados al GPT):\n');
    if (productos && productos.length > 0) {
      productos.slice(0, 2).forEach((p, i) => {
        console.log(`${i + 1}. ${p.titulo}`);
        console.log(`   Precio: ${p.precio}`);
        console.log(`   URL: ${p.url}`);
        console.log(`   Stock: ${p.stock}`);
        console.log('');
      });
    }
    
    console.log('\n📦 PRODUCTOS COMPLETOS (de WooCommerce):\n');
    if (productosCompletos && productosCompletos.length > 0) {
      const p = productosCompletos[0];
      console.log('Campos disponibles:');
      console.log(`   - id: ${p.id}`);
      console.log(`   - name: ${p.name}`);
      console.log(`   - slug: ${p.slug}`);
      console.log(`   - permalink: ${p.permalink || 'NO EXISTE'}`);
      console.log(`   - price: ${p.price}`);
      console.log(`   - stock_status: ${p.stock_status}`);
      console.log('');
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔍 DIAGNÓSTICO:\n');
      
      if (!p.permalink) {
        console.log('❌ PROBLEMA: WooCommerce NO devuelve el campo "permalink"');
        console.log('   Solo devuelve "slug" (ruta relativa)');
        console.log('');
        console.log('✅ SOLUCIÓN:');
        console.log('   Construir URL completa usando baseUrl + slug');
        console.log(`   Ejemplo: https://www.veoveolibros.com.ar/producto/${p.slug}`);
      } else {
        console.log('✅ WooCommerce devuelve permalink correctamente');
        console.log(`   URL: ${p.permalink}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verificarURLProductos();
