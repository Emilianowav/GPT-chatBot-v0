require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const TELEFONO = '5493794946066';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function testSoloSaludo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const { FlowExecutor } = require('../dist/services/FlowExecutor.js');
    const ConversationState = mongoose.model('ConversationState', new mongoose.Schema({}, { strict: false }), 'conversation_states');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 TEST: SALUDO SIMPLE (sin mencionar libros)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Limpiar estado
    await ConversationState.deleteMany({ phone: TELEFONO });
    console.log('✅ Estado limpiado\n');
    
    console.log('📨 Mensaje: "Hola"\n');
    console.log('Esperado:');
    console.log('   1. Formateador extrae: titulo=null, editorial=null, edicion=null');
    console.log('   2. Formateador marca: variables_faltantes=[] (vacío)');
    console.log('   3. Router NO va a pedir-datos (porque no faltan variables)');
    console.log('   4. Bot responde: Saludo amigable sin pedir datos\n');
    
    const executor = new FlowExecutor();
    
    await executor.execute(
      FLOW_ID,
      {
        message: 'Hola',
        from: TELEFONO,
        timestamp: Date.now()
      },
      null
    );
    
    const globalVars = executor.getAllGlobalVariables();
    
    console.log('\n📊 ANÁLISIS:\n');
    
    const titulo = globalVars['titulo'];
    const variablesCompletas = globalVars['gpt-formateador.variables_completas'];
    const variablesFaltantes = globalVars['gpt-formateador.variables_faltantes'];
    
    console.log(`1. Título extraído: ${titulo === undefined || titulo === null ? '✅ null (correcto)' : `❌ "${titulo}" (incorrecto)`}`);
    console.log(`2. variables_completas: ${variablesCompletas}`);
    console.log(`3. variables_faltantes: ${JSON.stringify(variablesFaltantes)}`);
    
    if (variablesFaltantes && variablesFaltantes.length > 0) {
      console.log('\n❌ PROBLEMA DETECTADO:');
      console.log(`   El formateador marca ${variablesFaltantes.length} variable(s) como faltante(s)`);
      console.log(`   Variables: ${JSON.stringify(variablesFaltantes)}`);
      console.log('\n   CAUSA:');
      console.log('   El prompt del formateador está marcando "titulo" como REQUERIDO');
      console.log('   incluso cuando el usuario NO menciona ningún libro.');
      console.log('\n   SOLUCIÓN:');
      console.log('   El formateador debe entender que si el usuario solo saluda,');
      console.log('   NO debe marcar ninguna variable como faltante.');
      console.log('   Debe devolver: {"titulo": null, "editorial": null, "edicion": null}');
      console.log('   Y el backend debe marcar: variables_faltantes = []');
    } else {
      console.log('\n✅ CORRECTO: No marca variables como faltantes en un saludo');
    }
    
    // Verificar qué nodos se ejecutaron
    const contexto = executor.getAllGlobalVariables();
    const pedirDatos = contexto['gpt-pedir-datos.respuesta_gpt'];
    const asistente = contexto['gpt-asistente-ventas.respuesta_gpt'];
    
    console.log('\n📋 FLUJO EJECUTADO:');
    console.log(`   - GPT Pedir Datos: ${pedirDatos ? '✅ Ejecutado' : '⚪ No ejecutado'}`);
    console.log(`   - GPT Asistente: ${asistente ? '✅ Ejecutado' : '⚪ No ejecutado'}`);
    
    if (pedirDatos) {
      console.log(`\n💬 Respuesta del bot:`);
      console.log(`   "${pedirDatos}"`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testSoloSaludo();
