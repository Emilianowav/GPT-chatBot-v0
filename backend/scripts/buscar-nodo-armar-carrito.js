import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function buscarNodoArmarCarrito() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Buscar el flujo WooCommerce
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }
    
    console.log(`\n📋 Flujo: ${flow.nombre}`);
    console.log(`   Total nodos: ${flow.nodes?.length || 0}`);
    console.log(`   Total edges: ${flow.edges?.length || 0}`);
    
    // Buscar todos los nodos GPT
    console.log('\n🔍 NODOS GPT EN EL FLUJO:\n');
    const nodosGPT = flow.nodes?.filter(n => n.type === 'gpt') || [];
    nodosGPT.forEach((node, i) => {
      console.log(`${i + 1}. ${node.data?.label || 'Sin label'}`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Tipo: ${node.data?.config?.tipo || 'No especificado'}`);
      console.log('');
    });
    
    // Buscar edge que apunta a gpt-armar-carrito
    console.log('\n🔍 EDGES QUE APUNTAN A "gpt-armar-carrito":\n');
    const edgesArmarCarrito = flow.edges?.filter(e => e.target === 'gpt-armar-carrito') || [];
    if (edgesArmarCarrito.length > 0) {
      edgesArmarCarrito.forEach(edge => {
        console.log(`   Edge: ${edge.id}`);
        console.log(`   Source: ${edge.source}`);
        console.log(`   Target: ${edge.target}`);
        console.log(`   Condición: ${edge.data?.condition || 'Sin condición'}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No hay edges que apunten a gpt-armar-carrito');
    }
    
    // Buscar nodo con label "GPT Armar Carrito" o similar
    console.log('\n🔍 BUSCANDO NODO CON LABEL SIMILAR A "ARMAR CARRITO":\n');
    const nodosArmarCarrito = flow.nodes?.filter(n => 
      n.data?.label?.toLowerCase().includes('armar') || 
      n.data?.label?.toLowerCase().includes('carrito')
    ) || [];
    
    if (nodosArmarCarrito.length > 0) {
      nodosArmarCarrito.forEach(node => {
        console.log(`   ✅ Encontrado: ${node.data?.label}`);
        console.log(`      ID: ${node.id}`);
        console.log(`      Tipo: ${node.type}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No se encontró ningún nodo con label similar');
    }
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

buscarNodoArmarCarrito();
