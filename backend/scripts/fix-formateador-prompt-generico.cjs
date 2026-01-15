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
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    console.log('🔧 CREANDO PROMPT GENÉRICO DEL FORMATEADOR:\n');
    
    // Prompt 100% genérico que se adapta a CUALQUIER tipo de negocio
    const promptGenerico = `Analiza el historial de la conversación y extrae las variables solicitadas.

INSTRUCCIONES:
- Extrae ÚNICAMENTE la información que el usuario mencionó explícitamente
- Tolera errores ortográficos y variaciones en la escritura
- Si una variable NO fue mencionada por el usuario, devuelve null
- Si el usuario dice "cualquiera" o "no importa" para una variable opcional, usa el valor "cualquiera"
- Responde ÚNICAMENTE con un objeto JSON válido
- NO inventes información que el usuario no proporcionó

FORMATO DE RESPUESTA:
Devuelve un objeto JSON con las siguientes claves:
${formateador.data.config.extractionConfig.variables.map(v => 
  `- "${v.nombre}": ${v.tipo} ${v.requerido ? '(REQUERIDO)' : '(OPCIONAL)'} - ${v.descripcion || 'Sin descripción'}`
).join('\n')}

EJEMPLOS DE RESPUESTA:
${JSON.stringify(
  formateador.data.config.extractionConfig.variables.reduce((acc, v) => {
    acc[v.nombre] = v.requerido ? `"valor de ${v.nombre}"` : null;
    return acc;
  }, {}),
  null,
  2
)}`;

    console.log('Prompt genérico:');
    console.log('═══════════════════════════════════════');
    console.log(promptGenerico);
    console.log('═══════════════════════════════════════\n');
    
    formateador.data.config.extractionConfig.systemPrompt = promptGenerico;
    
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Prompt del formateador actualizado correctamente\n');
      console.log('📋 CARACTERÍSTICAS DEL NUEVO PROMPT:');
      console.log('   ✅ 100% genérico - NO menciona libros, productos específicos, etc.');
      console.log('   ✅ Se adapta automáticamente a las variables configuradas');
      console.log('   ✅ Funciona para CUALQUIER tipo de negocio (librería, restaurante, hotel, etc.)');
      console.log('   ✅ El frontend controla qué variables extraer\n');
      console.log('💡 PRÓXIMO PASO:');
      console.log('   Idealmente, este prompt debería generarse DINÁMICAMENTE en el backend');
      console.log('   basado en extractionConfig.variables, no guardarse en MongoDB');
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
