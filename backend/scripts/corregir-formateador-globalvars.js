import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function corregirFormateador() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Buscar el flujo WooCommerce
    const flowId = new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }
    
    console.log(`\n📋 Flujo: ${flow.nombre}`);
    
    // Buscar el nodo gpt-formateador
    const nodeIndex = flow.nodes?.findIndex(n => n.id === 'gpt-formateador');
    
    if (nodeIndex === -1) {
      console.log('❌ Nodo gpt-formateador no encontrado');
      process.exit(1);
    }
    
    console.log('\n🔧 Corrigiendo globalVariablesOutput...');
    
    // Agregar globalVariablesOutput con las variables que extrae
    flow.nodes[nodeIndex].data.config.globalVariablesOutput = [
      'titulo',
      'autor',
      'editorial',
      'edicion',
      'variables_completas',
      'variables_faltantes'
    ];
    
    console.log('✅ globalVariablesOutput configurado:', flow.nodes[nodeIndex].data.config.globalVariablesOutput);
    
    // Guardar cambios
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

corregirFormateador();
