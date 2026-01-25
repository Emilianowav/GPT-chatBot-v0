const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';

async function verNodo4() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }), 'flows');
    
    const flow = await Flow.findOne({ empresaId: 'Intercapital' });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo de Intercapital');
      return;
    }

    console.log('\n📊 FLUJO DE INTERCAPITAL');
    console.log('Nombre:', flow.nombre);
    console.log('ID:', flow._id);
    console.log('Total nodos:', flow.nodes?.length || 0);
    
    const nodes = flow.nodes || [];
    
    // Listar todos los nodos con su posición
    console.log('\n📋 TODOS LOS NODOS:');
    nodes.forEach((node, index) => {
      console.log(`${index + 1}. [${node.type}] ${node.data?.label || 'Sin label'} (ID: ${node.id})`);
    });
    
    // Buscar nodos GPT
    const gptNodes = nodes.filter(n => n.type === 'gpt' || n.type === 'openai');
    console.log(`\n🤖 NODOS GPT: ${gptNodes.length}`);
    
    gptNodes.forEach((node, index) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`NODO GPT #${index + 1}`);
      console.log(`${'='.repeat(60)}`);
      console.log('ID:', node.id);
      console.log('Label:', node.data?.label || 'Sin label');
      console.log('Position X:', node.position?.x);
      console.log('Position Y:', node.position?.y);
      
      const config = node.data?.config || {};
      
      console.log('\n⚙️ CONFIGURACIÓN:');
      console.log('  Modelo:', config.model || 'No especificado');
      console.log('  Temperature:', config.temperature ?? 'No especificado');
      console.log('  Max Tokens:', config.maxTokens || 'No especificado');
      
      if (config.systemPrompt) {
        console.log('\n📝 SYSTEM PROMPT:');
        console.log('─'.repeat(60));
        console.log(config.systemPrompt);
        console.log('─'.repeat(60));
      } else {
        console.log('\n⚠️ Sin System Prompt');
      }
      
      if (config.userMessage) {
        console.log('\n💬 USER MESSAGE:');
        console.log('─'.repeat(60));
        console.log(config.userMessage);
        console.log('─'.repeat(60));
      }
      
      if (config.outputVariable) {
        console.log('\n📤 OUTPUT VARIABLE:', config.outputVariable);
      } else {
        console.log('\n⚠️ Sin Output Variable configurada');
      }
    });

    // Buscar routers
    const routers = nodes.filter(n => n.type === 'router');
    console.log(`\n\n🔀 ROUTERS: ${routers.length}`);
    
    routers.forEach((router, index) => {
      console.log(`\n--- ROUTER #${index + 1} ---`);
      console.log('ID:', router.id);
      console.log('Label:', router.data?.label || 'Sin label');
      console.log('Position X:', router.position?.x);
      console.log('Position Y:', router.position?.y);
    });

    // Ver conexiones
    const edges = flow.edges || [];
    console.log(`\n\n🔗 CONEXIONES: ${edges.length}`);
    
    // Conexiones desde GPT nodes
    const gptIds = gptNodes.map(n => n.id);
    const edgesFromGPT = edges.filter(e => gptIds.includes(e.source));
    
    if (edgesFromGPT.length > 0) {
      console.log('\n📍 Conexiones desde nodos GPT:');
      edgesFromGPT.forEach(edge => {
        const targetNode = nodes.find(n => n.id === edge.target);
        console.log(`  ${edge.source} → ${edge.target} [${targetNode?.type}]`);
        if (edge.data?.label) {
          console.log(`    Label: ${edge.data.label}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

verNodo4();
