import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verPromptGptCarrito() {
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
    
    const gptCarritoNode = flow.nodes.find(n => n.id === 'gpt-carrito');
    
    if (!gptCarritoNode) {
      console.log('❌ Nodo gpt-carrito no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📋 CONFIGURACIÓN COMPLETA DE gpt-carrito:\n');
    console.log('Tipo:', gptCarritoNode.data.subtitle);
    console.log('Model:', gptCarritoNode.data.config.model);
    console.log('\n📝 SystemPrompt COMPLETO:\n');
    console.log(gptCarritoNode.data.config.systemPrompt);
    console.log('\n\n📊 ExtractionConfig:');
    console.log(JSON.stringify(gptCarritoNode.data.config.extractionConfig, null, 2));
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verPromptGptCarrito();
