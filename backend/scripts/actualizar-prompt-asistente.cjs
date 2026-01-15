/**
 * Script para Actualizar Prompt del GPT Asistente
 * 
 * OBJETIVO:
 * Agregar al prompt del GPT Asistente la opción de comprar/agregar al carrito
 * cuando muestra productos
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

const NUEVO_PROMPT = `Eres un asistente de ventas de Librería Veo Veo.

INFORMACIÓN DISPONIBLE (NO INVENTES):
Horarios: {{topicos.horarios.descripcion}}
Medios de pago: {{topicos.medios_pago.descripcion}}
Libros de inglés: {{topicos.productos.libros_ingles.descripcion}}
Políticas: {{topicos.politicas.descripcion}}

UBICACIÓN: {{topicos.empresa.ubicacion}}
WHATSAPP: {{topicos.empresa.whatsapp_link}}

PRODUCTOS DE WOOCOMMERCE:
{{woocommerce.productos}}

BÚSQUEDA MÚLTIPLE:
Si el usuario pidió VARIOS libros y WooCommerce solo devolvió ALGUNOS:
- Presenta los que SÍ encontraste
- Indica claramente cuáles NO se encontraron
- NO digas "no dispongo de información" si el producto no está en la lista
- Di "No encontré [título] en nuestro catálogo actual"

REGLAS CRÍTICAS:
- ❌ NO inventes productos que no estén en {{woocommerce.productos}}
- ❌ NO inventes información sobre horarios, medios de pago, políticas
- ✅ USA SOLO la información disponible arriba
- ✅ Si no sabes algo, deriva a: {{topicos.empresa.whatsapp_link}}

FORMATO DE RESPUESTA (si hay productos):
¡Encontré estos libros! 📚

📖 *[Título]*
💰 $[precio]
📦 [Stock]
🔗 [url]

**¿Querés comprarlo?** 🛒
Decime "lo quiero" o "agregar al carrito" y te ayudo con la compra.

Si querés seguir buscando otros libros, solo decime qué estás buscando.

[Si falta algún libro que el usuario pidió]
No encontré [título] en nuestro catálogo actual. Podés consultar disponibilidad en: {{topicos.empresa.whatsapp_link}}

IMPORTANTE:
- Sé conversacional y amigable
- NO inventes información
- Usa emojis con moderación
- **SIEMPRE ofrece la opción de comprar cuando muestres productos**
- Resuelve TODAS las variables {{topicos.*}}`;

async function actualizarPromptAsistente() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('📊 Flujo:', flow.nombre);
    
    // Encontrar GPT Asistente
    const indexAsistente = flow.nodes.findIndex(n => n.id === 'gpt-asistente-ventas');
    
    if (indexAsistente === -1) {
      console.log('❌ GPT Asistente no encontrado');
      return;
    }
    
    const asistente = flow.nodes[indexAsistente];
    
    console.log('\n🔍 Prompt ACTUAL del GPT Asistente:');
    console.log('─'.repeat(80));
    console.log(asistente.data?.config?.systemPrompt?.substring(0, 300) + '...');
    console.log('─'.repeat(80));
    
    // Actualizar prompt
    flow.nodes[indexAsistente].data.config.systemPrompt = NUEVO_PROMPT;
    
    console.log('\n✅ Prompt NUEVO del GPT Asistente:');
    console.log('─'.repeat(80));
    console.log(NUEVO_PROMPT.substring(0, 300) + '...');
    console.log('─'.repeat(80));
    
    // Guardar
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROMPT DEL GPT ASISTENTE ACTUALIZADO');
    console.log('='.repeat(60));
    
    console.log('\n📋 Cambios aplicados:');
    console.log('   1. Agregado: "¿Querés comprarlo? 🛒"');
    console.log('   2. Agregado: "Decime \'lo quiero\' o \'agregar al carrito\'"');
    console.log('   3. Agregado: Opción de seguir buscando');
    console.log('   4. Formato más claro y conversacional');
    
    console.log('\n🧪 Próximo paso:');
    console.log('   1. Limpiar estado: node scripts/limpiar-mi-numero.js');
    console.log('   2. Probar: "Busco Harry Potter 3"');
    console.log('   3. Debería mostrar el libro + opción de comprarlo');
    console.log('   4. Responder: "lo quiero"');
    console.log('   5. Debería activar el flujo de carrito');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
actualizarPromptAsistente()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
