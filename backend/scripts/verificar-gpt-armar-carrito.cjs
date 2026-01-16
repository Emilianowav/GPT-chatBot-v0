/**
 * Script para Verificar GPT Armar Carrito
 * 
 * OBJETIVO:
 * Ver el systemPrompt y extractionConfig del nodo gpt-armar-carrito
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarGPTArmarCarrito() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═'.repeat(80));
    console.log('🔍 VERIFICANDO GPT ARMAR CARRITO');
    console.log('═'.repeat(80));
    
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    const nodo = flow.nodes.find(n => n.id === 'gpt-armar-carrito');
    
    if (!nodo) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }
    
    console.log('\n📋 CONFIGURACIÓN ACTUAL:');
    console.log(JSON.stringify(nodo.data.config, null, 2));
    
    console.log('\n' + '═'.repeat(80));
    console.log('📊 ANÁLISIS:');
    console.log('═'.repeat(80));
    
    const systemPrompt = nodo.data.config.extractionConfig?.systemPrompt || nodo.data.config.systemPrompt;
    
    console.log('\n📝 SYSTEM PROMPT:');
    console.log(systemPrompt);
    
    console.log('\n🔍 VARIABLES USADAS:');
    const variables = systemPrompt.match(/\{\{[^}]+\}\}/g) || [];
    variables.forEach(v => console.log(`   - ${v}`));
    
    console.log('\n💡 PROBLEMA DETECTADO:');
    if (!systemPrompt.includes('{{historial_conversacion}}')) {
      console.log('   ❌ No usa {{historial_conversacion}}');
    }
    if (!systemPrompt.includes('productos_presentados')) {
      console.log('   ❌ No tiene acceso a productos presentados en el historial');
    }
    
    console.log('\n💡 SOLUCIÓN:');
    console.log('   El systemPrompt debe:');
    console.log('   1. Usar {{historial_conversacion}} para ver toda la conversación');
    console.log('   2. Extraer productos mencionados del historial');
    console.log('   3. Permitir agregar múltiples productos');
    console.log('   4. Mantener productos previos si el usuario agrega más');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarGPTArmarCarrito()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
