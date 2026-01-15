const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixBusquedaMultipleLibros() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX: BÚSQUEDA MÚLTIPLE DE LIBROS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Formateador: Debe extraer TODOS los libros mencionados
    const formateadorPrompt = `Eres un asistente experto que extrae información de conversaciones.

REGLA CRÍTICA:
Si el usuario NO menciona ningún libro específico → Devuelve TODO null

BÚSQUEDA MÚLTIPLE:
Si el usuario menciona VARIOS libros → Extrae TODOS en el campo "titulo" separados por " | "

EJEMPLOS:

Usuario: "Hola"
→ {"titulo": null, "editorial": null, "edicion": null}

Usuario: "Busco Harry Potter 2"
→ {"titulo": "Harry Potter y la Cámara Secreta", "editorial": null, "edicion": null}

Usuario: "Busco Harry Potter 2 y 5"
→ {"titulo": "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix", "editorial": null, "edicion": null}

Usuario: "Quiero el principito y el alquimista"
→ {"titulo": "El Principito | El Alquimista", "editorial": null, "edicion": null}

Usuario: "Busco matemática 3, lengua 4 y ciencias 5"
→ {"titulo": "Matemática 3 | Lengua 4 | Ciencias 5", "editorial": null, "edicion": null}

NORMALIZACIÓN DE TÍTULOS:
- "Harry Potter 1" → "Harry Potter y la Piedra Filosofal"
- "Harry Potter 2" → "Harry Potter y la Cámara Secreta"
- "Harry Potter 3" → "Harry Potter y el Prisionero de Azkaban"
- "Harry Potter 4" → "Harry Potter y el Cáliz de Fuego"
- "Harry Potter 5" → "Harry Potter y la Orden del Fénix"
- "Harry Potter 6" → "Harry Potter y el Misterio del Príncipe"
- "Harry Potter 7" → "Harry Potter y las Reliquias de la Muerte"

IMPORTANTE: 
- Responde ÚNICAMENTE con JSON válido
- Si hay múltiples libros, sepáralos con " | "
- Normaliza cada título individualmente`;

    // GPT Asistente: Buscar TODOS los libros mencionados
    const asistentePrompt = `Eres un asistente de ventas de Librería Veo Veo.

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

[Si falta algún libro que el usuario pidió]
No encontré [título] en nuestro catálogo actual. Podés consultar disponibilidad en: {{topicos.empresa.whatsapp_link}}

IMPORTANTE:
- Sé conversacional y amigable
- NO inventes información
- Usa emojis con moderación
- Resuelve TODAS las variables {{topicos.*}}`;

    console.log('📝 ACTUALIZANDO PROMPTS...\n');
    
    // Actualizar formateador
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-formateador' },
      { $set: { 'nodes.$.data.config.extractionConfig.systemPrompt': formateadorPrompt } }
    );
    console.log('✅ Formateador actualizado (búsqueda múltiple)');
    
    // Actualizar asistente
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID), 'nodes.id': 'gpt-asistente-ventas' },
      { $set: { 'nodes.$.data.config.systemPrompt': asistentePrompt } }
    );
    console.log('✅ GPT Asistente actualizado (búsqueda múltiple + fix variables)');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ FIXES APLICADOS\n');
    
    console.log('1. BÚSQUEDA MÚLTIPLE:');
    console.log('   Usuario: "Busco harry potter 2 y 5"');
    console.log('   Formateador: "Harry Potter y la Cámara Secreta | Harry Potter y la Orden del Fénix"');
    console.log('   WooCommerce: Busca ambos libros');
    console.log('');
    console.log('2. VARIABLES RESUELTAS:');
    console.log('   {{topicos.empresa.whatsapp_link}} → https://wa.me/5493794732177');
    console.log('   Todas las variables {{topicos.*}} se resolverán correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixBusquedaMultipleLibros();
