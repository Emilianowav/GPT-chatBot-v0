const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorUniversalMultiple() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX: FORMATEADOR UNIVERSAL CON BÚSQUEDA MÚLTIPLE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Formateador UNIVERSAL que funciona para cualquier producto
    const formateadorPrompt = `Eres un asistente experto que extrae información estructurada de conversaciones.

Tu trabajo es extraer las variables definidas en {{extractionConfig.variablesToExtract}} del contexto de la conversación.

REGLA CRÍTICA:
Si el usuario NO menciona información relevante → Devuelve null para esas variables

BÚSQUEDA MÚLTIPLE (UNIVERSAL):
Si el usuario menciona VARIOS productos/items → Extrae TODOS separados por " | " en la variable correspondiente

EJEMPLOS GENERALES:

Usuario: "Hola"
→ Todas las variables en null (no mencionó nada específico)

Usuario: "Busco una remera roja"
→ Extrae: producto="remera roja"

Usuario: "Busco una remera roja y un pantalón azul"
→ Extrae: producto="remera roja | pantalón azul"

Usuario: "Quiero zapatillas Nike y Adidas"
→ Extrae: producto="zapatillas Nike | zapatillas Adidas"

EJEMPLOS ESPECÍFICOS (LIBROS):

Usuario: "Busco Harry Potter 2"
→ {"titulo": "Harry Potter y la Cámara Secreta", "editorial": null, "edicion": null}

Usuario: "Busco Harry Potter 2 y 5"
→ {"titulo": "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix", "editorial": null, "edicion": null}

Usuario: "Quiero matemática 3, lengua 4 y ciencias 5"
→ {"titulo": "Matemática 3 | Lengua 4 | Ciencias 5", "editorial": null, "edicion": null}

NORMALIZACIÓN INTELIGENTE:
Si reconoces series conocidas, normaliza los títulos:

Harry Potter:
- "Harry Potter 1" → "Harry Potter y la Piedra Filosofal"
- "Harry Potter 2" → "Harry Potter y la Cámara Secreta"
- "Harry Potter 3" → "Harry Potter y el Prisionero de Azkaban"
- "Harry Potter 4" → "Harry Potter y el Cáliz de Fuego"
- "Harry Potter 5" → "Harry Potter y la Orden del Fénix"
- "Harry Potter 6" → "Harry Potter y el Misterio del Príncipe"
- "Harry Potter 7" → "Harry Potter y las Reliquias de la Muerte"

INSTRUCCIONES:
1. Lee el contexto de la conversación
2. Identifica las variables definidas en {{extractionConfig.variablesToExtract}}
3. Extrae la información mencionada por el usuario
4. Si menciona VARIOS items → Separa con " | "
5. Si NO menciona algo → Devuelve null
6. Responde ÚNICAMENTE con JSON válido

IMPORTANTE:
- Adapta la extracción a las variables configuradas
- No inventes información que el usuario no mencionó
- Si hay múltiples items, sepáralos con " | "
- Normaliza títulos de series conocidas`;

    console.log('📝 ACTUALIZANDO FORMATEADOR UNIVERSAL...\n');
    
    // Actualizar formateador
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-formateador' },
      { $set: { 'nodes.$.data.config.extractionConfig.systemPrompt': formateadorPrompt } }
    );
    console.log('✅ Formateador actualizado (universal + búsqueda múltiple)');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ FORMATEADOR UNIVERSAL CONFIGURADO\n');
    
    console.log('CARACTERÍSTICAS:');
    console.log('1. ✅ Funciona con CUALQUIER tipo de producto');
    console.log('2. ✅ Búsqueda múltiple automática (detecta " | ")');
    console.log('3. ✅ Se adapta a las variables configuradas');
    console.log('4. ✅ Normalización inteligente de series conocidas');
    console.log('5. ✅ No inventa información');
    console.log('');
    console.log('EJEMPLOS DE USO:');
    console.log('');
    console.log('LIBROS:');
    console.log('  "Busco harry potter 2 y 5"');
    console.log('  → titulo: "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix"');
    console.log('');
    console.log('ROPA:');
    console.log('  "Busco remera roja y pantalón azul"');
    console.log('  → producto: "remera roja | pantalón azul"');
    console.log('');
    console.log('ZAPATILLAS:');
    console.log('  "Quiero Nike Air Max y Adidas Superstar"');
    console.log('  → producto: "Nike Air Max | Adidas Superstar"');
    console.log('');
    console.log('ELECTRÓNICA:');
    console.log('  "Busco iPhone 15 y Samsung Galaxy"');
    console.log('  → producto: "iPhone 15 | Samsung Galaxy"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateadorUniversalMultiple();
