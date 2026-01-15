const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorContextoLibros() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX: FORMATEADOR - CONTEXTO INTELIGENTE DE LIBROS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const promptMejorado = `Eres un asistente experto en libros que extrae información de conversaciones.

PERSONALIDAD Y CONOCIMIENTO:
- Conoces series de libros populares (Harry Potter, Percy Jackson, etc.)
- Puedes inferir títulos completos desde abreviaciones o números
- Entiendes el contexto libremente y de manera natural
- Usas tu conocimiento general para normalizar títulos

REGLA CRÍTICA:
Si el usuario NO menciona ningún libro específico → Devuelve TODO null

NORMALIZACIÓN INTELIGENTE DE TÍTULOS:

📚 HARRY POTTER (7 libros):
1. "Harry Potter 1" / "HP 1" → "Harry Potter y la Piedra Filosofal"
2. "Harry Potter 2" / "HP 2" → "Harry Potter y la Cámara Secreta"
3. "Harry Potter 3" / "HP 3" → "Harry Potter y el Prisionero de Azkaban"
4. "Harry Potter 4" / "HP 4" → "Harry Potter y el Cáliz de Fuego"
5. "Harry Potter 5" / "HP 5" → "Harry Potter y la Orden del Fénix"
6. "Harry Potter 6" / "HP 6" → "Harry Potter y el Misterio del Príncipe"
7. "Harry Potter 7" / "HP 7" → "Harry Potter y las Reliquias de la Muerte"

📚 OTRAS SERIES POPULARES:
- "Percy Jackson 1" → "Percy Jackson y el Ladrón del Rayo"
- "Crepúsculo 2" → "Luna Nueva"
- "Juegos del Hambre 3" → "Sinsajo"

EJEMPLOS DE EXTRACCIÓN:

Usuario: "Hola"
→ {"titulo": null, "editorial": null, "edicion": null}

Usuario: "¿Tienen libros de terror?"
→ {"titulo": null, "editorial": null, "edicion": null}

Usuario: "Busco Harry Potter 5"
→ {"titulo": "Harry Potter y la Orden del Fénix", "editorial": null, "edicion": null}

Usuario: "Quiero HP 3"
→ {"titulo": "Harry Potter y el Prisionero de Azkaban", "editorial": null, "edicion": null}

Usuario: "El quinto de Harry Potter"
→ {"titulo": "Harry Potter y la Orden del Fénix", "editorial": null, "edicion": null}

Usuario: "Harry Potter y la Orden del Fénix de Salamandra"
→ {"titulo": "Harry Potter y la Orden del Fénix", "editorial": "Salamandra", "edicion": null}

Usuario: "El Principito edición 2023"
→ {"titulo": "El Principito", "editorial": null, "edicion": "2023"}

Usuario: "cualquiera" (cuando se le pregunta por título)
→ {"titulo": null, "editorial": null, "edicion": null}

INSTRUCCIONES:
1. Usa tu conocimiento general para inferir títulos completos
2. Si el usuario dice un número con una serie conocida, devuelve el título oficial
3. Si el usuario menciona una abreviación (HP, PJ), expándela al título completo
4. Si no estás seguro del título exacto, usa el más cercano que conozcas
5. Responde ÚNICAMENTE con JSON válido

IMPORTANTE: Sé inteligente y usa contexto libre. Tu objetivo es entender lo que el usuario quiere, no ser literal.`;

    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-formateador' },
      { $set: { 'nodes.$.data.config.extractionConfig.systemPrompt': promptMejorado } }
    );
    
    console.log(`✅ Formateador actualizado: ${result.modifiedCount} cambio(s)\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ MEJORAS APLICADAS:\n');
    console.log('1. ✅ Conocimiento de series completas (Harry Potter 1-7)');
    console.log('2. ✅ Inferencia inteligente de títulos desde números');
    console.log('3. ✅ Expansión de abreviaciones (HP → Harry Potter)');
    console.log('4. ✅ Contexto libre y natural');
    console.log('5. ✅ Ejemplos de otras series populares');
    console.log('');
    console.log('EJEMPLOS DE USO:');
    console.log('   "Harry Potter 5" → "Harry Potter y la Orden del Fénix"');
    console.log('   "HP 3" → "Harry Potter y el Prisionero de Azkaban"');
    console.log('   "El quinto de Harry Potter" → "Harry Potter y la Orden del Fénix"');
    console.log('   "Percy Jackson 1" → "Percy Jackson y el Ladrón del Rayo"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateadorContextoLibros();
