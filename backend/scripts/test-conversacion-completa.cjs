require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const TELEFONO = '5493794946066';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function testConversacionCompleta() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const { FlowExecutor } = require('../dist/services/FlowExecutor.js');
    const ConversationState = mongoose.model('ConversationState', new mongoose.Schema({}, { strict: false }), 'conversation_states');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 TEST: CONVERSACIÓN COMPLETA Y NATURAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Limpiar estado
    await ConversationState.deleteMany({ phone: TELEFONO });
    console.log('✅ Estado limpiado\n');
    
    const mensajes = [
      {
        texto: 'Hola',
        esperado: 'Saludo amigable, pregunta en qué puede ayudar'
      },
      {
        texto: 'Busco harry potter 5 puede ser ?',
        esperado: 'Encuentra productos de Harry Potter y los muestra'
      }
    ];
    
    for (let i = 0; i < mensajes.length; i++) {
      const msg = mensajes[i];
      
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`📨 MENSAJE ${i + 1}: "${msg.texto}"`);
      console.log(`📋 Esperado: ${msg.esperado}`);
      console.log('═'.repeat(70) + '\n');
      
      const executor = new FlowExecutor();
      
      await executor.execute(
        FLOW_ID,
        {
          message: msg.texto,
          from: TELEFONO,
          timestamp: Date.now()
        },
        null
      );
      
      const globalVars = executor.getAllGlobalVariables();
      
      console.log('\n📊 RESULTADO:\n');
      
      // Analizar qué pasó
      if (i === 0) {
        // Primer mensaje: "Hola"
        const variablesFaltantes = globalVars['gpt-formateador.variables_faltantes'];
        const titulo = globalVars['titulo'];
        
        console.log(`1. Título extraído: ${titulo ? `❌ "${titulo}" (NO debería extraer)` : '✅ null (correcto)'}`);
        console.log(`2. Variables faltantes: ${JSON.stringify(variablesFaltantes)}`);
        
        if (!titulo && (!variablesFaltantes || variablesFaltantes.length === 0)) {
          console.log('\n✅ CORRECTO: No extrae título de un saludo simple');
        } else if (variablesFaltantes && variablesFaltantes.includes('titulo')) {
          console.log('\n❌ ERROR: Marca título como faltante en un saludo');
          console.log('   El formateador debería devolver todo null cuando el usuario solo saluda');
        }
        
      } else if (i === 1) {
        // Segundo mensaje: "Busco harry potter 5"
        const titulo = globalVars['titulo'];
        const productos = globalVars['woocommerce.productos'];
        const respuestaGPT = globalVars['gpt-asistente-ventas.respuesta_gpt'];
        
        console.log(`1. Título extraído: ${titulo ? `✅ "${titulo}"` : '❌ null'}`);
        console.log(`2. WooCommerce ejecutado: ${productos ? `✅ ${productos.length} productos` : '❌ NO'}`);
        console.log(`3. GPT Asistente ejecutado: ${respuestaGPT ? '✅ SÍ' : '❌ NO'}`);
        
        if (productos && productos.length > 0) {
          console.log('\n✅ ÉXITO: Encontró productos de Harry Potter');
          console.log(`\n📦 Productos (${productos.length}):`);
          productos.slice(0, 3).forEach((p, idx) => {
            console.log(`   ${idx + 1}. ${p.titulo} - $${p.precio}`);
          });
          
          if (respuestaGPT) {
            console.log('\n💬 Respuesta del bot (primeros 200 chars):');
            console.log(`   ${respuestaGPT.substring(0, 200)}...`);
          }
        } else {
          console.log('\n❌ ERROR: No encontró productos');
          console.log('   Posibles causas:');
          console.log('   - Búsqueda no normalizada (busca "Harry Potter 5" literal)');
          console.log('   - Router no fue a WooCommerce');
        }
      }
      
      // Esperar un poco entre mensajes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ TEST COMPLETADO');
    console.log('═'.repeat(70));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testConversacionCompleta();
