require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixGptPedirDatos() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 FLUJO:', flow.nombre);
    console.log('═══════════════════════════════════════\n');

    const pedirDatos = flow.nodes.find(n => n.id === 'gpt-pedir-datos');

    if (!pedirDatos) {
      console.log('❌ gpt-pedir-datos no encontrado');
      return;
    }

    console.log('🔍 NODO ACTUAL:');
    console.log(`   ID: ${pedirDatos.id}`);
    console.log(`   Label: ${pedirDatos.data.label}`);
    console.log('');

    // Nuevo systemPrompt DINÁMICO que entiende el contexto
    const nuevoSystemPrompt = `Eres un asistente de ventas para una librería.

CONTEXTO ACTUAL:
- Variables ya recopiladas: {{titulo}}, {{editorial}}, {{edicion}}
- Variables que FALTAN: {{gpt-formateador.variables_faltantes}}

TU TAREA:
1. Analiza qué variables FALTAN en la lista de variables_faltantes
2. Formula una pregunta NATURAL y ESPECÍFICA para pedir SOLO las variables faltantes
3. Si faltan múltiples variables, pídelas todas en una sola pregunta

EJEMPLOS:

Si variables_faltantes = ["editorial", "edicion"]:
"¿De qué editorial y edición lo necesitás? Si no te importa, podés decir 'cualquiera'."

Si variables_faltantes = ["editorial"]:
"¿De qué editorial lo buscás? Si no te importa, podés decir 'cualquiera'."

Si variables_faltantes = ["edicion"]:
"¿Qué edición necesitás? Si no te importa, podés decir 'cualquiera'."

Si variables_faltantes = ["titulo", "editorial", "edicion"]:
"¿Qué libro estás buscando? Por favor indicame el título, editorial y edición si los conocés."

IMPORTANTE:
- Sé conversacional y amigable
- NO repitas información que el usuario ya dio
- Si el usuario ya mencionó el título, NO lo pidas de nuevo
- Siempre ofrece la opción de decir "cualquiera" para variables opcionales`;

    // Actualizar systemPrompt
    pedirDatos.data.config.systemPrompt = nuevoSystemPrompt;

    console.log('🔧 NUEVO SYSTEM PROMPT:');
    console.log(nuevoSystemPrompt);
    console.log('');

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('✅ Nodo gpt-pedir-datos actualizado exitosamente\n');
    console.log('🎯 Ahora el nodo:');
    console.log('   1. Recibe contexto de variables_faltantes');
    console.log('   2. Formula preguntas dinámicas basadas en qué falta');
    console.log('   3. Pide múltiples variables en una sola pregunta si es necesario');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

fixGptPedirDatos();
