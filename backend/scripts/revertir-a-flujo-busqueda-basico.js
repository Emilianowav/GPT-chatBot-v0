import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf39';

/**
 * REVERTIR A FLUJO BÁSICO DE BÚSQUEDA (5 NODOS)
 * 
 * Solo los nodos pulidos y probados:
 * 1. WhatsApp Trigger
 * 2. GPT Búsqueda (título, editorial, edición)
 * 3. Router (¿info completa?)
 * 4. GPT Transform (formatear para WooCommerce)
 * 5. WhatsApp Send (respuesta)
 * 6. WhatsApp Send (pedir más info)
 */

async function revertirAFlujoBusquedaBasico() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🔄 REVIRTIENDO A FLUJO BÁSICO DE BÚSQUEDA\n');
    console.log('Objetivo: Solo nodos pulidos y probados (5 nodos + 1 alternativo)');
    console.log('Etapa: Búsqueda completa de libros\n');

    // NODOS DEL FLUJO (SOLO BÚSQUEDA)
    const nodes = [
      // [1] TRIGGER - WhatsApp Watch Events
      {
        id: 'whatsapp-watch-events',
        type: 'whatsapp',
        category: 'trigger',
        position: { x: 100, y: 300 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Watch Events',
          executionCount: 1,
          hasConnection: true,
          config: {
            module: 'watch-events',
            phoneNumberId: '906667632531979',
            verifyToken: '2001-ic'
          }
        }
      },

      // [2] GPT Conversacional - Búsqueda
      {
        id: 'gpt-busqueda',
        type: 'gpt',
        category: 'processor',
        position: { x: 400, y: 300 },
        data: {
          label: 'OpenAI (ChatGPT)',
          subtitle: 'Conversacional - Búsqueda',
          executionCount: 2,
          hasConnection: true,
          config: {
            tipo: 'conversacional',
            module: 'conversacional',
            modelo: 'gpt-4',
            temperatura: 0.7,
            maxTokens: 500,
            systemPrompt: `Eres el asistente virtual de **Librería Veo Veo** 📚✏️

🏢 INFORMACIÓN:
- Ubicación: San Juan 1037 - Corrientes Capital
- Horario: Lunes a Viernes 8:30-12:00 y 17:00-21:00 | Sábados 9-13 y 17-21
- WhatsApp: +5493794732177

📖 TU MISIÓN:
Recopilar datos para buscar libros en nuestro catálogo.

🎯 DATOS A RECOPILAR:
1. **TÍTULO** (OBLIGATORIO)
2. **EDITORIAL** (opcional)
3. **EDICIÓN** (opcional)

✅ HACER:
- Preguntar por título, editorial, edición
- Aceptar información parcial
- Marcar [INFO_COMPLETA] cuando tengas al menos el título

❌ NO HACER:
- NO pedir cantidades, nombre, teléfono
- NO mencionar "pedido" o "compra"

📝 FORMATO:
"Perfecto, voy a buscar: [TÍTULO] - [EDITORIAL o 'cualquier editorial'] - [EDICIÓN o 'última edición'] [INFO_COMPLETA]"

💡 EJEMPLOS:
Cliente: "Busco Harry Potter"
Tú: "¿Conocés la editorial y edición?"
Cliente: "No, cualquiera"
Tú: "Perfecto, voy a buscar: Harry Potter - cualquier editorial - última edición [INFO_COMPLETA]"

Cliente: "Busco Matemática 3 de Santillana"
Tú: "¿De qué edición? Si no sabés, busco la más reciente"
Cliente: "2023"
Tú: "Perfecto, voy a buscar: Matemática 3 - Santillana - 2023 [INFO_COMPLETA]"`,
            variablesEntrada: ['mensaje_usuario'],
            variablesSalida: ['respuesta_gpt'],
            globalVariablesOutput: ['titulo', 'editorial', 'edicion'],
            outputFormat: 'text'
          }
        }
      },

      // [3] Router - ¿Info Completa?
      {
        id: 'router-info-completa',
        type: 'router',
        category: 'processor',
        position: { x: 700, y: 300 },
        data: {
          label: 'Router',
          subtitle: '¿Información Completa?',
          executionCount: 3,
          hasConnection: true,
          config: {
            routes: [
              {
                id: 'info-completa',
                label: 'Información Completa',
                condition: {
                  field: 'gpt-busqueda.respuesta_gpt',
                  operator: 'contains',
                  value: '[INFO_COMPLETA]'
                }
              },
              {
                id: 'info-incompleta',
                label: 'Falta Información',
                condition: {
                  field: 'gpt-busqueda.respuesta_gpt',
                  operator: 'not_contains',
                  value: '[INFO_COMPLETA]'
                }
              }
            ]
          }
        }
      },

      // [4] GPT Transform - Formatear Búsqueda
      {
        id: 'gpt-transform-busqueda',
        type: 'gpt',
        category: 'processor',
        position: { x: 1000, y: 200 },
        data: {
          label: 'OpenAI (ChatGPT)',
          subtitle: 'Transform - Formateo',
          executionCount: 4,
          hasConnection: true,
          config: {
            tipo: 'transform',
            module: 'transform',
            modelo: 'gpt-4',
            temperatura: 0.1,
            maxTokens: 300,
            systemPrompt: `Extrae información estructurada para buscar en WooCommerce.

REGLAS:
1. Extrae SOLO información mencionada explícitamente
2. Si no hay información, usa null
3. Responde ÚNICAMENTE con JSON válido

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
Output: {"titulo": "Matemática 3", "editorial": "Santillana", "edicion": "2023", "search_query": "Matemática 3 Santillana"}`,
            variablesEntrada: ['gpt-busqueda.respuesta_gpt'],
            variablesSalida: ['datos_estructurados'],
            globalVariablesOutput: ['search_query'],
            outputFormat: 'json'
          }
        }
      },

      // [5] WhatsApp Send - Respuesta Búsqueda Completa
      {
        id: 'whatsapp-send-busqueda',
        type: 'whatsapp',
        category: 'action',
        position: { x: 1300, y: 200 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Send Message',
          executionCount: 5,
          hasConnection: true,
          config: {
            module: 'send-message',
            phoneNumberId: '906667632531979',
            to: '{{1.from}}',
            message: '{{gpt-busqueda.respuesta_gpt}}'
          }
        }
      },

      // [6] WhatsApp Send - Pedir Más Info
      {
        id: 'whatsapp-send-mas-info',
        type: 'whatsapp',
        category: 'action',
        position: { x: 1000, y: 400 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Send Message',
          executionCount: 6,
          hasConnection: true,
          config: {
            module: 'send-message',
            phoneNumberId: '906667632531979',
            to: '{{1.from}}',
            message: '{{gpt-busqueda.respuesta_gpt}}'
          }
        }
      }
    ];

    // EDGES (CONEXIONES)
    const edges = [
      // Flujo principal
      {
        id: 'e1-2',
        source: 'whatsapp-watch-events',
        target: 'gpt-busqueda',
        type: 'default',
        data: { mapping: { mensaje_usuario: '1.message' } }
      },
      {
        id: 'e2-3',
        source: 'gpt-busqueda',
        target: 'router-info-completa',
        type: 'default'
      },
      
      // Router: Info Completa → Transform
      {
        id: 'e3-4',
        source: 'router-info-completa',
        target: 'gpt-transform-busqueda',
        type: 'default',
        data: { routeId: 'info-completa' }
      },
      
      // Transform → Send Búsqueda
      {
        id: 'e4-5',
        source: 'gpt-transform-busqueda',
        target: 'whatsapp-send-busqueda',
        type: 'default'
      },
      
      // Router: Info Incompleta → Send Más Info
      {
        id: 'e3-6',
        source: 'router-info-completa',
        target: 'whatsapp-send-mas-info',
        type: 'default',
        data: { routeId: 'info-incompleta' }
      }
    ];

    // ACTUALIZAR FLUJO EN BD
    const resultado = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      {
        $set: {
          nombre: 'Veo Veo - Consultar Libros',
          nodes: nodes,
          edges: edges,
          botType: 'visual',
          activo: true,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Flujo revertido a versión básica');
    console.log(`   Documentos modificados: ${resultado.modifiedCount}`);
    console.log(`   Nodos: ${nodes.length}`);
    console.log(`   Edges: ${edges.length}\n`);

    // VERIFICAR
    const flujo = await db.collection('flows').findOne({ 
      _id: new mongoose.Types.ObjectId(FLOW_ID)
    });

    console.log('📊 RESUMEN DEL FLUJO:');
    console.log(`   Nombre: ${flujo.nombre}`);
    console.log(`   Nodos: ${flujo.nodes.length}`);
    console.log(`   Edges: ${flujo.edges.length}`);
    console.log(`   Bot Type: ${flujo.botType}`);
    console.log(`   Activo: ${flujo.activo}\n`);

    console.log('🎯 FLUJO ACTUAL (PULIDO):');
    console.log('   [1] WhatsApp Trigger');
    console.log('   [2] GPT Búsqueda → Recopila título, editorial, edición');
    console.log('   [3] Router → ¿Info completa?');
    console.log('   [4] GPT Transform → JSON para WooCommerce');
    console.log('   [5] WhatsApp Send → Envía respuesta');
    console.log('   [6] WhatsApp Send → Pide más info (si falta)\n');

    console.log('📝 PRÓXIMO PASO:');
    console.log('   1. ✅ Testear búsqueda: "Busco Harry Potter"');
    console.log('   2. ⏳ Una vez probado, agregar nodo WooCommerce API');
    console.log('   3. ⏳ Probar WooCommerce, luego siguiente nodo');
    console.log('   4. ⏳ Avanzar incrementalmente\n');

    console.log('💡 ESTRATEGIA:');
    console.log('   - Solo agregar nodos cuando los anteriores estén 100% probados');
    console.log('   - Cada nodo nuevo se prueba antes de continuar');
    console.log('   - Construcción incremental y sólida');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

revertirAFlujoBusquedaBasico();
