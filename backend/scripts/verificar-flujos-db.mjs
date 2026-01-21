import mongoose from 'mongoose';

async function verificarFlujos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/neural_chatbot');
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const allFlows = await flowsCollection.find({}).toArray();
    
    console.log(`📋 Total de flujos en BD: ${allFlows.length}\n`);
    
    allFlows.forEach((flow, i) => {
      console.log(`${i + 1}. ${flow.nombre}`);
      console.log(`   _id: ${flow._id}`);
      console.log(`   empresaId: ${flow.empresaId}`);
      console.log(`   botType: ${flow.botType || 'NO DEFINIDO'}`);
      console.log(`   activo: ${flow.activo ? '🟢' : '⏸️'}`);
      console.log(`   nodes: ${flow.nodes?.length || 0}`);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verificarFlujos();
