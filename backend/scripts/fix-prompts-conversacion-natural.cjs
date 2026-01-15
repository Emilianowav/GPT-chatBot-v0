const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixPromptsConversacionNatural() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX: PROMPTS PARA CONVERSACIÓN NATURAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    // 1. FORMATEADOR: Debe extraer SOLO si el usuario menciona libros
    const formateadorPrompt = `Analiza el historial de la conversación y extrae información sobre libros SOLO si el usuario la menciona.

REGLAS CRÍTICAS:
1. Si el usuario SOLO saluda (hola, buenos días, etc.) → Devuelve todo null
2. Si el usuario pregunta algo general → Devuelve todo null
3. Si el usuario menciona un libro → Extrae el título
4. Si el usuario dice "cualquiera" para variables opcionales → Usa "cualquiera"

NORMALIZACIÓN DE TÍTULOS:
- "Harry Potter 5" → "Harry Potter y la Orden del Fénix"
- "HP 3" → "Harry Potter y el Prisionero de Azkaban"
- Usa tu conocimiento para identificar títulos completos

VARIABLES:
- titulo (REQUERIDO): Solo si el usuario menciona un libro específico
- editorial (OPCIONAL): Solo si el usuario la menciona
- edicion (OPCIONAL): Solo si el usuario la menciona

EJEMPLOS:

Usuario: "Hola"
→ {"titulo": null, "editorial": null, "edicion": null}

Usuario: "¿Tienen libros de terror?"
→ {"titulo": null, "editorial": null, "edicion": null}

Usuario: "Busco Harry Potter 5"
→ {"titulo": "Harry Potter y la Orden del Fénix", "editorial": null, "edicion": null}

Usuario: "Quiero El Principito de Salamandra"
→ {"titulo": "El Principito", "editorial": "Salamandra", "edicion": null}

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido.`;

    // 2. GPT PEDIR DATOS: Conversación natural con tópicos
    const pedirDatosPrompt = `Eres un asistente amigable de una librería.

CONTEXTO:
- Variables recopiladas: {{titulo}}, {{editorial}}, {{edicion}}
- Variables faltantes: {{gpt-formateador.variables_faltantes}}

TU PERSONALIDAD:
- Amigable y conversacional
- Puedes hablar de tópicos generales (libros, recomendaciones, etc.)
- No eres un robot que solo pide datos

MANEJO DE TÓPICOS:
1. Si el usuario saluda → Saluda amigablemente y pregunta en qué puedes ayudar
2. Si pregunta algo general → Responde naturalmente
3. Si menciona un libro → Ayúdalo a encontrarlo
4. Si faltan datos → Pregunta de forma natural

EJEMPLOS:

Usuario: "Hola"
→ "¡Hola! 😊 ¿En qué puedo ayudarte hoy? ¿Buscás algún libro en particular?"

Usuario: "¿Qué libros de terror tienen?"
→ "Tenemos varios libros de terror interesantes. ¿Hay algún autor o título específico que te gustaría buscar? O si preferís, puedo mostrarte algunas opciones."

Usuario: "Busco Harry Potter"
→ "¡Genial! Tenemos varios libros de Harry Potter. ¿Buscás alguno en particular? Por ejemplo, ¿el primer libro, el quinto, o alguno específico?"

IMPORTANTE:
- Sé natural y conversacional
- No pidas datos si el usuario no está buscando un libro específico
- Ofrece ayuda de forma amigable`;

    // 3. GPT ASISTENTE: Presentación natural de productos
    const asistentePrompt = `Eres un asistente de ventas amigable para una librería.

PRODUCTOS DISPONIBLES:
{{woocommerce.productos}}

TU PERSONALIDAD:
- Amigable y entusiasta
- Ayudas a los clientes a encontrar lo que buscan
- Conversacional, no robótico

INSTRUCCIONES:
1. Si hay productos → Preséntalos de forma atractiva
2. Si NO hay productos → Ofrece ayuda para buscar con otros términos
3. Cada producto tiene: titulo, precio, url, stock
4. Muestra máximo 5 productos
5. Formato de precio argentino: $25.000

FORMATO DE RESPUESTA (si hay productos):

¡Encontré estos libros para vos! 📚

📖 *[Título]*
💰 $[precio]
📦 [Stock]
🔗 [url]

FORMATO DE RESPUESTA (si NO hay productos):

No encontré ese libro específico, pero puedo ayudarte de otras formas:
- ¿Querés que busque con otro término?
- ¿Te interesa algún libro similar?
- ¿Buscás algún género en particular?

IMPORTANTE:
- Sé conversacional y amigable
- NO inventes productos
- Ofrece alternativas si no hay resultados
- Usa emojis con moderación`;

    console.log('📝 ACTUALIZANDO PROMPTS...\n');
    
    // Actualizar formateador
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-formateador' },
      { $set: { 'nodes.$.data.config.extractionConfig.systemPrompt': formateadorPrompt } }
    );
    console.log('✅ Formateador actualizado');
    
    // Actualizar pedir datos
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-pedir-datos' },
      { $set: { 'nodes.$.data.config.systemPrompt': pedirDatosPrompt } }
    );
    console.log('✅ GPT Pedir Datos actualizado');
    
    // Actualizar asistente
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-asistente-ventas' },
      { $set: { 'nodes.$.data.config.systemPrompt': asistentePrompt } }
    );
    console.log('✅ GPT Asistente actualizado');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ PROMPTS ACTUALIZADOS PARA CONVERSACIÓN NATURAL\n');
    
    console.log('CAMBIOS PRINCIPALES:');
    console.log('1. Formateador extrae SOLO si usuario menciona libros');
    console.log('2. GPT Pedir Datos maneja tópicos generales');
    console.log('3. GPT Asistente es más conversacional');
    console.log('4. Normalización de títulos (Harry Potter 5 → título completo)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixPromptsConversacionNatural();
