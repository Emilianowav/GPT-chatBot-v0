require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateadorLogica() {
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

    // Actualizar schema para marcar titulo como requerido
    formateador.data.config.extractionConfig.schema.titulo.required = true;
    formateador.data.config.extractionConfig.variables[0].requerido = true;

    // Nuevo systemPrompt con lógica correcta
    const nuevoSystemPrompt = `Eres un extractor de variables para búsqueda de libros en WooCommerce.

VARIABLES A EXTRAER:
- titulo: Título del libro (string) - **OBLIGATORIO**
- editorial: Editorial del libro (string) - OPCIONAL
- edicion: Edición o año del libro (string) - OPCIONAL

CONTEXTO DEL HISTORIAL:
Analiza TODO el historial de la conversación para extraer las variables. El usuario puede haber mencionado información en mensajes anteriores.

REGLA ESPECIAL PARA "CUALQUIERA":
Si el usuario dice "cualquiera", "cualquiera está bien", "no me importa", "da igual", etc.:

1. **Si ya existe un título extraído:**
   → Aplica "cualquiera" SOLO a las variables OPCIONALES que aún sean null (editorial, edicion)

2. **Si NO existe un título:**
   → NO apliques "cualquiera" al título
   → Deja titulo como null para que se pida específicamente

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
Usuario: "Hola"
Asistente: "¿Qué libro buscás?"
Usuario: "cualquiera"

Extracción correcta:
{
  "titulo": null,
  "editorial": null,
  "edicion": null
}
(Porque "cualquiera" NO se aplica al título que es obligatorio)

Historial:
Usuario: "Busco harry potter 5 de salamandra"
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
3. "cualquiera" SOLO se aplica a variables OPCIONALES (editorial, edicion)
4. "cualquiera" NUNCA se aplica al título (es obligatorio)
5. Respeta errores de ortografía

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

    // Actualizar systemPrompt
    formateador.data.config.systemPrompt = nuevoSystemPrompt;
    formateador.data.config.extractionConfig.systemPrompt = nuevoSystemPrompt;

    console.log('🔧 CAMBIOS APLICADOS:');
    console.log('   1. titulo.required = true (OBLIGATORIO)');
    console.log('   2. Prompt actualizado con lógica correcta');
    console.log('');

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('✅ Formateador actualizado exitosamente\n');
    console.log('🎯 Ahora el formateador:');
    console.log('   1. titulo es OBLIGATORIO (nunca "cualquiera")');
    console.log('   2. editorial y edicion son OPCIONALES (pueden ser "cualquiera")');
    console.log('   3. "cualquiera" solo se aplica a variables opcionales que sean null');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

fixFormateadorLogica();
