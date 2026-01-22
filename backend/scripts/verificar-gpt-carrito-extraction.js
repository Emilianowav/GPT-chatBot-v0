import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarGPTCarritoExtraction() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔍 Verificando configuración de gpt-carrito...\n');
    
    const nodoGPT = wooFlow.nodes.find(n => n.id === 'gpt-carrito');
    
    if (nodoGPT) {
      console.log('📋 NODO GPT-CARRITO:');
      console.log(`   ID: ${nodoGPT.id}`);
      console.log(`   Type: ${nodoGPT.type}`);
      console.log(`   Label: ${nodoGPT.data?.label}\n`);
      
      console.log('📊 CONFIG:');
      console.log(`   tipo: ${nodoGPT.data.config.tipo}`);
      console.log(`   model: ${nodoGPT.data.config.model}`);
      console.log(`   outputFormat: ${nodoGPT.data.config.outputFormat}`);
      console.log(`   globalVariablesOutput: ${JSON.stringify(nodoGPT.data.config.globalVariablesOutput)}\n`);
      
      console.log('📋 EXTRACTION CONFIG:');
      if (nodoGPT.data.config.extractionConfig) {
        console.log('   enabled:', nodoGPT.data.config.extractionConfig.enabled);
        console.log('   fields:', JSON.stringify(nodoGPT.data.config.extractionConfig.fields, null, 2));
      } else {
        console.log('   ❌ NO EXISTE extractionConfig');
      }
      
      console.log('\n⚠️  PROBLEMA DETECTADO:');
      console.log('   Según los logs, el GPT solo genera: respuesta_gpt, tokens, costo');
      console.log('   NO genera: carrito, accion_siguiente');
      console.log('   Esto significa que extractionConfig NO se está ejecutando\n');
      
      console.log('💡 SOLUCIÓN:');
      console.log('   El extractionConfig debe estar configurado correctamente');
      console.log('   Y el FlowExecutor debe procesarlo cuando outputFormat === "structured"');
    } else {
      console.log('❌ No se encontró nodo gpt-carrito');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarGPTCarritoExtraction();
