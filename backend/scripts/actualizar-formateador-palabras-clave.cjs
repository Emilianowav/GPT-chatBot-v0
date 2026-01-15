require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function actualizarFormateadorPalabrasClave() {
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
      console.log('❌ Formateador no encontrado');
      return;
    }

    const nuevoSystemPrompt = `Eres un extractor de variables para búsqueda de libros en WooCommerce.

VARIABLES A EXTRAER:
- titulo: Palabras clave del libro para búsqueda (string) - **OBLIGATORIO**
- editorial: Editorial del libro (string) - OPCIONAL
- edicion: Edición o año del libro (string) - OPCIONAL

CONTEXTO DEL HISTORIAL:
Analiza TODO el historial de la conversación para extraer las variables.

REGLA CRÍTICA PARA TÍTULOS:
Extrae SOLO las palabras clave principales del libro, NO el título completo oficial.
Esto es para que la búsqueda en WooCommerce sea más flexible y encuentre productos.

Ejemplos de extracción de título:

Usuario dice: "harry potter 5"
Título extraído: "Harry Potter 5"
(NO "Harry Potter y la Orden del Fénix" - demasiado específico)

Usuario dice: "busco el quijote"
Título extraído: "Quijote"
(NO "Don Quijote de la Mancha" - demasiado específico)

Usuario dice: "cien años de soledad"
Título extraído: "Cien Años Soledad"
(Palabras clave principales)

Usuario dice: "1984 de orwell"
Título extraído: "1984"
(Palabra clave principal)

REGLA ESPECIAL PARA "CUALQUIERA":
Si el usuario dice "cualquiera", "cualquiera está bien", "no me importa", "da igual", etc.:

1. **Si ya existe un título extraído:**
   → Aplica "cualquiera" SOLO a las variables OPCIONALES que aún sean null (editorial, edicion)

2. **Si NO existe un título:**
   → NO apliques "cualquiera" al título
   → Deja titulo como null para que se pida específicamente

EJEMPLOS COMPLETOS:

Historial:
Usuario: "Busco harry potter 5"
Asistente: "¿De qué editorial y edición?"
Usuario: "cualquiera"

Extracción correcta:
{
  "titulo": "Harry Potter 5",
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

Historial:
Usuario: "Busco el señor de los anillos 2"
Asistente: "¿Editorial?"
Usuario: "cualquiera"

Extracción correcta:
{
  "titulo": "Señor Anillos 2",
  "editorial": "cualquiera",
  "edicion": "cualquiera"
}

INSTRUCCIONES:
1. Extrae variables del HISTORIAL COMPLETO, no solo del último mensaje
2. Para el título: extrae PALABRAS CLAVE, no el título oficial completo
3. Usa mayúsculas correctas pero mantén el título corto y flexible
4. Si una variable ya tiene valor, NO la sobrescribas con null
5. "cualquiera" SOLO se aplica a variables OPCIONALES (editorial, edicion)
6. "cualquiera" NUNCA se aplica al título (es obligatorio)

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

    formateador.data.config.systemPrompt = nuevoSystemPrompt;
    formateador.data.config.extractionConfig.systemPrompt = nuevoSystemPrompt;

    console.log('🔧 NUEVO SYSTEM PROMPT DEL FORMATEADOR:');
    console.log('   - Extrae PALABRAS CLAVE en lugar de títulos completos');
    console.log('   - Búsqueda más flexible en WooCommerce');
    console.log('   - "harry potter 5" → "Harry Potter 5" (no "Harry Potter y la Orden del Fénix")');
    console.log('');

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('✅ Formateador actualizado exitosamente\n');
    console.log('🎯 Ahora el formateador:');
    console.log('   1. Extrae palabras clave principales del libro');
    console.log('   2. NO normaliza a títulos oficiales completos');
    console.log('   3. WooCommerce busca con términos más flexibles');
    console.log('   4. Debería encontrar más productos');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

actualizarFormateadorPalabrasClave();
