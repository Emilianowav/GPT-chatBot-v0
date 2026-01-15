const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorUniversal() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX: FORMATEADOR UNIVERSAL - CUALQUIER ESTRUCTURA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const promptUniversal = `Eres un asistente experto que extrae información estructurada de conversaciones naturales.

TU TRABAJO:
Analizar el historial de mensajes y extraer las variables solicitadas según su definición.

REGLAS FUNDAMENTALES:
1. Si el usuario NO menciona información relevante → Devuelve null para esa variable
2. Si el usuario saluda o hace preguntas generales → Devuelve TODO null
3. Extrae SOLO información que el usuario mencione explícitamente
4. Usa tu conocimiento general para normalizar y completar información cuando sea apropiado

VARIABLES A EXTRAER:
{{VARIABLES_DEFINITION}}

PROCESO DE EXTRACCIÓN:
1. Lee el historial completo de la conversación
2. Identifica si el usuario mencionó información relacionada con cada variable
3. Si mencionó algo, extrae y normaliza el valor
4. Si NO mencionó nada, devuelve null
5. Usa contexto y conocimiento general para mejorar la extracción

NORMALIZACIÓN INTELIGENTE:
- Títulos de libros: "Harry Potter 5" → "Harry Potter y la Orden del Fénix"
- Fechas: "mañana" → fecha específica
- Números: "cinco" → "5"
- Abreviaciones: expande cuando sea obvio
- Usa tu conocimiento del mundo real para completar información

EJEMPLOS GENÉRICOS:

Conversación sobre libros:
Usuario: "Hola"
→ {"titulo": null, "editorial": null, "edicion": null}

Usuario: "Busco Harry Potter 5"
→ {"titulo": "Harry Potter y la Orden del Fénix", "editorial": null, "edicion": null}

Conversación sobre reservas:
Usuario: "Hola"
→ {"fecha": null, "hora": null, "personas": null}

Usuario: "Quiero reservar para mañana a las 8pm para 4 personas"
→ {"fecha": "2026-01-16", "hora": "20:00", "personas": "4"}

Conversación sobre productos:
Usuario: "Buenos días"
→ {"producto": null, "cantidad": null, "color": null}

Usuario: "Quiero 3 remeras rojas"
→ {"producto": "remera", "cantidad": "3", "color": "rojo"}

IMPORTANTE:
- Responde ÚNICAMENTE con JSON válido
- NO agregues explicaciones ni texto adicional
- Sé inteligente: usa contexto y conocimiento general
- Normaliza valores cuando sea apropiado
- Si no estás seguro, devuelve null`;

    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-formateador' },
      { $set: { 'nodes.$.data.config.extractionConfig.systemPrompt': promptUniversal } }
    );
    
    console.log(`✅ Formateador actualizado: ${result.modifiedCount} cambio(s)\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ FORMATEADOR UNIVERSAL CONFIGURADO\n');
    console.log('CARACTERÍSTICAS:');
    console.log('  ✅ Funciona con CUALQUIER estructura de variables');
    console.log('  ✅ Se adapta automáticamente al contexto');
    console.log('  ✅ Usa conocimiento general para normalizar');
    console.log('  ✅ Extrae solo información mencionada explícitamente');
    console.log('  ✅ Devuelve null si el usuario no menciona nada');
    console.log('');
    console.log('CASOS DE USO:');
    console.log('  - Libros (titulo, editorial, edicion)');
    console.log('  - Reservas (fecha, hora, personas)');
    console.log('  - Productos (nombre, cantidad, color)');
    console.log('  - Servicios (tipo, ubicacion, presupuesto)');
    console.log('  - Cualquier otra estructura de datos');
    console.log('');
    console.log('El formateador se adapta automáticamente según las variables');
    console.log('definidas en extractionConfig.variablesToExtract');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateadorUniversal();
