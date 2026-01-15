require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function actualizarFormateadorBusquedaGenerica() {
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
- titulo: Nombre principal del libro o saga (string) - **OBLIGATORIO**
- editorial: Editorial del libro (string) - OPCIONAL
- edicion: Edición o año del libro (string) - OPCIONAL

CONTEXTO DEL HISTORIAL:
Analiza TODO el historial de la conversación para extraer las variables.

REGLA CRÍTICA PARA TÍTULOS:
Extrae SOLO el nombre principal del libro o saga, SIN números de volumen ni detalles específicos.
Esto permite que WooCommerce encuentre todos los productos de la saga y GPT los presente al usuario.

Ejemplos de extracción de título:

Usuario dice: "harry potter 5"
Título extraído: "Harry Potter"
(NO "Harry Potter 5" ni "Harry Potter y la Orden del Fénix")

Usuario dice: "busco el señor de los anillos 2"
Título extraído: "Señor Anillos"
(NO "Señor de los Anillos 2" ni "Las Dos Torres")

Usuario dice: "cien años de soledad"
Título extraído: "Cien Años Soledad"

Usuario dice: "1984 de orwell"
Título extraído: "1984"

Usuario dice: "el quijote"
Título extraído: "Quijote"

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
  "titulo": "Harry Potter",
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
  "titulo": "Señor Anillos",
  "editorial": "cualquiera",
  "edicion": "cualquiera"
}

INSTRUCCIONES:
1. Extrae variables del HISTORIAL COMPLETO, no solo del último mensaje
2. Para el título: extrae SOLO el nombre principal de la saga/libro
3. IGNORA números de volumen en el título (ej: 5, 2, III, etc.)
4. Usa mayúsculas correctas pero mantén el título genérico
5. Si una variable ya tiene valor, NO la sobrescribas con null
6. "cualquiera" SOLO se aplica a variables OPCIONALES (editorial, edicion)
7. "cualquiera" NUNCA se aplica al título (es obligatorio)

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
    console.log('   - Extrae SOLO el nombre principal de la saga/libro');
    console.log('   - IGNORA números de volumen');
    console.log('   - "harry potter 5" → "Harry Potter" (genérico)');
    console.log('   - WooCommerce encuentra todos los productos de la saga');
    console.log('   - GPT presenta opciones al usuario');
    console.log('');

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('✅ Formateador actualizado exitosamente\n');
    console.log('🎯 Ahora el flujo:');
    console.log('   1. Usuario: "harry potter 5"');
    console.log('   2. Formateador extrae: "Harry Potter"');
    console.log('   3. WooCommerce busca: "Harry Potter"');
    console.log('   4. Encuentra: 7 productos de Harry Potter');
    console.log('   5. GPT presenta todos los productos');
    console.log('   6. Usuario elige el que quiere');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

actualizarFormateadorBusquedaGenerica();
