require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const TELEFONO = '5493794946066';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function testSoloTitulo() {
  try {
    // Conectar Mongoose
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 TEST: MENSAJE CON SOLO TÍTULO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📱 Mensaje: "Busco harry potter"\n');
    console.log('Esperado:');
    console.log('   1. Formateador extrae: titulo="Harry Potter"');
    console.log('   2. Formateador marca: editorial y edicion como OPCIONALES (no faltantes)');
    console.log('   3. Router evalúa: variables_faltantes = [] → not_empty = FALSE');
    console.log('   4. Router evalúa: variables_completas = true → equals true = TRUE');
    console.log('   5. Router va a: WooCommerce ✅\n');
    
    // Importar FlowExecutor
    const { FlowExecutor } = require('../dist/services/FlowExecutor.js');
    
    // Limpiar estado
    const ConversationState = mongoose.model('ConversationState', new mongoose.Schema({}, { strict: false }), 'conversation_states');
    await ConversationState.deleteMany({ phone: TELEFONO });
    console.log('✅ Estado limpiado\n');
    
    console.log('🚀 Ejecutando flujo...\n');
    console.log('═'.repeat(70) + '\n');
    
    const executor = new FlowExecutor();
    
    const startTime = Date.now();
    await executor.execute(
      FLOW_ID,
      {
        message: 'Busco harry potter',
        from: TELEFONO,
        timestamp: Date.now()
      },
      null
    );
    const endTime = Date.now();
    
    console.log('\n' + '═'.repeat(70));
    console.log(`✅ Flujo completado en ${(endTime - startTime) / 1000}s`);
    console.log('═'.repeat(70) + '\n');
    
    // Analizar variables globales
    const globalVars = executor.getAllGlobalVariables();
    
    console.log('📊 ANÁLISIS DE RESULTADOS:\n');
    
    // 1. ¿Se extrajo el título?
    const titulo = globalVars['titulo'];
    console.log(`1. Título extraído: ${titulo ? '✅' : '❌'} "${titulo}"`);
    
    // 2. ¿Hay variables_completas?
    const variablesCompletas = globalVars['gpt-formateador.variables_completas'];
    console.log(`2. variables_completas: ${variablesCompletas ? '✅' : '❌'} ${variablesCompletas}`);
    
    // 3. ¿Hay variables_faltantes?
    const variablesFaltantes = globalVars['gpt-formateador.variables_faltantes'];
    console.log(`3. variables_faltantes: ${Array.isArray(variablesFaltantes) && variablesFaltantes.length === 0 ? '✅' : '❌'} ${JSON.stringify(variablesFaltantes)}`);
    
    // 4. ¿Se ejecutó WooCommerce?
    const productos = globalVars['woocommerce.productos'];
    console.log(`4. WooCommerce ejecutado: ${productos ? '✅' : '❌'} ${productos ? `${productos.length} productos` : 'NO'}`);
    
    // 5. ¿Se generó respuesta GPT?
    const respuestaGPT = globalVars['gpt-asistente-ventas.respuesta_gpt'];
    console.log(`5. GPT Asistente ejecutado: ${respuestaGPT ? '✅' : '❌'} ${respuestaGPT ? 'SÍ' : 'NO'}`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 DIAGNÓSTICO\n');
    
    if (productos && productos.length > 0) {
      console.log('✅ ¡ÉXITO! El flujo llegó a WooCommerce y obtuvo productos.\n');
      console.log(`📦 Productos encontrados: ${productos.length}`);
      productos.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} - $${p.price}`);
      });
      
      if (respuestaGPT) {
        console.log('\n💬 Respuesta GPT (primeros 300 chars):');
        console.log(`   ${respuestaGPT.substring(0, 300)}...`);
      }
      
    } else if (variablesFaltantes && variablesFaltantes.length > 0) {
      console.log('❌ PROBLEMA: El router fue a pedir-datos en lugar de WooCommerce\n');
      console.log('Causa: variables_faltantes contiene valores cuando debería estar vacío');
      console.log(`   variables_faltantes = ${JSON.stringify(variablesFaltantes)}`);
      console.log('\nEsto significa que el formateador está marcando variables OPCIONALES');
      console.log('como faltantes, cuando NO debería hacerlo.');
      
    } else {
      console.log('⚠️  El flujo se detuvo antes de llegar a WooCommerce\n');
      console.log('Variables globales disponibles:');
      Object.keys(globalVars).forEach(key => {
        console.log(`   - ${key}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testSoloTitulo();
