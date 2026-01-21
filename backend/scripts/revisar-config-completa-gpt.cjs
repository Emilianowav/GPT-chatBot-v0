/**
 * Script para revisar la configuración completa de cada nodo GPT
 * Enfocado en: systemPrompt, topics, variables, response_format
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revisarConfigCompleta() {
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
    console.log('🤖 CONFIGURACIÓN COMPLETA DE NODOS GPT');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const gptNodes = flow.nodes.filter(n => n.type === 'gpt');
    
    gptNodes.forEach((node, index) => {
      console.log(`\n${index + 1}. 🤖 ${node.id.toUpperCase()}`);
      console.log('─'.repeat(60));
      console.log(`Label: ${node.data.label}`);
      console.log(`Subtitle: ${node.data.subtitle || 'N/A'}`);
      
      const config = node.data.config || {};
      
      console.log('\n📝 SYSTEM PROMPT:');
      if (config.systemPrompt) {
        console.log(config.systemPrompt.substring(0, 200) + '...');
      } else {
        console.log('   ❌ NO CONFIGURADO');
      }
      
      console.log('\n📚 TÓPICOS:');
      if (config.topics && config.topics.length > 0) {
        console.log(`   ✅ ${config.topics.length} tópicos configurados:`);
        config.topics.forEach(t => console.log(`      - ${t}`));
      } else {
        console.log('   ⚠️  Sin tópicos');
      }
      
      console.log('\n🔧 VARIABLES A EXTRAER:');
      if (config.variables_a_extraer && config.variables_a_extraer.length > 0) {
        console.log(`   ✅ ${config.variables_a_extraer.length} variables:`);
        config.variables_a_extraer.forEach(v => {
          console.log(`      - ${v.nombre} (${v.tipo}) ${v.requerido ? '[REQUERIDA]' : ''}`);
        });
      } else {
        console.log('   ⚠️  Sin variables a extraer');
      }
      
      console.log('\n📤 FORMATO DE RESPUESTA:');
      console.log(`   response_format: ${config.response_format || 'text (default)'}`);
      if (config.json_schema) {
        console.log('   json_schema: ✅ Configurado');
      }
      
      console.log('\n⚙️  PARÁMETROS:');
      console.log(`   model: ${config.model || 'gpt-3.5-turbo (default)'}`);
      console.log(`   temperature: ${config.temperature ?? '0.7 (default)'}`);
      console.log(`   max_tokens: ${config.max_tokens || 'auto'}`);
      
      console.log('─'.repeat(60));
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const conSystemPrompt = gptNodes.filter(n => n.data.config?.systemPrompt).length;
    const conTopicos = gptNodes.filter(n => n.data.config?.topics?.length > 0).length;
    const conVariables = gptNodes.filter(n => n.data.config?.variables_a_extraer?.length > 0).length;
    
    console.log(`✅ Nodos con systemPrompt: ${conSystemPrompt}/${gptNodes.length}`);
    console.log(`📚 Nodos con tópicos: ${conTopicos}/${gptNodes.length}`);
    console.log(`🔧 Nodos con variables: ${conVariables}/${gptNodes.length}`);
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
revisarConfigCompleta()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
