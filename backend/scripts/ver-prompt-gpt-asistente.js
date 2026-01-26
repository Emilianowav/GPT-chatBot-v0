import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verPromptGptAsistente() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    const gptAsistente = flow.nodes.find(n => n.id === 'gpt-asistente-ventas');
    
    if (!gptAsistente) {
      console.log('❌ Nodo gpt-asistente-ventas no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📋 CONFIGURACIÓN DE gpt-asistente-ventas:\n');
    console.log('═'.repeat(80));
    console.log('\n📝 SYSTEM PROMPT COMPLETO:\n');
    console.log(gptAsistente.data.config.systemPrompt);
    console.log('\n' + '═'.repeat(80));
    
    if (gptAsistente.data.config.extractionConfig) {
      console.log('\n📊 EXTRACTION CONFIG:\n');
      console.log(JSON.stringify(gptAsistente.data.config.extractionConfig, null, 2));
    }
    
    if (gptAsistente.data.config.globalVariablesOutput) {
      console.log('\n💾 GLOBAL VARIABLES OUTPUT:\n');
      console.log(JSON.stringify(gptAsistente.data.config.globalVariablesOutput, null, 2));
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verPromptGptAsistente();
