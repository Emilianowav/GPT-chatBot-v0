import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarConfigGPTCarrito() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flowId = new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }
    
    const node = flow.nodes?.find(n => n.id === 'gpt-carrito');
    
    if (!node) {
      console.log('❌ Nodo gpt-carrito no encontrado');
      process.exit(1);
    }
    
    console.log('\n📋 CONFIGURACIÓN ACTUAL DE gpt-carrito:');
    console.log('Tipo:', node.data?.config?.tipo);
    console.log('Model:', node.data?.config?.model);
    console.log('SystemPrompt:', node.data?.config?.systemPrompt?.substring(0, 200));
    console.log('\nextractionConfig existe:', !!node.data?.config?.extractionConfig);
    console.log('extractionConfig.enabled:', node.data?.config?.extractionConfig?.enabled);
    console.log('extractionConfig.contextSource:', node.data?.config?.extractionConfig?.contextSource);
    console.log('extractionConfig.variablesToExtract:', node.data?.config?.extractionConfig?.variablesToExtract?.map(v => v.nombre).join(', '));
    console.log('\nglobalVariablesOutput:', node.data?.config?.globalVariablesOutput);
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarConfigGPTCarrito();
