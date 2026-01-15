require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const TELEFONO = '5493794946066';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function testFormateadorInteligente() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const { FlowExecutor } = require('../dist/services/FlowExecutor.js');
    const ConversationState = mongoose.model('ConversationState', new mongoose.Schema({}, { strict: false }), 'conversation_states');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 TEST: FORMATEADOR INTELIGENTE CON CONTEXTO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const testCases = [
      {
        mensaje: 'Harry Potter 5',
        esperado: 'Harry Potter y la Orden del Fénix'
      },
      {
        mensaje: 'HP 3',
        esperado: 'Harry Potter y el Prisionero de Azkaban'
      },
      {
        mensaje: 'El quinto de Harry Potter',
        esperado: 'Harry Potter y la Orden del Fénix'
      },
      {
        mensaje: 'Busco el primer libro de Harry Potter',
        esperado: 'Harry Potter y la Piedra Filosofal'
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`📝 TEST ${i + 1}: "${testCase.mensaje}"`);
      console.log(`📋 Esperado: "${testCase.esperado}"`);
      console.log('─'.repeat(70));
      
      // Limpiar estado
      await ConversationState.deleteMany({ phone: TELEFONO });
      
      const executor = new FlowExecutor();
      
      await executor.execute(
        FLOW_ID,
        {
          message: testCase.mensaje,
          from: TELEFONO,
          timestamp: Date.now()
        },
        null
      );
      
      const globalVars = executor.getAllGlobalVariables();
      const tituloExtraido = globalVars['titulo'];
      
      console.log(`\n📊 RESULTADO:`);
      console.log(`   Título extraído: "${tituloExtraido}"`);
      
      if (tituloExtraido === testCase.esperado) {
        console.log(`   ✅ CORRECTO - Coincide exactamente`);
      } else if (tituloExtraido && tituloExtraido.toLowerCase().includes('harry potter')) {
        console.log(`   ⚠️  PARCIAL - Extrajo Harry Potter pero no el título exacto`);
      } else if (tituloExtraido) {
        console.log(`   ❌ INCORRECTO - Extrajo: "${tituloExtraido}"`);
      } else {
        console.log(`   ❌ ERROR - No extrajo ningún título`);
      }
      
      // Esperar un poco entre tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ TESTS COMPLETADOS');
    console.log('═'.repeat(70));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testFormateadorInteligente();
