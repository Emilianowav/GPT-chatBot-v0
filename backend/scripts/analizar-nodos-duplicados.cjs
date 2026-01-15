const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function analizarNodosDuplicados() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔍 ANÁLISIS DE NODOS DUPLICADOS\n');
    console.log('═'.repeat(80));
    
    // Agrupar nodos por tipo
    const nodosPorTipo = {};
    flow.nodes.forEach(node => {
      if (!nodosPorTipo[node.type]) {
        nodosPorTipo[node.type] = [];
      }
      nodosPorTipo[node.type].push(node);
    });
    
    console.log('\n📊 RESUMEN POR TIPO:\n');
    Object.entries(nodosPorTipo).forEach(([tipo, nodos]) => {
      console.log(`${tipo}: ${nodos.length} nodos`);
      nodos.forEach(n => {
        console.log(`  - ${n.id}`);
      });
    });
    
    // Analizar GPT nodes en detalle
    console.log('\n\n🤖 ANÁLISIS DETALLADO DE NODOS GPT:\n');
    console.log('─'.repeat(80));
    
    const gptNodes = nodosPorTipo.gpt || [];
    gptNodes.forEach(node => {
      console.log(`\n📍 ID: ${node.id}`);
      console.log(`   Posición: x=${node.position?.x}, y=${node.position?.y}`);
      console.log(`   Label: ${node.data?.label || 'N/A'}`);
      console.log(`   Subtitle: ${node.data?.subtitle || 'N/A'}`);
      
      const systemPrompt = node.data?.config?.systemPrompt || '';
      const preview = systemPrompt.substring(0, 80);
      console.log(`   System Prompt: ${preview}${systemPrompt.length > 80 ? '...' : ''}`);
      
      // Verificar conexiones
      const incomingEdges = flow.edges.filter(e => e.target === node.id);
      const outgoingEdges = flow.edges.filter(e => e.source === node.id);
      console.log(`   Conexiones entrantes: ${incomingEdges.length}`);
      console.log(`   Conexiones salientes: ${outgoingEdges.length}`);
      
      if (incomingEdges.length === 0 && node.id !== 'webhook-whatsapp') {
        console.log(`   ⚠️  NODO HUÉRFANO (sin conexiones entrantes)`);
      }
    });
    
    // Analizar Routers
    console.log('\n\n🔀 ANÁLISIS DETALLADO DE ROUTERS:\n');
    console.log('─'.repeat(80));
    
    const routers = nodosPorTipo.router || [];
    routers.forEach(node => {
      console.log(`\n📍 ID: ${node.id}`);
      console.log(`   Posición: x=${node.position?.x}, y=${node.position?.y}`);
      console.log(`   Label: ${node.data?.label || 'N/A'}`);
      console.log(`   Subtitle: ${node.data?.subtitle || 'N/A'}`);
      
      const incomingEdges = flow.edges.filter(e => e.target === node.id);
      const outgoingEdges = flow.edges.filter(e => e.source === node.id);
      
      console.log(`   Conexiones entrantes: ${incomingEdges.length}`);
      incomingEdges.forEach(e => {
        console.log(`     ← desde: ${e.source}`);
      });
      
      console.log(`   Conexiones salientes: ${outgoingEdges.length}`);
      outgoingEdges.forEach(e => {
        console.log(`     → hacia: ${e.target} (handle: ${e.sourceHandle})`);
      });
      
      if (incomingEdges.length === 0) {
        console.log(`   ⚠️  ROUTER HUÉRFANO (sin conexiones entrantes)`);
      }
    });
    
    // Identificar nodos huérfanos
    console.log('\n\n⚠️  NODOS HUÉRFANOS (sin conexiones entrantes):\n');
    console.log('─'.repeat(80));
    
    const nodosHuerfanos = flow.nodes.filter(node => {
      if (node.id === 'webhook-whatsapp') return false; // El webhook es el inicio
      const incomingEdges = flow.edges.filter(e => e.target === node.id);
      return incomingEdges.length === 0;
    });
    
    if (nodosHuerfanos.length === 0) {
      console.log('✅ No hay nodos huérfanos');
    } else {
      nodosHuerfanos.forEach(node => {
        console.log(`\n🔴 ${node.id} (${node.type})`);
        console.log(`   Label: ${node.data?.label || 'N/A'}`);
        console.log(`   Posición: x=${node.position?.x}, y=${node.position?.y}`);
        
        const outgoingEdges = flow.edges.filter(e => e.source === node.id);
        if (outgoingEdges.length > 0) {
          console.log(`   Tiene ${outgoingEdges.length} conexiones salientes hacia:`);
          outgoingEdges.forEach(e => console.log(`     → ${e.target}`));
        }
      });
    }
    
    console.log('\n\n✅ Análisis completado\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

analizarNodosDuplicados();
