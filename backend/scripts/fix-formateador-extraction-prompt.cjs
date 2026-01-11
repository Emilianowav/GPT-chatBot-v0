const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

const EXTRACTION_PROMPT = `Analiza el historial completo de la conversación y extrae las siguientes variables.

REGLAS DE EXTRACCIÓN:

1. TÍTULO:
   - Busca menciones de libros en TODO el historial
   - Normaliza a título oficial (ej: "harry potter 2" → "Harry Potter y la Cámara Secreta")
   - Si no hay mención de libro: null

2. EDITORIAL:
   - Si el usuario dice "cualquiera", "no sé", "no tengo preferencia", "da igual": extraer como "cualquiera"
   - Si menciona una editorial específica: extraer el nombre
   - Si no menciona nada: null

3. EDICIÓN:
   - Si el usuario dice "cualquiera", "no sé", "no tengo preferencia", "da igual": extraer como "cualquiera"
   - Si menciona una edición específica: extraer el nombre
   - Si no menciona nada: null

FORMATO DE SALIDA:
Devuelve SOLO un JSON válido, sin texto adicional:
{
  "titulo": "título normalizado o null",
  "editorial": "nombre editorial o 'cualquiera' o null",
  "edicion": "nombre edición o 'cualquiera' o null"
}

EJEMPLOS:
Usuario: "busco harry potter 2"
Usuario: "cualquiera"
→ {"titulo": "Harry Potter y la Cámara Secreta", "editorial": "cualquiera", "edicion": "cualquiera"}

Usuario: "busco 1984"
Usuario: "editorial Debolsillo"
→ {"titulo": "1984", "editorial": "Debolsillo", "edicion": null}`;

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    const formateadorNode = flow.nodes.find(n => n.data?.config?.tipo === 'formateador');
    
    if (!formateadorNode) {
      console.log('❌ Nodo formateador no encontrado');
      return;
    }
    
    console.log('📝 ANTES:');
    console.log('instruccionesExtraccion:', formateadorNode.data.config.configuracionExtraccion?.instruccionesExtraccion?.substring(0, 100) + '...');
    
    // Actualizar el prompt de extracción
    const result = await flowsCollection.updateOne(
      { 
        _id: new ObjectId(FLOW_ID),
        'nodes.id': formateadorNode.id
      },
      {
        $set: {
          'nodes.$.data.config.configuracionExtraccion.instruccionesExtraccion': EXTRACTION_PROMPT
        }
      }
    );
    
    console.log('\n✅ Prompt de extracción actualizado');
    console.log('📝 NUEVO PROMPT:');
    console.log(EXTRACTION_PROMPT);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

main();
