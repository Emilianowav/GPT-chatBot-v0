const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function moveFlowToNeural() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    // Obtener el flujo de crm_bot
    const crmDb = client.db('crm_bot');
    const crmFlowsCollection = crmDb.collection('flows');
    
    console.log('🔍 Buscando flujo en crm_bot...');
    const flow = await crmFlowsCollection.findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });

    if (!flow) {
      console.log('❌ Flujo no encontrado en crm_bot');
      return;
    }

    console.log(`✅ Flujo encontrado: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes?.length}`);
    console.log(`   Edges: ${flow.edges?.length}\n`);

    // Insertar en neural_chatbot
    const neuralDb = client.db('neural_chatbot');
    const neuralFlowsCollection = neuralDb.collection('flows');

    // Verificar si ya existe
    const existingFlow = await neuralFlowsCollection.findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });

    if (existingFlow) {
      console.log('⚠️  Flujo ya existe en neural_chatbot');
      console.log('🔄 Actualizando...\n');
      
      await neuralFlowsCollection.replaceOne(
        { _id: new ObjectId(FLOW_ID) },
        flow
      );
      
      console.log('✅ Flujo actualizado en neural_chatbot');
    } else {
      console.log('📝 Insertando flujo en neural_chatbot...\n');
      
      await neuralFlowsCollection.insertOne(flow);
      
      console.log('✅ Flujo insertado en neural_chatbot');
    }

    // Verificar
    const verifyFlow = await neuralFlowsCollection.findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });

    console.log('\n🔍 VERIFICACIÓN:');
    console.log(`   Base de datos: neural_chatbot`);
    console.log(`   Nombre: ${verifyFlow.nombre}`);
    console.log(`   Nodos: ${verifyFlow.nodes?.length}`);
    console.log(`   IDs de nodos: ${verifyFlow.nodes?.map(n => n.id).join(', ')}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

moveFlowToNeural();
