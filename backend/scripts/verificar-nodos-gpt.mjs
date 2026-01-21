import fetch from 'node-fetch';

async function verificarNodosGPT() {
  try {
    const response = await fetch('http://localhost:3000/api/flows/by-id/696aef0863e98384f9248968');
    const flow = await response.json();
    
    console.log('📋 Flujo:', flow.nombre);
    console.log('🔧 Tópicos habilitados:', flow.config?.topicos_habilitados);
    console.log('📚 Tópicos globales:', Object.keys(flow.config?.topicos || {}));
    console.log('\n=== NODOS GPT ===\n');
    
    const gptNodes = flow.nodes.filter(n => n.type === 'gpt');
    
    gptNodes.forEach((node, i) => {
      console.log(`${i + 1}. ${node.data.label || node.id}`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Prompt: ${node.data.config?.prompt?.substring(0, 80)}...`);
      console.log(`   Tópicos locales: ${node.data.config?.topicos?.length || 0}`);
      
      if (node.data.config?.topicos && node.data.config.topicos.length > 0) {
        console.log('   📚 Tópicos configurados:');
        node.data.config.topicos.forEach(t => {
          console.log(`      - ${t.titulo}`);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verificarNodosGPT();
