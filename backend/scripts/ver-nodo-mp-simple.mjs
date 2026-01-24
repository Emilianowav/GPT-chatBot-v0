import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verNodo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    // Buscar el flow por ID
    const flow = await flowsCollection.findOne({ _id: new ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      console.log('Buscando todos los flows...\n');
      const allFlows = await flowsCollection.find({}).toArray();
      console.log(`Total flows: ${allFlows.length}`);
      allFlows.forEach(f => console.log(`  - ${f.name} (${f._id})`));
      return;
    }
    
    console.log(`Flow encontrado: ${flow.name} (${flow._id})\n`);
    
    // Buscar nodos de MercadoPago
    const nodosMercadoPago = flow.nodes.filter(n => 
      n.type === 'mercadopago' || 
      n.id.toLowerCase().includes('mercado') ||
      n.id.toLowerCase().includes('verificar')
    );
    
    console.log('═'.repeat(80));
    console.log(`NODOS DE MERCADOPAGO (${nodosMercadoPago.length})`);
    console.log('═'.repeat(80));
    
    nodosMercadoPago.forEach((nodo, i) => {
      console.log(`\n${i + 1}. ID: ${nodo.id}`);
      console.log(`   Type: ${nodo.type}`);
      console.log(`   Label: ${nodo.data?.label || 'Sin label'}`);
      console.log(`   Config tipo: ${nodo.data?.config?.tipo || 'Sin tipo'}`);
    });
    
    // Buscar el nodo específico
    const nodoVerificar = flow.nodes.find(n => n.id === 'mercadopago-verificar-pago');
    
    if (nodoVerificar) {
      console.log('\n\n' + '═'.repeat(80));
      console.log('🎯 NODO: mercadopago-verificar-pago');
      console.log('═'.repeat(80));
      console.log(JSON.stringify(nodoVerificar, null, 2));
      
      console.log('\n\n💡 DETECCIÓN EN FRONTEND:');
      console.log(`   node.type === '${nodoVerificar.type}'`);
      console.log(`   node.id === '${nodoVerificar.id}'`);
      if (nodoVerificar.data?.config?.tipo) {
        console.log(`   node.data.config.tipo === '${nodoVerificar.data.config.tipo}'`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verNodo();
