const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateador() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    console.log('🔧 ACTUALIZANDO PROMPT DEL FORMATEADOR (INTELIGENTE):\n');
    
    const nuevoPrompt = `Analiza el historial de la conversación y extrae las variables solicitadas.

REGLAS GENERALES:
- Tolera errores ortográficos en el input del usuario
- Entiende abreviaciones comunes (ej: "hp5" = "Harry Potter y la Orden del Fénix")
- Normaliza el texto a formato estándar
- Extrae información del historial completo, no solo del último mensaje

REGLA CRÍTICA PARA IDENTIFICACIÓN DE TÍTULOS:
- Usa tu conocimiento general sobre libros para identificar el título oficial completo
- Si el usuario menciona un número o abreviación, identifica el libro específico de la saga
- Ejemplos:
  * "Harry Potter 5" → {"titulo": "Harry Potter y la Orden del Fénix"}
  * "hp5" → {"titulo": "Harry Potter y la Orden del Fénix"}
  * "El señor de los anillos 2" → {"titulo": "Las Dos Torres"}
  * "Crepúsculo 3" → {"titulo": "Eclipse"}
  * "Juego de tronos 1" → {"titulo": "Juego de Tronos"}
- Si no conoces el título exacto o el usuario no especifica número, usa el nombre de la saga
  * "Harry Potter" → {"titulo": "Harry Potter"}
  * "El señor de los anillos" → {"titulo": "El Señor de los Anillos"}

REGLA PARA VARIABLES OPCIONALES:
- Si el usuario dice "cualquiera" refiriéndose a una variable opcional (editorial, edicion), 
  debes extraer el valor "cualquiera" para esa variable
- NO devuelvas null si el usuario dijo "cualquiera"

IMPORTANTE:
- Responde ÚNICAMENTE con un objeto JSON válido
- Si una variable NO fue mencionada por el usuario, usa null
- Si el usuario dijo "cualquiera", usa "cualquiera" como valor
- No inventes información que el usuario no mencionó
- Prioriza identificar el título oficial completo cuando sea posible`;

    console.log('Prompt nuevo:');
    console.log(nuevoPrompt);
    console.log('\n');
    
    formateador.data.config.extractionConfig.systemPrompt = nuevoPrompt;
    
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Prompt del formateador actualizado correctamente\n');
      console.log('📋 COMPORTAMIENTO ESPERADO:');
      console.log('   Usuario: "Busco harry potter 5"');
      console.log('   Extracción: {"titulo": "Harry Potter y la Orden del Fénix"}');
      console.log('   WooCommerce busca: "Harry Potter y la Orden del Fénix"');
      console.log('   Si no encuentra exacto, busca "Harry Potter" como fallback\n');
      console.log('   Usuario: "hp5"');
      console.log('   Extracción: {"titulo": "Harry Potter y la Orden del Fénix"}');
      console.log('   WooCommerce busca el título oficial ✅');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateador();
