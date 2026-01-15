require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorPrompt() {
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

    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');

    if (!formateador) {
      console.log('❌ gpt-formateador no encontrado');
      return;
    }

    console.log('🔍 NODO FORMATEADOR ACTUAL:');
    console.log(`   ID: ${formateador.id}`);
    console.log(`   Tipo: ${formateador.data.config.tipo}\n`);

    // Nuevo systemPrompt que devuelve JSON con variables extraídas
    const nuevoSystemPrompt = `Eres un extractor de variables para búsqueda de libros en WooCommerce.

VARIABLES A EXTRAER:
- titulo: Título del libro (string)
- editorial: Editorial del libro (string)
- edicion: Edición o año del libro (string)

INSTRUCCIONES:
1. Extrae SOLO las variables que el usuario mencione explícitamente
2. Si una variable NO está presente, usa null
3. Si el usuario dice "cualquiera" para una variable, extrae "cualquiera" literalmente
4. Respeta errores de ortografía y variaciones

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido. Ejemplo:

{
  "titulo": "Harry Potter 5",
  "editorial": null,
  "edicion": null
}

Si el usuario solo saluda o no menciona ningún libro, responde:
{
  "titulo": null,
  "editorial": null,
  "edicion": null
}`;

    // Actualizar systemPrompt en config y extractionConfig
    formateador.data.config.systemPrompt = nuevoSystemPrompt;
    formateador.data.config.extractionConfig.systemPrompt = nuevoSystemPrompt;

    console.log('🔧 NUEVO SYSTEM PROMPT:');
    console.log(nuevoSystemPrompt);
    console.log('');

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('✅ Prompt del formateador actualizado exitosamente\n');
    console.log('🎯 Ahora el formateador:');
    console.log('   1. Extrae variables del mensaje del usuario');
    console.log('   2. Devuelve JSON con titulo, editorial, edicion');
    console.log('   3. Usa null para variables no mencionadas');
    console.log('   4. Extrae "cualquiera" literalmente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

fixFormateadorPrompt();
