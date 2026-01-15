const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verConfigFormateador() {
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
    
    // Buscar nodo GPT formateador (el tercero)
    const formateador = flow.nodes.find(n => 
      n.type === 'gpt' && 
      n.data?.config?.tipo === 'transform'
    );
    
    if (!formateador) {
      console.log('❌ No se encontró nodo formateador');
      return;
    }
    
    console.log('🔍 NODO FORMATEADOR:', formateador.id);
    console.log('   Label:', formateador.data?.label);
    console.log('   Tipo:', formateador.data?.config?.tipo);
    console.log('\n📋 CONFIGURACIÓN COMPLETA:');
    console.log(JSON.stringify(formateador.data?.config, null, 2));
    
    console.log('\n🔧 CAMPOS IMPORTANTES:');
    console.log('   systemPrompt:', formateador.data?.config?.systemPrompt?.substring(0, 100) + '...');
    console.log('   inputVariable:', formateador.data?.config?.inputVariable);
    console.log('   outputVariable:', formateador.data?.config?.outputVariable);
    console.log('   variablesRecopilar:', formateador.data?.config?.variablesRecopilar);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verConfigFormateador();
