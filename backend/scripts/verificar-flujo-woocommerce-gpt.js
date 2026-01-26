import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarFlujoWoocommerceGPT() {
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
    
    console.log('\n🔍 VERIFICANDO FLUJO: WooCommerce → GPT Asistente\n');
    console.log('═'.repeat(80));
    
    // Buscar edge desde WooCommerce
    const edgesFromWoo = flow.edges.filter(e => e.source === 'woocommerce');
    
    console.log('\n📍 EDGES DESDE woocommerce:');
    if (edgesFromWoo.length === 0) {
      console.log('   ❌ NO HAY EDGES desde woocommerce');
      console.log('   🚨 PROBLEMA CRÍTICO: WooCommerce no conecta con nada');
    } else {
      edgesFromWoo.forEach((edge, i) => {
        console.log(`\n   ${i + 1}. Edge: ${edge.id}`);
        console.log(`      Hacia: ${edge.target}`);
        console.log(`      Label: ${edge.label || 'Sin label'}`);
        
        const targetNode = flow.nodes.find(n => n.id === edge.target);
        if (targetNode) {
          console.log(`      Nodo destino: ${targetNode.data.label} (${targetNode.type})`);
          
          if (edge.target === 'gpt-asistente-ventas') {
            console.log('      ✅ Conecta DIRECTAMENTE con gpt-asistente-ventas');
          }
        }
      });
    }
    
    // Buscar edges hacia gpt-asistente-ventas
    const edgesToGPT = flow.edges.filter(e => e.target === 'gpt-asistente-ventas');
    
    console.log('\n\n📍 EDGES HACIA gpt-asistente-ventas:');
    if (edgesToGPT.length === 0) {
      console.log('   ❌ NO HAY EDGES hacia gpt-asistente-ventas');
      console.log('   🚨 PROBLEMA CRÍTICO: GPT Asistente no recibe datos de ningún nodo');
    } else {
      edgesToGPT.forEach((edge, i) => {
        console.log(`\n   ${i + 1}. Edge: ${edge.id}`);
        console.log(`      Desde: ${edge.source}`);
        console.log(`      Label: ${edge.label || 'Sin label'}`);
        
        const sourceNode = flow.nodes.find(n => n.id === edge.source);
        if (sourceNode) {
          console.log(`      Nodo origen: ${sourceNode.data.label} (${sourceNode.type})`);
          
          if (edge.source === 'woocommerce') {
            console.log('      ✅ Recibe datos DIRECTAMENTE de WooCommerce');
          } else {
            console.log(`      ⚠️  NO recibe datos de WooCommerce (viene de ${edge.source})`);
          }
        }
      });
    }
    
    console.log('\n\n📊 ANÁLISIS DEL PROBLEMA:\n');
    
    const conectaDirecto = edgesFromWoo.some(e => e.target === 'gpt-asistente-ventas');
    
    if (!conectaDirecto) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   WooCommerce NO conecta directamente con gpt-asistente-ventas');
      console.log('');
      console.log('📋 FLUJO ACTUAL:');
      console.log('   woocommerce → ??? → gpt-asistente-ventas');
      console.log('');
      console.log('🔧 SOLUCIÓN NECESARIA:');
      console.log('   Agregar edge directo: woocommerce → gpt-asistente-ventas');
      console.log('   O verificar que el nodo intermedio pase productos_formateados');
    } else {
      console.log('✅ WooCommerce SÍ conecta con gpt-asistente-ventas');
      console.log('   El problema debe estar en otro lado');
    }
    
    console.log('\n' + '═'.repeat(80));
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarFlujoWoocommerceGPT();
