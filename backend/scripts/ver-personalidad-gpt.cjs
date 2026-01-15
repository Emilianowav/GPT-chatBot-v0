require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function verPersonalidadGPT() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PERSONALIDAD Y TÓPICOS DE NODOS GPT');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    for (const node of flow.nodes) {
      if (node.type === 'gpt') {
        console.log(`\n📝 NODO: ${node.data.label} (${node.id})`);
        console.log('─'.repeat(63));
        console.log(`Tipo: ${node.data.config?.tipo || 'N/A'}`);
        
        if (node.data.config?.personalidad) {
          console.log('\n🎭 PERSONALIDAD:');
          console.log(node.data.config.personalidad);
        }
        
        if (node.data.config?.topicos && node.data.config.topicos.length > 0) {
          console.log('\n📚 TÓPICOS:');
          node.data.config.topicos.forEach((topico, i) => {
            console.log(`\n${i + 1}. ${topico.titulo}`);
            console.log(`   ${topico.contenido.substring(0, 100)}...`);
          });
        }
        
        if (node.data.config?.systemPrompt) {
          console.log('\n⚙️ SYSTEM PROMPT (legacy):');
          console.log(node.data.config.systemPrompt.substring(0, 200) + '...');
        }
        
        console.log('\n' + '═'.repeat(63));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verPersonalidadGPT();
