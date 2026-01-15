require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verFormateadorConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }
    
    // Buscar nodo formateador
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    if (!formateador) {
      console.error('❌ Nodo formateador no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('GPT FORMATEADOR - CONFIGURACIÓN COMPLETA');
    console.log('═'.repeat(80));
    
    const config = formateador.data.config;
    
    console.log('\n📋 TIPO:', config.tipo);
    console.log('📋 MODELO:', config.modelo);
    
    if (config.extractionConfig) {
      console.log('\n🔧 EXTRACTION CONFIG:');
      console.log('─'.repeat(80));
      console.log('Enabled:', config.extractionConfig.enabled);
      console.log('\nSystem Prompt:');
      console.log(config.extractionConfig.systemPrompt);
      console.log('\nVariables:');
      config.extractionConfig.variables.forEach((v, i) => {
        console.log(`\n${i+1}. ${v.name} (${v.type})`);
        console.log('   Descripción:', v.description);
        console.log('   Requerido:', v.required);
        console.log('   Default:', v.defaultValue);
      });
    } else {
      console.log('\n⚠️  NO TIENE extractionConfig');
    }
    
    console.log('\n═'.repeat(80));
    console.log('CONFIGURACIÓN COMPLETA (JSON):');
    console.log('═'.repeat(80));
    console.log(JSON.stringify(config, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verFormateadorConfig();
