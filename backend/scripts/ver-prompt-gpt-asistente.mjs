import fetch from 'node-fetch';

async function verPromptGPT() {
  try {
    const response = await fetch('http://localhost:3000/api/flows/by-id/696aef0863e98384f9248968');
    const flow = await response.json();
    
    const gptAsistente = flow.nodes.find(n => n.id === 'gpt-asistente-ventas');
    
    if (!gptAsistente) {
      console.log('❌ Nodo GPT Asistente Ventas no encontrado');
      return;
    }
    
    console.log('📝 GPT ASISTENTE VENTAS\n');
    console.log('ID:', gptAsistente.id);
    console.log('Label:', gptAsistente.data.label);
    console.log('\n=== SYSTEM PROMPT ===\n');
    console.log(gptAsistente.data.config?.systemPrompt || gptAsistente.data.config?.prompt || 'NO DEFINIDO');
    console.log('\n=== CONFIGURACIÓN ===\n');
    console.log('Tipo:', gptAsistente.data.config?.tipo);
    console.log('Modelo:', gptAsistente.data.config?.modelo);
    console.log('Tópicos locales:', gptAsistente.data.config?.topicos?.length || 0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verPromptGPT();
