/**
 * Script para revisar cómo están los tópicos en el flujo
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revisarTopicosFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 FLUJO VEO VEO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`_id: ${flow._id}`);
    console.log(`name: ${flow.name}`);
    console.log(`empresaId: ${flow.empresaId}`);
    
    console.log('\n📋 CAMPOS DEL FLUJO:');
    Object.keys(flow).forEach(key => {
      if (key !== 'nodes' && key !== 'edges') {
        console.log(`   - ${key}: ${typeof flow[key]}`);
      }
    });
    
    if (flow.topicos) {
      console.log('\n\n📚 TÓPICOS DEL FLUJO:');
      console.log(JSON.stringify(flow.topicos, null, 2));
    } else {
      console.log('\n\n⚠️  El flujo NO tiene campo "topicos"');
    }
    
    if (flow.config) {
      console.log('\n\n⚙️  CONFIGURACIÓN DEL FLUJO:');
      console.log(JSON.stringify(flow.config, null, 2));
    } else {
      console.log('\n\n⚠️  El flujo NO tiene campo "config"');
    }
    
    // Revisar nodos GPT
    const nodosGPT = flow.nodes.filter(n => n.type === 'gpt');
    
    console.log('\n\n🤖 NODOS GPT:');
    nodosGPT.forEach(nodo => {
      console.log(`\n   ${nodo.id}:`);
      console.log(`      type: ${nodo.type}`);
      
      if (nodo.data?.config?.topics) {
        console.log(`      topics: ${JSON.stringify(nodo.data.config.topics)}`);
      }
      
      if (nodo.data?.config?.topicos) {
        console.log(`      topicos: ${JSON.stringify(nodo.data.config.topicos)}`);
      }
      
      if (!nodo.data?.config?.topics && !nodo.data?.config?.topicos) {
        console.log(`      ⚠️  No tiene topics ni topicos`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
revisarTopicosFlujo()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
