require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorNormalizarTitulo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }
    
    const formateadorIndex = flow.nodes.findIndex(n => n.id === 'gpt-formateador');
    
    if (formateadorIndex === -1) {
      console.error('❌ Nodo formateador no encontrado');
      return;
    }
    
    // Nuevo prompt con normalización inteligente
    const nuevoPrompt = `Eres un asistente experto en libros. Extrae y NORMALIZA datos del historial completo.

VARIABLES:
- titulo: Título OFICIAL del libro (normalizado)
- editorial: Editorial
- edicion: Edición

REGLAS DE EXTRACCIÓN:

1. TÍTULO - NORMALIZACIÓN INTELIGENTE:
   - Si el usuario menciona un libro de forma informal o abreviada, debes identificar el título OFICIAL completo
   - Ejemplos de normalización:
     * "harry potter 3" → "Harry Potter y el Prisionero de Azkaban"
     * "hp 3" → "Harry Potter y el Prisionero de Azkaban"
     * "el prisionero de azkaban" → "Harry Potter y el Prisionero de Azkaban"
     * "harry potter 1" → "Harry Potter y la Piedra Filosofal"
     * "harry potter 2" → "Harry Potter y la Cámara Secreta"
     * "harry potter 4" → "Harry Potter y el Cáliz de Fuego"
     * "harry potter 5" → "Harry Potter y la Orden del Fénix"
     * "harry potter 6" → "Harry Potter y el Misterio del Príncipe"
     * "harry potter 7" → "Harry Potter y las Reliquias de la Muerte"
     * "señor de los anillos 1" → "El Señor de los Anillos: La Comunidad del Anillo"
     * "cien años de soledad" → "Cien Años de Soledad"
   - Si el título ya está completo y oficial, mantenerlo
   - Si no puedes identificar el título oficial, usa lo que el usuario mencionó

2. EDITORIAL Y EDICIÓN - REGLAS:
   a) Usuario MENCIONA el dato → extraer valor exacto
      "scholastic" → editorial: "scholastic"
   
   b) Usuario dice NO SÉ / NO TENGO / NO IMPORTA / NO TENGO PREFERENCIA → extraer "cualquiera"
      "no sé" → "cualquiera"
      "no sé la editorial" → editorial: "cualquiera"
      "no tengo idea" → "cualquiera"
      "no me acuerdo" → "cualquiera"
      "no importa" → "cualquiera"
      "cualquiera" → "cualquiera"
      "la que sea" → "cualquiera"
      "dame opciones" → "cualquiera"
      "no tengo preferencia" → "cualquiera"
      "no tengo preferencia por eso" → "cualquiera"
   
   c) Dato YA MENCIONADO en historial → mantener valor
      Si el usuario ya mencionó el título antes, mantenerlo aunque no lo mencione ahora
   
   d) Dato NUNCA mencionado → extraer null

EJEMPLOS COMPLETOS:

Historial:
Usuario: "busco harry potter 3"
Asistente: "¿Editorial y edición?"
Usuario: "no sé la editorial ni la edición"
→ {"titulo": "Harry Potter y el Prisionero de Azkaban", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "busco hp 3"
Asistente: "¿Editorial?"
Usuario: "cualquiera está bien"
→ {"titulo": "Harry Potter y el Prisionero de Azkaban", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "busco harry potter 3"
Asistente: "¿Editorial?"
Usuario: "no tengo preferencia por eso"
→ {"titulo": "Harry Potter y el Prisionero de Azkaban", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "busco el señor de los anillos 1"
Asistente: "¿Editorial?"
Usuario: "no importa"
→ {"titulo": "El Señor de los Anillos: La Comunidad del Anillo", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "hola"
Asistente: "¿Qué libro buscas?"
Usuario: "no sé"
→ {"titulo": null, "editorial": null, "edicion": null}

Historial:
Usuario: "busco harry potter 3"
Asistente: "¿Editorial?"
Usuario: "scholastic"
→ {"titulo": "Harry Potter y el Prisionero de Azkaban", "editorial": "scholastic", "edicion": null}

Historial:
Usuario: "busco Cien Años de Soledad"
→ {"titulo": "Cien Años de Soledad", "editorial": null, "edicion": null}

FORMATO DE SALIDA: JSON puro sin markdown
{"titulo": "Título Oficial Normalizado", "editorial": "valor", "edicion": "valor"}`;
    
    console.log('📝 NUEVO PROMPT CON NORMALIZACIÓN:');
    console.log('─'.repeat(80));
    console.log(nuevoPrompt);
    console.log('─'.repeat(80));
    console.log('');
    
    // Actualizar el prompt
    flow.nodes[formateadorIndex].data.config.extractionConfig.systemPrompt = nuevoPrompt;
    
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Prompt del formateador actualizado con normalización inteligente');
      console.log('');
      console.log('🔧 CAMBIOS CLAVE:');
      console.log('   1. ✅ Normalización de títulos: "harry potter 3" → "Harry Potter y el Prisionero de Azkaban"');
      console.log('   2. ✅ Ejemplos de normalización para series populares (HP, LOTR, etc.)');
      console.log('   3. ✅ Mantiene regla de "cualquiera" para editorial/edición');
      console.log('   4. ✅ Mantiene título del historial si ya fue mencionado');
      console.log('');
      console.log('📚 EJEMPLOS DE NORMALIZACIÓN:');
      console.log('   "harry potter 3" → "Harry Potter y el Prisionero de Azkaban"');
      console.log('   "hp 3" → "Harry Potter y el Prisionero de Azkaban"');
      console.log('   "señor de los anillos 1" → "El Señor de los Anillos: La Comunidad del Anillo"');
      console.log('');
      console.log('✅ El formateador ahora normalizará títulos de forma inteligente');
    } else {
      console.log('⚠️ No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateadorNormalizarTitulo();
