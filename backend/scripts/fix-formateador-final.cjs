require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixFormateadorFinal() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`✅ Flow encontrado: ${flow.nombre}\n`);
    
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'gpt' && node.id === 'gpt-formateador') {
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        if (!node.data.config.extractionConfig) node.data.config.extractionConfig = {};
        
        // PROMPT SIMPLE, CLARO Y EXPLÍCITO
        node.data.config.extractionConfig.systemPrompt = `Extrae datos del historial completo.

VARIABLES:
- titulo: Título del libro
- editorial: Editorial
- edicion: Edición

REGLAS:

1. Usuario MENCIONA el dato → extraer valor exacto
   "scholastic" → editorial: "scholastic"

2. Usuario dice NO SÉ / NO TENGO / NO IMPORTA → extraer "cualquiera"
   "no sé" → "cualquiera"
   "no sé la editorial" → editorial: "cualquiera"
   "no tengo idea" → "cualquiera"
   "no me acuerdo" → "cualquiera"
   "no importa" → "cualquiera"
   "cualquiera" → "cualquiera"
   "la que sea" → "cualquiera"
   "dame opciones" → "cualquiera"

3. Usuario NO menciona nada → extraer null

EJEMPLOS:

Historial:
Usuario: "harry potter 3"
Asistente: "¿Editorial y edición?"
Usuario: "no sé la editorial ni la edición"
→ {"titulo": "harry potter 3", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "harry potter 3"
Asistente: "¿Editorial?"
Usuario: "cualquiera está bien"
→ {"titulo": "harry potter 3", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "harry potter 3"
Asistente: "¿Editorial?"
Usuario: "dame opciones"
→ {"titulo": "harry potter 3", "editorial": "cualquiera", "edicion": "cualquiera"}

Historial:
Usuario: "harry potter 3"
→ {"titulo": "harry potter 3", "editorial": null, "edicion": null}

Historial:
Usuario: "harry potter 3"
Asistente: "¿Editorial?"
Usuario: "scholastic"
→ {"titulo": "harry potter 3", "editorial": "scholastic", "edicion": null}`;

        console.log('✅ Prompt actualizado con casos explícitos de "no sé"');
      }
    }
    
    await flowsCollection.updateOne(
      { _id: FLOW_ID },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ Flow actualizado en MongoDB\n');
    
    console.log('CASOS CUBIERTOS:');
    console.log('- "no sé" → "cualquiera"');
    console.log('- "no tengo idea" → "cualquiera"');
    console.log('- "no me acuerdo" → "cualquiera"');
    console.log('- "no importa" → "cualquiera"');
    console.log('- "cualquiera" → "cualquiera"');
    console.log('- "la que sea" → "cualquiera"');
    console.log('- "dame opciones" → "cualquiera"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateadorFinal();
