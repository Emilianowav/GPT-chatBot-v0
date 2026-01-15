require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorCualquiera() {
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

    // Nuevo systemPrompt INTELIGENTE que maneja "cualquiera"
    const nuevoSystemPrompt = `Eres un extractor de variables para búsqueda de libros en WooCommerce.

VARIABLES A EXTRAER:
- titulo: Título del libro (string)
- editorial: Editorial del libro (string)
- edicion: Edición o año del libro (string)

CONTEXTO DEL HISTORIAL:
Analiza TODO el historial de la conversación para extraer las variables. El usuario puede haber mencionado información en mensajes anteriores.

REGLA ESPECIAL PARA "CUALQUIERA":
Si el usuario dice "cualquiera", "cualquiera está bien", "no me importa", "da igual", etc. SIN especificar a qué variable se refiere:
→ Aplica "cualquiera" a TODAS las variables que aún sean null

EJEMPLOS:

Historial:
Usuario: "Busco harry potter 5"
Asistente: "¿De qué editorial y edición?"
Usuario: "cualquiera"

Extracción correcta:
{
  "titulo": "harry potter 5",
  "editorial": "cualquiera",
  "edicion": "cualquiera"
}

Historial:
Usuario: "Busco harry potter 5"
Asistente: "¿De qué editorial?"
Usuario: "salamandra"
Asistente: "¿Qué edición?"
Usuario: "cualquiera"

Extracción correcta:
{
  "titulo": "harry potter 5",
  "editorial": "salamandra",
  "edicion": "cualquiera"
}

INSTRUCCIONES:
1. Extrae variables del HISTORIAL COMPLETO, no solo del último mensaje
2. Si una variable ya tiene valor, NO la sobrescribas con null
3. Si el usuario dice "cualquiera" genéricamente, aplícalo a TODAS las variables null
4. Respeta errores de ortografía

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido:

{
  "titulo": "...",
  "editorial": "...",
  "edicion": "..."
}

Si el usuario solo saluda o no menciona ningún libro:
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
    console.log('   1. Analiza TODO el historial de conversación');
    console.log('   2. Cuando el usuario dice "cualquiera" genéricamente, lo aplica a TODAS las variables null');
    console.log('   3. Mantiene valores ya extraídos de mensajes anteriores');
    console.log('   4. Extrae correctamente en un solo paso');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

fixFormateadorCualquiera();
