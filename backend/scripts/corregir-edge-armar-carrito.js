import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function corregirEdge() {
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
    
    // Buscar el edge problemático
    const edgeIndex = flow.edges?.findIndex(e => e.id === 'edge-router-finalizar-compra');
    
    if (edgeIndex === -1) {
      console.log('❌ Edge no encontrado');
      process.exit(1);
    }
    
    console.log('\n🔍 Edge ANTES de la corrección:');
    console.log(`   ID: ${flow.edges[edgeIndex].id}`);
    console.log(`   Source: ${flow.edges[edgeIndex].source}`);
    console.log(`   Target: ${flow.edges[edgeIndex].target}`);
    
    // Corregir el target
    flow.edges[edgeIndex].target = 'gpt-carrito';
    
    console.log('\n✅ Edge DESPUÉS de la corrección:');
    console.log(`   ID: ${flow.edges[edgeIndex].id}`);
    console.log(`   Source: ${flow.edges[edgeIndex].source}`);
    console.log(`   Target: ${flow.edges[edgeIndex].target}`);
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: flowId },
      { $set: { edges: flow.edges } }
    );
    
    console.log('\n✅ Edge corregido y guardado en BD');
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirEdge();
