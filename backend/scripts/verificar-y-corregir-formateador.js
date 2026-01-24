import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarYCorregirFormateador() {
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
    
    const nodeIndex = flow.nodes?.findIndex(n => n.id === 'gpt-formateador');
    
    if (nodeIndex === -1) {
      console.log('❌ Nodo gpt-formateador no encontrado');
      process.exit(1);
    }
    
    const node = flow.nodes[nodeIndex];
    
    console.log('\n📋 CONFIGURACIÓN ACTUAL:');
    console.log('extractionConfig existe:', !!node.data?.config?.extractionConfig);
    console.log('extractionConfig.enabled:', node.data?.config?.extractionConfig?.enabled);
    console.log('extractionConfig.contextSource:', node.data?.config?.extractionConfig?.contextSource);
    console.log('extractionConfig.method:', node.data?.config?.extractionConfig?.method);
    console.log('globalVariablesOutput:', node.data?.config?.globalVariablesOutput);
    
    // Verificar si extractionConfig existe y está bien configurado
    if (!node.data.config.extractionConfig) {
      console.log('\n❌ extractionConfig NO existe');
      process.exit(1);
    }
    
    // Corregir extractionConfig
    console.log('\n🔧 Corrigiendo extractionConfig...');
    
    // Asegurar que enabled = true
    node.data.config.extractionConfig.enabled = true;
    
    // Asegurar que contextSource sea historial_completo
    node.data.config.extractionConfig.contextSource = 'historial_completo';
    
    // Asegurar que variablesToExtract exista
    if (!node.data.config.extractionConfig.variablesToExtract) {
      node.data.config.extractionConfig.variablesToExtract = node.data.config.extractionConfig.variables || [];
    }
    
    console.log('✅ extractionConfig.enabled = true');
    console.log('✅ extractionConfig.contextSource = historial_completo');
    console.log('✅ variablesToExtract:', node.data.config.extractionConfig.variablesToExtract?.map(v => v.nombre).join(', '));
    
    // Guardar cambios
    flow.nodes[nodeIndex] = node;
    
    await flowsCollection.updateOne(
      { _id: flowId },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Cambios guardados en BD');
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarYCorregirFormateador();
