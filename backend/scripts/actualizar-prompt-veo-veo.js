import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf39';

async function actualizarPromptVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('📋 ACTUALIZANDO PROMPT DE VEO VEO\n');
    console.log('OBJETIVO:');
    console.log('- Personalidad de Librería Veo Veo');
    console.log('- Recopilar: Título, Editorial, Edición');
    console.log('- NO pedir información genérica innecesaria\n');

    // Nuevo systemPrompt enfocado en WooCommerce
    const nuevoPrompt = `Eres el asistente virtual de **Librería Veo Veo** 📚✏️

🏢 INFORMACIÓN DE LA LIBRERÍA:
- Ubicación: San Juan 1037 - Corrientes Capital
- Horario: Lunes a Viernes 8:30-12:00 y 17:00-21:00 | Sábados 9-13 y 17-21
- WhatsApp atención: +5493794732177

📖 TU MISIÓN:
Ayudar al cliente a encontrar libros escolares recopilando la información EXACTA que necesitamos para buscar en nuestro sistema.

🎯 DATOS QUE DEBES RECOPILAR (EN ESTE ORDEN):
1. **Título del libro** (nombre completo o parcial)
2. **Editorial** (si la conoce)
3. **Edición** (año o número de edición, si la conoce)

⚠️ REGLAS IMPORTANTES:
1. **NO pidas información genérica** como "tipo de producto", "nivel", "tema", "autor"
2. **SÍ pregunta específicamente** por: Título, Editorial, Edición
3. **Formato de solicitud**: "Por favor, ingresá tu búsqueda: Título - Editorial - Edición"
4. Si el cliente solo da el título, pregunta: "¿Conocés la editorial y edición?"
5. Si el cliente no conoce editorial/edición, está bien, usa NULL
6. **Cuando tengas al menos el TÍTULO**, marca como completo

📝 FORMATO DE RESPUESTA CUANDO TIENES LA INFO:
"Perfecto, voy a buscar: [TÍTULO] - [EDITORIAL o 'cualquier editorial'] - [EDICIÓN o 'última edición'] [INFO_COMPLETA]"

🚫 CASOS ESPECIALES:
- **Libros de inglés**: "Los libros de inglés se realizan únicamente a pedido con seña. Comunicate con un asesor: https://wa.me/5493794732177"
- **Sin stock**: "Lo sentimos, no tenemos stock. Podés reservarlo o contactar atención personalizada"

💡 EJEMPLOS DE CONVERSACIÓN CORRECTA:

Cliente: "Busco libros de inglés"
Tú: "Los libros de inglés se realizan a pedido con seña. Para más info: https://wa.me/5493794732177"

Cliente: "Busco Harry Potter"
Tú: "¡Genial! ¿Conocés la editorial y edición del libro de Harry Potter que buscás?"

Cliente: "No, cualquiera"
Tú: "Perfecto, voy a buscar: Harry Potter - cualquier editorial - última edición [INFO_COMPLETA]"

Cliente: "Busco Matemática 3 de Santillana"
Tú: "¿De qué edición? Si no sabés, busco la más reciente"

Cliente: "2023"
Tú: "Perfecto, voy a buscar: Matemática 3 - Santillana - 2023 [INFO_COMPLETA]"

🎯 RECUERDA:
- Sé amable y profesional
- No inventes información de stock o precios
- Enfócate SOLO en: Título, Editorial, Edición
- Marca [INFO_COMPLETA] cuando tengas al menos el título`;

    // Actualizar nodo GPT Conversacional
    const resultado = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { 
        $set: {
          'nodes.$[gpt].data.config.systemPrompt': nuevoPrompt,
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'gpt.id': 'gpt-conversacional' }]
      }
    );

    console.log('✅ Prompt actualizado');
    console.log('   Documentos modificados:', resultado.modifiedCount);
    
    // Actualizar Router para detectar título
    const resultadoRouter = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { 
        $set: {
          'nodes.$[router].data.config.routes': [
            {
              id: 'info-completa',
              label: 'Información Completa',
              condition: {
                field: 'gpt-conversacional.respuesta_gpt',
                operator: 'contains',
                value: '[INFO_COMPLETA]'
              }
            },
            {
              id: 'info-incompleta',
              label: 'Falta Información',
              condition: {
                field: 'gpt-conversacional.respuesta_gpt',
                operator: 'not_contains',
                value: '[INFO_COMPLETA]'
              }
            }
          ],
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'router.id': 'router-decision' }]
      }
    );

    console.log('✅ Router actualizado');
    console.log('   Documentos modificados:', resultadoRouter.modifiedCount);

    // Actualizar GPT Transform para extraer datos de WooCommerce
    const nuevoPromptTransform = `Extrae información estructurada para buscar en WooCommerce.

REGLAS:
1. Extrae SOLO información mencionada explícitamente
2. Si no hay información, usa null
3. Responde ÚNICAMENTE con JSON válido
4. No agregues texto adicional

FORMATO DE SALIDA:
{
  "titulo": "título del libro o null",
  "editorial": "editorial mencionada o null",
  "edicion": "edición/año mencionado o null",
  "search_query": "término de búsqueda para WooCommerce"
}

EJEMPLOS:

Input: "Harry Potter - cualquier editorial - última edición"
Output: {"titulo": "Harry Potter", "editorial": null, "edicion": null, "search_query": "Harry Potter"}

Input: "Matemática 3 - Santillana - 2023"
Output: {"titulo": "Matemática 3", "editorial": "Santillana", "edicion": "2023", "search_query": "Matemática 3 Santillana"}`;

    const resultadoTransform = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { 
        $set: {
          'nodes.$[transform].data.config.systemPrompt': nuevoPromptTransform,
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'transform.id': 'gpt-transform' }]
      }
    );

    console.log('✅ GPT Transform actualizado');
    console.log('   Documentos modificados:', resultadoTransform.modifiedCount);

    console.log('\n💡 CÓMO FUNCIONA AHORA:');
    console.log('   Cliente: "Busco libros de inglés"');
    console.log('   GPT: "Los libros de inglés se hacen a pedido..."');
    console.log('');
    console.log('   Cliente: "Busco Harry Potter"');
    console.log('   GPT: "¿Conocés la editorial y edición?"');
    console.log('   Cliente: "No"');
    console.log('   GPT: "Perfecto, busco: Harry Potter - cualquier editorial [INFO_COMPLETA]"');
    console.log('   Router: Detecta [INFO_COMPLETA] → GPT Transform');
    console.log('   Transform: {"titulo": "Harry Potter", "search_query": "Harry Potter"}');
    console.log('   → Listo para consultar WooCommerce');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

actualizarPromptVeoVeo();
