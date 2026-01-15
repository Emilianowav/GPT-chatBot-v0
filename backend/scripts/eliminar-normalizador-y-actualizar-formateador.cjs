require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function eliminarNormalizadorYActualizarFormateador() {
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

    // 1. Eliminar nodo gpt-normalizador-titulo
    const indexNormalizador = flow.nodes.findIndex(n => n.id === 'gpt-normalizador-titulo');
    if (indexNormalizador !== -1) {
      flow.nodes.splice(indexNormalizador, 1);
      console.log('✅ Nodo gpt-normalizador-titulo eliminado\n');
    }

    // 2. Eliminar edge gpt-normalizador-titulo → woocommerce
    const indexEdgeNormWoo = flow.edges.findIndex(e => 
      e.source === 'gpt-normalizador-titulo' && e.target === 'woocommerce'
    );
    if (indexEdgeNormWoo !== -1) {
      flow.edges.splice(indexEdgeNormWoo, 1);
      console.log('✅ Edge gpt-normalizador-titulo → woocommerce eliminado\n');
    }

    // 3. Restaurar edge router → woocommerce
    const edgeRouterWoo = flow.edges.find(e => 
      e.source === 'router' && e.id === 'reactflow__edge-routerroute-2-woocommerce'
    );

    if (edgeRouterWoo) {
      edgeRouterWoo.target = 'woocommerce';
      console.log('✅ Edge router → woocommerce restaurado\n');
    }

    // 4. Actualizar WooCommerce para usar {{titulo}} de nuevo
    const woocommerce = flow.nodes.find(n => n.id === 'woocommerce');
    if (woocommerce) {
      woocommerce.data.config.params.search = '{{titulo}}';
      console.log('✅ WooCommerce actualizado para usar {{titulo}}\n');
    }

    // 5. Actualizar prompt del formateador con instrucciones de normalización
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    if (!formateador) {
      console.log('❌ Formateador no encontrado');
      return;
    }

    const nuevoSystemPrompt = `Eres un extractor de variables para búsqueda de libros en WooCommerce.

VARIABLES A EXTRAER:
- titulo: Título del libro (string) - **OBLIGATORIO**
- editorial: Editorial del libro (string) - OPCIONAL
- edicion: Edición o año del libro (string) - OPCIONAL

CONTEXTO DEL HISTORIAL:
Analiza TODO el historial de la conversación para extraer las variables.

REGLA ESPECIAL PARA TÍTULOS:
Si el usuario menciona un título informal o abreviado, conviértelo al título OFICIAL y COMPLETO.

Ejemplos de normalización de títulos:
- "harry potter 5" → "Harry Potter y la Orden del Fénix"
- "hp 3" → "Harry Potter y el Prisionero de Azkaban"
- "el quijote" → "Don Quijote de la Mancha"
- "cien años de soledad" → "Cien Años de Soledad"
- "1984" → "1984"

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
  "titulo": "Harry Potter y la Orden del Fénix",
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

INSTRUCCIONES:
1. Extrae variables del HISTORIAL COMPLETO, no solo del último mensaje
2. NORMALIZA el título a su versión oficial y completa
3. Si una variable ya tiene valor, NO la sobrescribas con null
4. "cualquiera" SOLO se aplica a variables OPCIONALES (editorial, edicion)
5. "cualquiera" NUNCA se aplica al título (es obligatorio)
6. Respeta errores de ortografía en el input del usuario, pero devuelve el título normalizado correctamente

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
    console.log('   - Extrae variables del historial');
    console.log('   - NORMALIZA títulos informales a títulos oficiales');
    console.log('   - Aplica "cualquiera" solo a variables opcionales');
    console.log('');

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );

    console.log('✅ Flujo actualizado exitosamente\n');
    console.log('🎯 Flujo simplificado:');
    console.log('   router → woocommerce');
    console.log('');
    console.log('📝 El formateador ahora:');
    console.log('   1. Extrae variables del historial');
    console.log('   2. Normaliza títulos (ej: "harry potter 5" → "Harry Potter y la Orden del Fénix")');
    console.log('   3. Aplica "cualquiera" a variables opcionales');
    console.log('   4. WooCommerce recibe el título normalizado directamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

eliminarNormalizadorYActualizarFormateador();
