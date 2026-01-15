require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verExtractionConfig() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');

    if (!formateador) {
      console.log('❌ Formateador no encontrado');
      return;
    }

    console.log('📊 CONFIGURACIÓN ACTUAL DEL FORMATEADOR');
    console.log('═══════════════════════════════════════\n');

    console.log('🔧 extractionConfig:');
    console.log(JSON.stringify(formateador.data.config.extractionConfig, null, 2));
    console.log('\n');

    console.log('📝 systemPrompt actual:');
    console.log('─────────────────────────────────────');
    console.log(formateador.data.config.systemPrompt);
    console.log('\n');

    console.log('📋 ANÁLISIS:');
    console.log('─────────────────────────────────────');
    console.log(`   enabled: ${formateador.data.config.extractionConfig?.enabled}`);
    console.log(`   schema definido: ${formateador.data.config.extractionConfig?.schema ? 'SÍ' : 'NO'}`);
    
    if (formateador.data.config.extractionConfig?.schema) {
      console.log('\n   Variables en schema:');
      Object.entries(formateador.data.config.extractionConfig.schema).forEach(([key, value]) => {
        console.log(`      - ${key}: ${JSON.stringify(value)}`);
      });
    }

    console.log('\n💡 IMPORTANTE:');
    console.log('─────────────────────────────────────');
    console.log('   El extractionConfig viene del FRONTEND');
    console.log('   El systemPrompt debe RESPETAR el schema definido');
    console.log('   Solo debemos actualizar el systemPrompt, NO el schema');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

verExtractionConfig();
