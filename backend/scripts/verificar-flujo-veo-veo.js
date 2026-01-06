import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf39';

async function verificarFlujoVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    const flujo = await db.collection('flows').findOne({ 
      _id: new mongoose.Types.ObjectId(FLOW_ID)
    });

    if (!flujo) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('📋 FLUJO VEO VEO - ESTRUCTURA COMPLETA\n');
    console.log('ID:', flujo._id);
    console.log('Nombre:', flujo.nombre);
    console.log('Empresa ID:', flujo.empresaId);
    console.log('Bot Type:', flujo.botType);
    console.log('Activo:', flujo.activo);
    console.log('\n📊 NODOS:', flujo.nodes.length);
    
    flujo.nodes.forEach((node, i) => {
      console.log(`\n--- NODO ${i + 1} ---`);
      console.log('ID:', node.id);
      console.log('Type:', node.type);
      console.log('Label:', node.data?.label);
      console.log('Position:', JSON.stringify(node.position));
      
      if (node.data?.config) {
        console.log('\n📝 CONFIG:');
        console.log(JSON.stringify(node.data.config, null, 2));
      } else {
        console.log('⚠️  NO TIENE CONFIG');
      }
    });

    console.log('\n\n🔗 EDGES:', flujo.edges.length);
    flujo.edges.forEach((edge, i) => {
      console.log(`\nEdge ${i + 1}:`);
      console.log('  Source:', edge.source);
      console.log('  Target:', edge.target);
      console.log('  RouteId:', edge.data?.routeId || 'N/A');
    });

    // Verificar específicamente el nodo GPT Conversacional
    const gptNode = flujo.nodes.find(n => n.id === 'gpt-conversacional');
    if (gptNode) {
      console.log('\n\n🤖 NODO GPT CONVERSACIONAL - DETALLE COMPLETO:');
      console.log(JSON.stringify(gptNode, null, 2));
    }

    // Verificar el nodo Router
    const routerNode = flujo.nodes.find(n => n.id === 'router-decision');
    if (routerNode) {
      console.log('\n\n🔀 NODO ROUTER - DETALLE COMPLETO:');
      console.log(JSON.stringify(routerNode, null, 2));
    }

    // Verificar el nodo GPT Transform
    const transformNode = flujo.nodes.find(n => n.id === 'gpt-transform');
    if (transformNode) {
      console.log('\n\n🔄 NODO GPT TRANSFORM - DETALLE COMPLETO:');
      console.log(JSON.stringify(transformNode, null, 2));
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verificarFlujoVeoVeo();
