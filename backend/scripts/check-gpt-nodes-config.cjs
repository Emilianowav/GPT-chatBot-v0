require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function checkGPTNodesConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CONFIGURACIÓN ACTUAL DE NODOS GPT');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const gptNodes = flow.nodes.filter(n => n.type === 'gpt');
    
    gptNodes.forEach(node => {
      const config = node.data.config;
      
      console.log(`📝 ${node.data.label} (${node.id})`);
      console.log(`   Tipo: ${config.tipo || 'N/A'}`);
      console.log(`   Modelo: ${config.modelo || 'N/A'}`);
      console.log('');
      
      console.log('   Configuración:');
      console.log(`   - personalidad: ${config.personalidad ? '✅ SÍ' : '❌ NO'}`);
      if (config.personalidad) {
        console.log(`     "${config.personalidad.substring(0, 80)}..."`);
      }
      
      console.log(`   - topicos: ${config.topicos?.length || 0}`);
      if (config.topicos && config.topicos.length > 0) {
        config.topicos.forEach(t => {
          console.log(`     • ${t.titulo || t}`);
        });
      }
      
      console.log(`   - variablesRecopilar: ${config.variablesRecopilar?.length || 0}`);
      if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
        config.variablesRecopilar.forEach(v => {
          console.log(`     • ${v.nombre} (${v.tipo}) ${v.obligatorio ? '- OBLIGATORIO' : ''}`);
        });
      }
      
      console.log(`   - systemPrompt (legacy): ${config.systemPrompt ? '✅ SÍ' : '❌ NO'}`);
      if (config.systemPrompt) {
        console.log(`     "${config.systemPrompt.substring(0, 80)}..."`);
      }
      
      console.log(`   - instrucciones (INCORRECTO): ${config.instrucciones ? '⚠️ SÍ (debería eliminarse)' : '✅ NO'}`);
      
      console.log('');
      console.log('   ═══════════════════════════════════════════════════════════');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkGPTNodesConfig();
