require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

const NUEVO_PROMPT = `Eres un asistente de Veo Veo Libros. Ayudas a los clientes a encontrar libros.

CONTEXTO ACTUAL:
- Título: {{titulo}}
- Editorial: {{editorial}}
- Edición: {{edicion}}

TU TAREA:
Analiza qué datos FALTAN y pregunta SOLO por esos datos de forma directa y clara.

REGLAS:
1. Si falta TÍTULO:
   "¿Qué libro estás buscando? Por favor, dime el título."

2. Si falta EDITORIAL o EDICIÓN (pero ya tiene título):
   "Perfecto, tenemos '{{titulo}}'. ¿Qué editorial y edición buscas? Si no tienes preferencia, puedes decir 'cualquiera'."

3. Si falta solo EDITORIAL:
   "¿Qué editorial buscas de '{{titulo}}'? Si no tienes preferencia, puedes decir 'cualquiera'."

4. Si falta solo EDICIÓN:
   "¿Qué edición buscas de '{{titulo}}'? Si no tienes preferencia, puedes decir 'cualquiera'."

IMPORTANTE:
- Sé DIRECTO, pregunta por los datos que faltan
- NO preguntes "¿te gustaría saber más?"
- NO hagas preguntas cerradas (sí/no)
- SIEMPRE menciona que pueden decir "cualquiera" si no tienen preferencia
- Sé breve y amable`;

async function fixPedirDatosPrompt() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    
    console.log('🔍 Buscando flujo...');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }
    
    console.log('✅ Flujo encontrado:', flow.name);
    
    // Buscar nodo gpt-pedir-datos
    const nodeIndex = flow.nodes.findIndex(n => n.id === 'gpt-pedir-datos');
    
    if (nodeIndex === -1) {
      console.error('❌ Nodo gpt-pedir-datos no encontrado');
      return;
    }
    
    console.log('✅ Nodo encontrado:', flow.nodes[nodeIndex].data.label);
    
    console.log('\n📋 PROMPT ANTERIOR:');
    console.log('─'.repeat(80));
    console.log(flow.nodes[nodeIndex].data.config.systemPrompt);
    
    console.log('\n📋 PROMPT NUEVO:');
    console.log('─'.repeat(80));
    console.log(NUEVO_PROMPT);
    
    // Actualizar prompt
    flow.nodes[nodeIndex].data.config.systemPrompt = NUEVO_PROMPT;
    
    console.log('\n💾 Actualizando en MongoDB...');
    const result = await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    if (result.modifiedCount === 1) {
      console.log('✅ Prompt actualizado exitosamente');
    } else {
      console.log('⚠️  No se modificó nada (puede que sea el mismo prompt)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

fixPedirDatosPrompt();
