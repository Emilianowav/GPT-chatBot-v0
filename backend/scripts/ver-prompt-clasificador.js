import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verPromptClasificador() {
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
    
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    
    if (!clasificador) {
      console.log('❌ Nodo gpt-clasificador-inteligente no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📋 CONFIGURACIÓN DE gpt-clasificador-inteligente:\n');
    console.log('═'.repeat(80));
    console.log('\n📝 SYSTEM PROMPT COMPLETO:\n');
    console.log(clasificador.data.config.systemPrompt);
    console.log('\n' + '═'.repeat(80));
    
    if (clasificador.data.config.extractionConfig) {
      console.log('\n📊 EXTRACTION CONFIG:\n');
      console.log(JSON.stringify(clasificador.data.config.extractionConfig, null, 2));
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verPromptClasificador();
