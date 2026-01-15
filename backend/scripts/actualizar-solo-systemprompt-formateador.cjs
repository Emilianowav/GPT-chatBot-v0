require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function actualizarSoloSystemPrompt() {
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

    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    if (!formateador) {
      console.log('❌ Formateador no encontrado');
      return;
    }

    console.log('📊 ACTUALIZANDO SOLO EL SYSTEMPROMPT');
    console.log('═══════════════════════════════════════\n');
    console.log('✅ Respetando schema del frontend');
    console.log('✅ Solo modificando systemPrompt\n');

    const nuevoSystemPrompt = `Eres un extractor de variables para búsqueda de libros en WooCommerce.

VARIABLES A EXTRAER:
- titulo: Título del libro (string) - **OBLIGATORIO**
- editorial: Editorial del libro (string) - OPCIONAL
- edicion: Edición o año del libro (string) - OPCIONAL

CONTEXTO DEL HISTORIAL:
Analiza TODO el historial de la conversación para extraer las variables.

REGLA CRÍTICA PARA TÍTULOS:
Debes normalizar el título del usuario al título REAL que existe en WooCommerce.
WooCommerce normaliza automáticamente mayúsculas/minúsculas y tildes, así que NO te preocupes por eso.

EJEMPLOS DE PRODUCTOS REALES EN WOOCOMMERCE (VeoVeo):
- "HARRY POTTER Y LA ORDEN DEL FENIX"
- "HARRY POTTER 03 PRISIONERO DE AZKABAN"
- "HARRY POTTER 01 LA PIEDRA FILOSOFAL"
- "HARRY POTTER 04 EL CALIZ DE FUEGO"
- "HARRY POTTER Y LA CAMARA SECRETA"
- "HARRY POTTER Y EL MISTERIO DEL PRINCIPE"
- "HARRY POTTER VII Y LAS RELIQUIAS DE LA MUERTE"

NORMALIZACIÓN INTELIGENTE:

Usuario dice: "harry potter 5"
→ Título extraído: "Harry Potter y la Orden del Fenix"
(Entiendes que "5" = quinto libro = "Orden del Fenix")

Usuario dice: "hp 5"
→ Título extraído: "Harry Potter y la Orden del Fenix"
(Entiendes que "hp" = "Harry Potter")

Usuario dice: "arry poter 5" (error ortográfico)
→ Título extraído: "Harry Potter y la Orden del Fenix"
(Toleras errores ortográficos)

Usuario dice: "señor de los anillos 2"
→ Título extraído: "Las Dos Torres"
(Entiendes que "2" = segundo libro)

Usuario dice: "1984"
→ Título extraído: "1984"
(Ya está completo)

Usuario dice: "cien años de soledad"
→ Título extraído: "Cien Años de Soledad"
(Normalizas mayúsculas)

IMPORTANTE SOBRE TILDES:
- WooCommerce normaliza tildes automáticamente
- Puedes usar "Fénix" o "Fenix", ambos funcionan
- Puedes usar "Edición" o "Edicion", ambos funcionan
- NO te preocupes por tildes, WooCommerce los maneja

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
  "titulo": "Harry Potter y la Orden del Fenix",
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
Usuario: "Busco hp 3"
Asistente: "¿Editorial?"
Usuario: "cualquiera"

Extracción correcta:
{
  "titulo": "Harry Potter 03 Prisionero de Azkaban",
  "editorial": "cualquiera",
  "edicion": "cualquiera"
}

INSTRUCCIONES:
1. Extrae variables del HISTORIAL COMPLETO, no solo del último mensaje
2. Para el título: normaliza inteligentemente al título real de WooCommerce
3. Tolera errores ortográficos y abreviaciones
4. Entiende números de volumen (5 = quinto libro de la saga)
5. Si una variable ya tiene valor, NO la sobrescribas con null
6. "cualquiera" SOLO se aplica a variables OPCIONALES (editorial, edicion)
7. "cualquiera" NUNCA se aplica al título (es obligatorio)
8. NO te preocupes por tildes, WooCommerce los normaliza automáticamente

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

    // Actualizar SOLO el systemPrompt, respetando el schema
    formateador.data.config.extractionConfig.systemPrompt = nuevoSystemPrompt;
    formateador.data.config.systemPrompt = nuevoSystemPrompt;

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('✅ SystemPrompt actualizado exitosamente\n');
    console.log('🎯 Ahora el formateador:');
    console.log('   1. Normaliza "harry potter 5" → "Harry Potter y la Orden del Fenix"');
    console.log('   2. Tolera errores ortográficos');
    console.log('   3. Entiende abreviaciones (hp = Harry Potter)');
    console.log('   4. WooCommerce normaliza tildes automáticamente');
    console.log('   5. Respeta el schema del frontend (titulo required, editorial/edicion optional)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

actualizarSoloSystemPrompt();
