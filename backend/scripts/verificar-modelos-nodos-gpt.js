import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarModelosNodosGPT() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ WooCommerce Flow no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('🔍 VERIFICAR MODELOS DE NODOS GPT');
    console.log('═'.repeat(80));
    console.log(`\nFlujo: ${wooFlow.nombre}\n`);
    
    const nodosGPT = wooFlow.nodes.filter(n => n.type === 'gpt');
    
    console.log(`Total nodos GPT: ${nodosGPT.length}\n`);
    
    nodosGPT.forEach((nodo, index) => {
      const label = nodo.data?.label || nodo.id;
      const config = nodo.data?.config || {};
      const modelo = config.modelo || 'NO CONFIGURADO';
      
      console.log(`${index + 1}. ${label}`);
      console.log(`   ID: ${nodo.id}`);
      console.log(`   Modelo: ${modelo}`);
      console.log(`   Tipo: ${config.tipo || 'NO CONFIGURADO'}`);
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log('🔧 CAMBIAR TODOS A gpt-3.5-turbo');
    console.log('═'.repeat(80));
    
    let cambios = 0;
    
    nodosGPT.forEach(nodo => {
      if (!nodo.data.config) {
        nodo.data.config = {};
      }
      
      const modeloAnterior = nodo.data.config.modelo;
      nodo.data.config.modelo = 'gpt-3.5-turbo';
      
      if (modeloAnterior !== 'gpt-3.5-turbo') {
        console.log(`✓ ${nodo.data.label}: ${modeloAnterior || 'NO CONFIGURADO'} → gpt-3.5-turbo`);
        cambios++;
      }
    });
    
    if (cambios > 0) {
      console.log(`\n💾 Guardando ${cambios} cambios...`);
      
      const result = await flowsCollection.updateOne(
        { _id: wooFlowId },
        { 
          $set: { 
            nodes: wooFlow.nodes,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('✅ Cambios guardados');
      console.log(`   Modified count: ${result.modifiedCount}`);
    } else {
      console.log('\n✅ Todos los nodos ya usan gpt-3.5-turbo');
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('📋 VERIFICACIÓN FINAL');
    console.log('═'.repeat(80));
    
    const flowActualizado = await flowsCollection.findOne({ _id: wooFlowId });
    const nodosGPTActualizados = flowActualizado.nodes.filter(n => n.type === 'gpt');
    
    console.log('\nModelos configurados:');
    nodosGPTActualizados.forEach(nodo => {
      const modelo = nodo.data?.config?.modelo || 'NO CONFIGURADO';
      console.log(`  - ${nodo.data?.label}: ${modelo}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarModelosNodosGPT();
