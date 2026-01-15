const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorNoMarcarFaltantes() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX: FORMATEADOR - NO MARCAR VARIABLES FALTANTES EN SALUDOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Nuevo prompt que NO marca variables como faltantes si el usuario no menciona libros
    const nuevoPrompt = `Analiza el historial y extrae información sobre libros SOLO si el usuario la menciona explícitamente.

REGLA CRÍTICA:
Si el usuario NO menciona ningún libro específico → Devuelve TODO null

EJEMPLOS CLAROS:

Usuario: "Hola"
→ {"titulo": null, "editorial": null, "edicion": null}

Usuario: "Buenos días"
→ {"titulo": null, "editorial": null, "edicion": null}

Usuario: "¿Tienen libros?"
→ {"titulo": null, "editorial": null, "edicion": null}

Usuario: "Busco Harry Potter 5"
→ {"titulo": "Harry Potter y la Orden del Fénix", "editorial": null, "edicion": null}

Usuario: "Quiero El Principito de Salamandra"
→ {"titulo": "El Principito", "editorial": "Salamandra", "edicion": null}

Usuario: "cualquiera" (después de pedir título)
→ {"titulo": null, "editorial": null, "edicion": null}

NORMALIZACIÓN:
- "Harry Potter 5" → "Harry Potter y la Orden del Fénix"
- "HP 3" → "Harry Potter y el Prisionero de Azkaban"
- Usa conocimiento general para títulos completos

IMPORTANTE: Responde ÚNICAMENTE con JSON válido.`;

    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-formateador' },
      { $set: { 'nodes.$.data.config.extractionConfig.systemPrompt': nuevoPrompt } }
    );
    
    console.log(`✅ Formateador actualizado: ${result.modifiedCount} cambio(s)\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 COMPORTAMIENTO ESPERADO:\n');
    console.log('Usuario: "Hola"');
    console.log('   Formateador extrae: {"titulo": null, "editorial": null, "edicion": null}');
    console.log('   Backend calcula: variables_faltantes = ["titulo"] (porque titulo es REQUERIDO)');
    console.log('   Router: variables_faltantes not_empty = TRUE');
    console.log('   Va a: gpt-pedir-datos');
    console.log('   Bot: "¡Hola! 😊 ¿En qué puedo ayudarte?"');
    console.log('');
    console.log('Usuario: "Busco Harry Potter 5"');
    console.log('   Formateador extrae: {"titulo": "Harry Potter y la Orden del Fénix", ...}');
    console.log('   Backend calcula: variables_faltantes = [] (titulo presente)');
    console.log('   Router: variables_completas = TRUE');
    console.log('   Va a: WooCommerce');
    console.log('   Bot: Muestra productos');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateadorNoMarcarFaltantes();
