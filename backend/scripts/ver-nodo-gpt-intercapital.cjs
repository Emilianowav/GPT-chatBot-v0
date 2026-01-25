const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';

async function verNodoGPT() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }), 'flows');
    
    const flow = await Flow.findOne({ nombre: 'Intercapital' });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo de Intercapital');
      return;
    }

    console.log('\n📊 FLUJO INTERCAPITAL ENCONTRADO');
    console.log('ID:', flow._id);
    console.log('Nombre:', flow.nombre);
    console.log('Empresa:', flow.empresaId);
    
    // Buscar nodos GPT
    const nodes = flow.nodes || [];
    console.log('\n🔍 Total de nodos:', nodes.length);
    
    const gptNodes = nodes.filter(n => n.type === 'gpt' || n.type === 'openai');
    console.log('📝 Nodos GPT encontrados:', gptNodes.length);
    
    gptNodes.forEach((node, index) => {
      console.log(`\n--- NODO GPT ${index + 1} ---`);
      console.log('ID:', node.id);
      console.log('Label:', node.data?.label || 'Sin label');
      console.log('Position:', node.position);
      
      const config = node.data?.config || {};
      console.log('\n⚙️ CONFIGURACIÓN:');
      console.log('Modelo:', config.model || 'No especificado');
      console.log('Temperature:', config.temperature || 'No especificado');
      console.log('Max Tokens:', config.maxTokens || 'No especificado');
      
      if (config.systemPrompt) {
        console.log('\n📝 System Prompt (primeros 300 chars):');
        console.log(config.systemPrompt.substring(0, 300) + '...');
      } else {
        console.log('\n⚠️ Sin System Prompt');
      }
      
      if (config.outputVariable) {
        console.log('\n📤 Output Variable:', config.outputVariable);
      } else {
        console.log('\n⚠️ Sin Output Variable');
      }
      
      if (config.userMessage) {
        console.log('\n💬 User Message (primeros 200 chars):');
        console.log(config.userMessage.substring(0, 200) + '...');
      }
      
      console.log('\n' + '='.repeat(50));
    });

    // Buscar el router
    const routers = nodes.filter(n => n.type === 'router');
    console.log(`\n🔀 ROUTERS encontrados: ${routers.length}`);
    
    routers.forEach((router, index) => {
      console.log(`\n--- ROUTER ${index + 1} ---`);
      console.log('ID:', router.id);
      console.log('Label:', router.data?.label || 'Sin label');
      console.log('Position:', router.position);
    });

    // Buscar edges (conexiones)
    const edges = flow.edges || [];
    console.log(`\n🔗 CONEXIONES (edges): ${edges.length}`);
    
    // Conexiones desde nodos GPT
    const gptNodeIds = gptNodes.map(n => n.id);
    const edgesFromGPT = edges.filter(e => gptNodeIds.includes(e.source));
    
    console.log(`\n📍 Conexiones desde nodos GPT: ${edgesFromGPT.length}`);
    edgesFromGPT.forEach(edge => {
      console.log(`  ${edge.source} → ${edge.target}`);
      if (edge.data?.condition) {
        console.log(`    Condición: ${JSON.stringify(edge.data.condition)}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

verNodoGPT();
