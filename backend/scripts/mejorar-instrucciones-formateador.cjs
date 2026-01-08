const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function mejorarInstruccionesFormateador() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    const gptFormateadorNode = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    if (!gptFormateadorNode) {
      console.log('❌ Nodo gpt-formateador no encontrado');
      return;
    }

    console.log('📝 Actualizando instrucciones del formateador...\n');

    // INSTRUCCIONES MEJORADAS
    gptFormateadorNode.data.config.configuracionExtraccion.instruccionesExtraccion = `Analiza la conversación completa entre el usuario y el asistente de la librería.
Tu objetivo es extraer la información MÁS ESPECÍFICA Y COMPLETA sobre el libro que el usuario está buscando.

REGLAS IMPORTANTES:

1. TÍTULO DEL LIBRO:
   - Si el asistente menciona el título completo del libro (ej: "Harry Potter y el prisionero de Azkaban"), usa ESE título completo
   - Si el usuario dice "el tercero de harry potter" y el asistente responde con el título completo, usa el título completo del asistente
   - Si solo hay información parcial (ej: "Harry Potter 3"), usa esa información parcial
   - PRIORIZA el título más específico y completo que aparezca en TODA la conversación

2. EDITORIAL:
   - Si el usuario menciona una editorial específica, extráela
   - Si el usuario dice "cualquiera", "me da igual", "no importa", etc., este campo debe ser null
   - Si no se menciona editorial, este campo debe ser null

3. EDICIÓN:
   - Si el usuario menciona una edición específica, extráela
   - Si el usuario dice "cualquiera", "me da igual", "no importa", etc., este campo debe ser null
   - Si no se menciona edición, este campo debe ser null

EJEMPLOS:

Conversación 1:
Usuario: Quiero el tercero de harry potter
Asistente: ¿Prefieres alguna editorial en específico?
Usuario: Me da igual
Asistente: Ok, te busco opciones de "Harry Potter y el prisionero de Azkaban"

Extracción correcta:
{
  "titulo_libro": "Harry Potter y el prisionero de Azkaban",
  "editorial": null,
  "edicion": null
}

Conversación 2:
Usuario: Busco El Código Da Vinci de editorial Planeta
Asistente: Perfecto, te busco ese libro

Extracción correcta:
{
  "titulo_libro": "El Código Da Vinci",
  "editorial": "Planeta",
  "edicion": null
}

IMPORTANTE: Analiza TODA la conversación (usuario + asistente) para encontrar la información más completa y específica.`;

    console.log('🔧 Actualizando en MongoDB...');

    const resultado = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          'nodes': flow.nodes
        } 
      }
    );

    if (resultado.modifiedCount > 0) {
      console.log('\n✅ INSTRUCCIONES ACTUALIZADAS EXITOSAMENTE\n');
      console.log('📋 MEJORAS APLICADAS:');
      console.log('   ✅ Analiza conversación completa (usuario + asistente)');
      console.log('   ✅ Prioriza título más específico y completo');
      console.log('   ✅ Usa título del asistente si es más completo');
      console.log('   ✅ Detecta "me da igual" como null');
      console.log('   ✅ Incluye ejemplos claros en las instrucciones');
      console.log('\n🎯 PRÓXIMO PASO:');
      console.log('   Limpia estado: node scripts/limpiar-mi-numero.js');
      console.log('   Prueba: "Quiero el tercero de harry potter"');
      console.log('   Espera que extraiga: "Harry Potter y el prisionero de Azkaban"');
    } else {
      console.log('\n⚠️  No se realizaron cambios');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

mejorarInstruccionesFormateador();
