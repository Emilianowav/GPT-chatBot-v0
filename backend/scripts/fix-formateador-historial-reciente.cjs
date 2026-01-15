const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    // NUEVO PROMPT: Priorizar mensajes recientes
    const nuevoPrompt = `Analiza la conversación y extrae las siguientes variables.

IMPORTANTE: Prioriza los mensajes MÁS RECIENTES del usuario. Si el usuario menciona un nuevo libro, ignora los anteriores.

REGLAS DE EXTRACCIÓN:

1. TÍTULO:
   - Busca el libro mencionado en los ÚLTIMOS 5 mensajes del usuario
   - Si el usuario cambió de tema, usa el nuevo libro mencionado
   - Normaliza a título oficial (ej: "harry potter 2" → "Harry Potter y la Cámara Secreta")
   - Si no hay mención de libro en los últimos mensajes: null

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

Conversación:
Usuario: "busco harry potter 2"
Asistente: "¿Qué editorial?"
Usuario: "cualquiera"
→ {"titulo": "Harry Potter y la Cámara Secreta", "editorial": "cualquiera", "edicion": "cualquiera"}

Conversación (cambio de tema):
Usuario: "busco harry potter 2"
Asistente: "¿Qué editorial?"
Usuario: "La soledad"
Asistente: "¿Qué editorial buscas de La Soledad?"
Usuario: "cualquiera"
→ {"titulo": "La Soledad", "editorial": "cualquiera", "edicion": "cualquiera"}`;

    const result = await flowsCollection.updateOne(
      { 
        _id: new ObjectId(FLOW_ID),
        'nodes.id': 'gpt-formateador'
      },
      {
        $set: {
          'nodes.$.data.config.extractionConfig.systemPrompt': nuevoPrompt
        }
      }
    );
    
    console.log('✅ Prompt del formateador actualizado');
    console.log(`   Modificados: ${result.modifiedCount}`);
    console.log('\n📝 CAMBIO CLAVE:');
    console.log('   - Antes: "Busca en TODO el historial"');
    console.log('   - Ahora: "Prioriza los ÚLTIMOS 5 mensajes del usuario"');
    console.log('\n💡 Esto evita que extraiga libros viejos cuando el usuario cambia de tema');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
