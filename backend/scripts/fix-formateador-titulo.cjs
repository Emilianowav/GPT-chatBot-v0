require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorTitulo() {
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
    
    console.log('📝 PROMPT ACTUAL:');
    console.log('─'.repeat(80));
    console.log(flow.nodes[formateadorIndex].data.config.extractionConfig.systemPrompt);
    console.log('─'.repeat(80));
    console.log('');
    
    // Nuevo prompt mejorado
    const nuevoPrompt = `Extrae datos del historial completo.

VARIABLES:
- titulo: Título del libro
- editorial: Editorial
- edicion: Edición

REGLAS:

1. Usuario MENCIONA el dato → extraer valor exacto
   "scholastic" → editorial: "scholastic"
   "harry potter 3" → titulo: "harry potter 3"

2. Usuario dice NO SÉ / NO TENGO / NO IMPORTA → extraer "cualquiera"
   "no sé" → "cualquiera"
   "no sé la editorial" → editorial: "cualquiera"
   "no tengo idea" → "cualquiera"
   "no me acuerdo" → "cualquiera"
   "no importa" → "cualquiera"
   "cualquiera" → "cualquiera"
   "la que sea" → "cualquiera"
   "dame opciones" → "cualquiera"
   "no tengo preferencia" → "cualquiera"

3. Dato YA MENCIONADO en historial → mantener valor
   Si el usuario ya mencionó el título antes, mantenerlo aunque no lo mencione ahora.

4. Dato NUNCA mencionado → extraer null

EJEMPLOS:

Historial:
Usuario: "busco harry potter 3"
Asistente: "¿Editorial y edición?"
Usuario: "no sé la editorial ni la edición"
→ {"titulo": "harry potter 3", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "busco harry potter 3"
Asistente: "¿Editorial?"
Usuario: "cualquiera está bien"
→ {"titulo": "harry potter 3", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "busco harry potter 3"
Asistente: "¿Editorial?"
Usuario: "no tengo preferencia por eso"
→ {"titulo": "harry potter 3", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "hola"
Asistente: "¿Qué libro buscas?"
Usuario: "no sé"
→ {"titulo": null, "editorial": null, "edicion": null}

Historial:
Usuario: "busco harry potter 3"
Asistente: "¿Editorial?"
Usuario: "scholastic"
→ {"titulo": "harry potter 3", "editorial": "scholastic", "edicion": null}

FORMATO DE SALIDA: JSON puro sin markdown
{"titulo": "valor", "editorial": "valor", "edicion": "valor"}`;
    
    console.log('📝 NUEVO PROMPT:');
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
      console.log('✅ Prompt del formateador actualizado exitosamente');
      console.log('');
      console.log('🔧 CAMBIOS CLAVE:');
      console.log('   1. Agregada regla: "Dato YA MENCIONADO en historial → mantener valor"');
      console.log('   2. Agregado ejemplo: "no tengo preferencia por eso" → mantiene título');
      console.log('   3. Clarificado: "no tengo preferencia" → "cualquiera"');
      console.log('');
      console.log('✅ Ahora el formateador mantendrá el título del historial');
    } else {
      console.log('⚠️ No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateadorTitulo();
