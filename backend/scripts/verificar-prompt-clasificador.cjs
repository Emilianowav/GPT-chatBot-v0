/**
 * Script para Verificar el SystemPrompt del Clasificador
 * 
 * Verifica si el systemPrompt tiene las instrucciones de formato JSON
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarPrompt() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    
    if (!clasificador) {
      console.log('❌ Clasificador no encontrado');
      return;
    }
    
    const systemPrompt = clasificador.data.config.extractionConfig.systemPrompt;
    
    console.log('📋 SYSTEM PROMPT ACTUAL:');
    console.log('═'.repeat(80));
    console.log(systemPrompt);
    console.log('═'.repeat(80));
    
    console.log('\n🔍 VERIFICACIÓN:');
    
    const tieneInstruccionJSON = systemPrompt.includes('FORMATO DE RESPUESTA') || 
                                  systemPrompt.includes('Devuelve SOLO un objeto JSON');
    
    const tieneEstructuraJSON = systemPrompt.includes('{"tipo_accion"') || 
                                 systemPrompt.includes('"tipo_accion":');
    
    console.log(`   ✅ Tiene instrucción de formato JSON: ${tieneInstruccionJSON ? 'SÍ' : 'NO'}`);
    console.log(`   ✅ Tiene estructura JSON definida: ${tieneEstructuraJSON ? 'SÍ' : 'NO'}`);
    
    if (tieneInstruccionJSON && tieneEstructuraJSON) {
      console.log('\n✅ El systemPrompt está CORRECTO');
      console.log('   Tiene las instrucciones de formato JSON');
    } else {
      console.log('\n❌ El systemPrompt NO tiene las instrucciones JSON');
      console.log('   Necesita ejecutar: node scripts/fix-clasificador-json-format.cjs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarPrompt()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
