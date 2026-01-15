const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verConfigConversacional() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    const { ObjectId } = require('mongodb');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n📊 FLOW:', flow.nombre);
    console.log('═══════════════════════════════════════\n');
    
    // Buscar nodo GPT conversacional (el segundo)
    const conversacional = flow.nodes.find(n => 
      n.type === 'gpt' && 
      n.data?.config?.tipo === 'conversacional'
    );
    
    if (!conversacional) {
      console.log('❌ No se encontró nodo conversacional');
      return;
    }
    
    console.log('🔍 NODO CONVERSACIONAL:', conversacional.id);
    console.log('   Label:', conversacional.data?.label);
    console.log('   Tipo:', conversacional.data?.config?.tipo);
    console.log('\n📋 CONFIGURACIÓN COMPLETA:');
    console.log(JSON.stringify(conversacional.data?.config, null, 2));
    
    console.log('\n🔧 VARIABLES A RECOPILAR:');
    const vars = conversacional.data?.config?.variablesRecopilar || [];
    if (vars.length === 0) {
      console.log('   ⚠️  NO HAY VARIABLES CONFIGURADAS');
    } else {
      vars.forEach((v, i) => {
        console.log(`\n   Variable ${i + 1}:`);
        console.log(`      Nombre: ${v.nombre}`);
        console.log(`      Tipo: ${v.tipo}`);
        console.log(`      Obligatorio: ${v.obligatorio}`);
        console.log(`      Descripción: ${v.descripcion}`);
        console.log(`      Ejemplos: ${v.ejemplos}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verConfigConversacional();
