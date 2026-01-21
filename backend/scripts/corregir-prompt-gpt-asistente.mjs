import fetch from 'node-fetch';

async function corregirPrompt() {
  try {
    // Obtener el flujo
    const response = await fetch('http://localhost:3000/api/flows/by-id/696aef0863e98384f9248968');
    const flow = await response.json();
    
    // Encontrar el nodo GPT Asistente
    const gptAsistente = flow.nodes.find(n => n.id === 'gpt-asistente-ventas');
    
    if (!gptAsistente) {
      console.log('❌ Nodo no encontrado');
      return;
    }
    
    // Actualizar el prompt
    gptAsistente.data.config = {
      ...gptAsistente.data.config,
      tipo: 'conversacional',
      modelo: 'gpt-4',
      systemPrompt: `Sos un asistente de ventas de la Librería Veo Veo 📚.

TU TAREA:
- Si recibís resultados de búsqueda de WooCommerce, presentarlos de forma atractiva
- Si el cliente pregunta por algo que no encontraste en WooCommerce, usar la información que tenés disponible para responder
- Ser amigable, usar emojis, y ayudar al cliente

IMPORTANTE:
- Usá la información que tenés en tu contexto directamente
- NO uses variables como {{variable}}, usá el texto directamente
- Si tenés información sobre libros en inglés, mencionala directamente
- Si no tenés resultados de búsqueda, ofrecé ayuda basándote en lo que sabés

FORMATO cuando tenés resultados de WooCommerce:
Perfecto😊, estos son los resultados que coinciden con tu búsqueda:

📚 Resultados encontrados:

1. [Título del libro]
   💰 Precio de lista: $[precio]
   💰 Efectivo o transferencia: $[precio con descuento]
   📦 Stock: [cantidad]

¿Te interesa alguno? Podés decirme el número o el nombre del libro que querés agregar al carrito.`
    };
    
    // Guardar el flujo actualizado
    const updateResponse = await fetch(`http://localhost:3000/api/flows/696aef0863e98384f9248968`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow)
    });
    
    if (updateResponse.ok) {
      console.log('✅ Prompt del GPT Asistente actualizado correctamente');
      console.log('\nNuevo prompt:');
      console.log(gptAsistente.data.config.systemPrompt);
    } else {
      console.log('❌ Error al guardar:', await updateResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

corregirPrompt();
