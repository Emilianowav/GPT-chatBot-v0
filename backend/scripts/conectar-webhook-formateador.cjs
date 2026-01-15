require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function conectarWebhook() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 FLUJO:', flow.nombre);
    console.log('═══════════════════════════════════════\n');

    // Buscar el webhook
    const webhook = flow.nodes.find(n => n.type === 'webhook' || n.id.includes('webhook'));
    
    if (!webhook) {
      console.log('❌ Webhook no encontrado');
      return;
    }

    console.log('📡 WEBHOOK encontrado:');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   Type: ${webhook.type}\n`);

    // Verificar si ya existe el edge
    const edgeExistente = flow.edges.find(e => 
      e.source === webhook.id && e.target === 'gpt-formateador'
    );

    if (edgeExistente) {
      console.log('✅ Edge webhook → gpt-formateador ya existe');
      console.log(`   ID: ${edgeExistente.id}\n`);
      return;
    }

    console.log('🔗 CREANDO EDGE: webhook → gpt-formateador\n');

    const nuevoEdge = {
      id: 'edge-webhook-formateador',
      source: webhook.id,
      target: 'gpt-formateador',
      type: 'default',
      data: {
        label: 'Mensaje recibido'
      }
    };

    flow.edges.push(nuevoEdge);

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );

    console.log('✅ Edge creado exitosamente\n');
    console.log('🎯 FLUJO ACTUALIZADO:');
    console.log(`   ${webhook.id} → gpt-formateador → router`);
    console.log('                                      ├─ Faltan variables → gpt-pedir-datos');
    console.log('                                      └─ Variables completas → woocommerce');
    console.log('');
    console.log('📊 Total edges en el flujo:', flow.edges.length);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

conectarWebhook();
