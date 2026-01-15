require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verPedirDatosConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }
    
    // Buscar nodo pedir-datos
    const pedirDatos = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    
    if (!pedirDatos) {
      console.error('❌ Nodo gpt-pedir-datos no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('GPT PEDIR-DATOS - CONFIGURACIÓN COMPLETA');
    console.log('═'.repeat(80));
    
    const config = pedirDatos.data.config;
    
    console.log('\n📋 TIPO:', config.tipo);
    console.log('📋 MODELO:', config.modelo);
    console.log('\n📋 SYSTEM PROMPT:');
    console.log('─'.repeat(80));
    console.log(config.systemPrompt || 'NO CONFIGURADO');
    
    console.log('\n═'.repeat(80));
    console.log('CONFIGURACIÓN COMPLETA (JSON):');
    console.log('═'.repeat(80));
    console.log(JSON.stringify(config, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verPedirDatosConfig();
