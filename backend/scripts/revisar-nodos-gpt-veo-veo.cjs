/**
 * Script para revisar la configuración de todos los nodos GPT del flujo Veo Veo
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revisarNodosGPT() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🤖 NODOS GPT DEL FLUJO VEO VEO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const gptNodes = flow.nodes.filter(n => n.type === 'gpt');
    
    console.log(`Total nodos GPT: ${gptNodes.length}\n`);
    
    gptNodes.forEach((node, index) => {
      console.log(`\n${index + 1}. 🤖 ${node.id.toUpperCase()}`);
      console.log('─'.repeat(60));
      console.log(`Label: ${node.data.label}`);
      console.log(`Subtitle: ${node.data.subtitle || 'N/A'}`);
      
      const config = node.data.config || {};
      
      console.log('\n📋 CONFIGURACIÓN:');
      console.log(`   systemPrompt: ${config.systemPrompt ? '✅ SÍ (' + config.systemPrompt.substring(0, 50) + '...)' : '❌ NO'}`);
      console.log(`   model: ${config.model || 'N/A'}`);
      console.log(`   temperature: ${config.temperature ?? 'N/A'}`);
      console.log(`   max_tokens: ${config.max_tokens || 'N/A'}`);
      console.log(`   topics: ${config.topics ? '✅ SÍ (' + config.topics.length + ' tópicos)' : '❌ NO'}`);
      
      if (config.topics && config.topics.length > 0) {
        console.log('      Topics:');
        config.topics.forEach(t => console.log(`         - ${t}`));
      }
      
      console.log(`   variables_a_extraer: ${config.variables_a_extraer ? '✅ SÍ (' + config.variables_a_extraer.length + ' vars)' : '❌ NO'}`);
      
      if (config.variables_a_extraer && config.variables_a_extraer.length > 0) {
        console.log('      Variables:');
        config.variables_a_extraer.forEach(v => console.log(`         - ${v.nombre} (${v.tipo})`));
      }
      
      console.log(`   response_format: ${config.response_format || 'N/A'}`);
      console.log(`   json_schema: ${config.json_schema ? '✅ SÍ' : '❌ NO'}`);
      
      console.log('\n📊 OTROS DATOS:');
      console.log(`   hasConnection: ${node.data.hasConnection}`);
      console.log(`   executionCount: ${node.data.executionCount || 0}`);
      
      console.log('─'.repeat(60));
    });
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
revisarNodosGPT()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
