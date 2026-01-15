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
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('📊 FLOW:', flow.nombre);
    console.log('═══════════════════════════════════════\n');
    
    // Buscar nodo formateador
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    if (!formateador) {
      console.log('❌ Nodo formateador no encontrado');
      return;
    }
    
    console.log('🔧 ACTUALIZANDO PROMPT DEL FORMATEADOR:\n');
    
    const nuevoPrompt = `Analiza el historial de la conversación y extrae las variables solicitadas.

REGLAS GENERALES:
- Tolera errores ortográficos en el input del usuario
- Entiende abreviaciones comunes (ej: "hp5" = "Harry Potter 5")
- Normaliza el texto a formato estándar
- Extrae información del historial completo, no solo del último mensaje

REGLA CRÍTICA PARA "CUALQUIERA":
- Si el usuario dice "cualquiera" refiriéndose a una variable opcional (editorial, edicion), 
  debes extraer el valor "cualquiera" para esa variable
- NO devuelvas null si el usuario dijo "cualquiera"
- Ejemplo: Usuario dice "cualquiera" → {"editorial": "cualquiera", "edicion": "cualquiera"}

IMPORTANTE:
- Responde ÚNICAMENTE con un objeto JSON válido
- Si una variable NO fue mencionada por el usuario, usa null
- Si el usuario dijo "cualquiera", usa "cualquiera" como valor
- No inventes información que el usuario no mencionó`;

    console.log('Prompt anterior:');
    console.log(formateador.data.config.extractionConfig.systemPrompt);
    console.log('\n---\n');
    console.log('Prompt nuevo:');
    console.log(nuevoPrompt);
    console.log('\n');
    
    // Actualizar el prompt
    formateador.data.config.extractionConfig.systemPrompt = nuevoPrompt;
    
    // Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Prompt del formateador actualizado correctamente\n');
      console.log('📋 COMPORTAMIENTO ESPERADO:');
      console.log('   Mensaje: "cualquiera"');
      console.log('   Extracción: {"titulo": "Harry Potter y la Orden del Fénix", "editorial": "cualquiera", "edicion": "cualquiera"}');
      console.log('   variables_completas: true ✅');
      console.log('   Router: route-2 → WooCommerce ✅');
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
