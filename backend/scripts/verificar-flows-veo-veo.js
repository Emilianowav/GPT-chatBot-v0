// Script para verificar flows de Veo Veo
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const EMPRESA_ID = '6940a9a181b92bfce970fdb5'; // Veo Veo

async function main() {
  try {
    console.log('🔍 Verificando flows de Veo Veo...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Buscar todos los flows de Veo Veo
    const flows = await flowsCollection.find({ empresaId: EMPRESA_ID }).toArray();
    
    console.log(`\n📦 Total de flows encontrados: ${flows.length}\n`);
    
    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   Edges: ${flow.edges?.length || 0}`);
      console.log(`   Activo: ${flow.activo}`);
      console.log('');
    });
    
    // Verificar el flow específico que intentamos cargar
    const targetFlowId = '695b5802cf46dd410a91f37c';
    console.log(`\n🎯 Buscando flow específico: ${targetFlowId}`);
    
    const targetFlow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(targetFlowId) });
    
    if (targetFlow) {
      console.log('✅ Flow encontrado:');
      console.log(`   Nombre: ${targetFlow.nombre}`);
      console.log(`   Nodos: ${targetFlow.nodes?.length || 0}`);
      console.log(`   Edges: ${targetFlow.edges?.length || 0}`);
    } else {
      console.log('❌ Flow NO encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

main();
