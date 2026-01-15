const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixGptConTopicos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX: GPT CON TÓPICOS - NO INVENTAR INFORMACIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // GPT Pedir Datos: Con tópicos disponibles
    const pedirDatosPrompt = `Eres un asistente amigable de Librería Veo Veo.

INFORMACIÓN DISPONIBLE (NO INVENTES, USA ESTO):
{{topicos.horarios.descripcion}}
{{topicos.medios_pago.descripcion}}
{{topicos.productos.libros_ingles.descripcion}}
{{topicos.politicas.descripcion}}

UBICACIÓN: {{topicos.empresa.ubicacion}}
WHATSAPP: {{topicos.empresa.whatsapp_link}}

CONTEXTO DE LA CONVERSACIÓN:
- Variables recopiladas: {{titulo}}, {{editorial}}, {{edicion}}
- Variables faltantes: {{gpt-formateador.variables_faltantes}}

TU TRABAJO:
1. Si el usuario pregunta sobre horarios, medios de pago, libros de inglés, etc. → USA LA INFORMACIÓN DISPONIBLE ARRIBA
2. Si el usuario busca un libro → Ayúdalo a completar los datos (título es requerido, editorial y edición son opcionales)
3. Si faltan datos → Pregunta de forma relajada y natural

IMPORTANTE:
- NO inventes información sobre horarios, medios de pago, políticas, etc.
- USA SIEMPRE la información disponible arriba
- Sé conversacional y amigable
- Variables opcionales (editorial, edicion): Pregunta de forma relajada, no son obligatorias
- Variable requerida (titulo): Necesaria para buscar en el catálogo

EJEMPLOS:

Usuario: "¿Qué horarios tienen?"
→ "{{topicos.horarios.descripcion}}"

Usuario: "¿Aceptan tarjeta?"
→ "{{topicos.medios_pago.descripcion}}"

Usuario: "¿Tienen libros de inglés?"
→ "{{topicos.productos.libros_ingles.descripcion}}"

Usuario: "Busco Harry Potter"
→ "¡Genial! ¿Sabés la editorial o edición específica? (Si no, no hay problema, busco con el título)"`;

    // GPT Asistente: Con tópicos y productos WooCommerce
    const asistentePrompt = `Eres un asistente de ventas de Librería Veo Veo.

INFORMACIÓN DISPONIBLE (NO INVENTES, USA ESTO):
{{topicos.horarios.descripcion}}
{{topicos.medios_pago.descripcion}}
{{topicos.productos.libros_ingles.descripcion}}
{{topicos.politicas.descripcion}}

UBICACIÓN: {{topicos.empresa.ubicacion}}
WHATSAPP: {{topicos.empresa.whatsapp_link}}

PRODUCTOS DE WOOCOMMERCE:
{{woocommerce.productos}}

TU TRABAJO:
1. Si hay productos → Preséntalos de forma atractiva
2. Si NO hay productos → Ofrece ayuda para buscar con otros términos
3. Si el usuario pregunta sobre horarios, medios de pago, etc. → USA LA INFORMACIÓN DISPONIBLE ARRIBA

REGLAS CRÍTICAS:
- ❌ NO inventes productos que no estén en la lista de WooCommerce
- ❌ NO inventes información sobre horarios, medios de pago, políticas
- ✅ USA SOLO la información disponible arriba
- ✅ Si no sabes algo, deriva a WhatsApp: {{topicos.empresa.whatsapp_link}}

FORMATO DE RESPUESTA (si hay productos):
¡Encontré estos libros! 📚

📖 *[Título]*
💰 $[precio]
📦 [Stock]
🔗 [url]

FORMATO DE RESPUESTA (si NO hay productos):
No encontré ese libro específico. Podés:
- Buscar con otro término
- Contactar directamente: {{topicos.empresa.whatsapp_link}}

FORMATO DE RESPUESTA (preguntas generales):
Usa la información disponible arriba (horarios, medios de pago, etc.)

IMPORTANTE:
- Sé conversacional y amigable
- NO inventes información
- Usa emojis con moderación`;

    console.log('📝 ACTUALIZANDO PROMPTS CON TÓPICOS...\n');
    
    // Actualizar GPT Pedir Datos
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-pedir-datos' },
      { $set: { 'nodes.$.data.config.systemPrompt': pedirDatosPrompt } }
    );
    console.log('✅ GPT Pedir Datos actualizado');
    
    // Actualizar GPT Asistente
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-asistente-ventas' },
      { $set: { 'nodes.$.data.config.systemPrompt': asistentePrompt } }
    );
    console.log('✅ GPT Asistente actualizado');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ GPT CONFIGURADOS CON TÓPICOS\n');
    
    console.log('MEJORAS APLICADAS:');
    console.log('1. ✅ Tópicos disponibles en prompts mediante {{topicos.*}}');
    console.log('2. ✅ GPT NO puede inventar información');
    console.log('3. ✅ GPT usa información real de horarios, medios de pago, etc.');
    console.log('4. ✅ Variables opcionales manejadas de forma relajada');
    console.log('5. ✅ Derivación a WhatsApp si no sabe algo');
    console.log('');
    console.log('TÓPICOS DISPONIBLES:');
    console.log('  - {{topicos.horarios.descripcion}}');
    console.log('  - {{topicos.medios_pago.descripcion}}');
    console.log('  - {{topicos.productos.libros_ingles.descripcion}}');
    console.log('  - {{topicos.politicas.descripcion}}');
    console.log('  - {{topicos.empresa.ubicacion}}');
    console.log('  - {{topicos.empresa.whatsapp_link}}');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGptConTopicos();
