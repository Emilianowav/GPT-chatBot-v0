import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verNodoMercadoPago() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot');
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('🔍 ANALIZANDO NODOS DE MERCADOPAGO EN EL FLUJO');
    console.log('═'.repeat(80));
    console.log(`\nFlow: ${flow.name}`);
    console.log(`Total de nodos: ${flow.nodes.length}\n`);
    
    // Buscar todos los nodos relacionados con MercadoPago
    const nodosMercadoPago = flow.nodes.filter(n => 
      n.type === 'mercadopago' || 
      n.id.toLowerCase().includes('mercado') ||
      n.id.toLowerCase().includes('verificar') ||
      n.data?.label?.toLowerCase().includes('mercado')
    );
    
    console.log(`📋 Nodos relacionados con MercadoPago: ${nodosMercadoPago.length}\n`);
    
    nodosMercadoPago.forEach((nodo, index) => {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`NODO ${index + 1}:`);
      console.log(`${'─'.repeat(80)}`);
      console.log(`ID: ${nodo.id}`);
      console.log(`Type: ${nodo.type}`);
      console.log(`Label: ${nodo.data?.label || 'Sin label'}`);
      console.log(`\nData completo:`);
      console.log(JSON.stringify(nodo.data, null, 2));
      
      if (nodo.data?.config) {
        console.log(`\nConfig:`);
        console.log(JSON.stringify(nodo.data.config, null, 2));
      }
    });
    
    // Buscar específicamente el nodo mercadopago-verificar-pago
    const nodoVerificar = flow.nodes.find(n => n.id === 'mercadopago-verificar-pago');
    
    if (nodoVerificar) {
      console.log('\n\n' + '═'.repeat(80));
      console.log('🎯 NODO ESPECÍFICO: mercadopago-verificar-pago');
      console.log('═'.repeat(80));
      console.log(`\nType: ${nodoVerificar.type}`);
      console.log(`Label: ${nodoVerificar.data?.label}`);
      console.log(`\nConfig tipo: ${nodoVerificar.data?.config?.tipo}`);
      console.log(`\nData completo:`);
      console.log(JSON.stringify(nodoVerificar, null, 2));
    }
    
    console.log('\n\n' + '═'.repeat(80));
    console.log('💡 RECOMENDACIÓN PARA EL FRONTEND');
    console.log('═'.repeat(80));
    
    if (nodoVerificar) {
      console.log(`\nPara detectar este nodo en el frontend, usar:`);
      console.log(`  - node.type === '${nodoVerificar.type}'`);
      console.log(`  - node.id === '${nodoVerificar.id}'`);
      if (nodoVerificar.data?.config?.tipo) {
        console.log(`  - node.data.config.tipo === '${nodoVerificar.data.config.tipo}'`);
      }
      if (nodoVerificar.data?.label) {
        console.log(`  - node.data.label === '${nodoVerificar.data.label}'`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verNodoMercadoPago();
