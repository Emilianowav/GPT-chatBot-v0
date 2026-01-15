import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const EMPRESA_ID = '6940a9a181b92bfce970fdb5'; // Veo Veo
const FLOW_ID = '695a156681f6d67f0ae9cf39'; // Flujo existente

/**
 * FLUJO COMPLETO DE VENTA - VEO VEO
 * 
 * ETAPAS:
 * 1. Búsqueda (título, editorial, edición)
 * 2. Resultados WooCommerce
 * 3. Selección de producto
 * 4. Cantidad
 * 5. Datos de contacto (nombre, teléfono)
 * 6. Pago Mercado Pago
 */

async function crearFlujoVentaCompleto() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🏗️  CREANDO FLUJO COMPLETO DE VENTA\n');
    console.log('Objetivo: Flujo end-to-end desde búsqueda hasta pago');
    console.log('Total de nodos: 12 (simplificado para MVP)\n');

    // NODOS DEL FLUJO
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
          label: 'GPT Búsqueda',
          subtitle: 'Recopila: Título, Editorial, Edición',
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
Tú: "Perfecto, voy a buscar: Harry Potter - cualquier editorial - última edición [INFO_COMPLETA]"`,
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
          label: 'GPT Transform',
          subtitle: 'Formatear para WooCommerce',
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
Output: {"titulo": "Harry Potter", "editorial": null, "edicion": null, "search_query": "Harry Potter"}`,
            variablesEntrada: ['gpt-busqueda.respuesta_gpt'],
            variablesSalida: ['datos_estructurados'],
            globalVariablesOutput: ['search_query'],
            outputFormat: 'json'
          }
        }
      },

      // [5] WhatsApp Send - Respuesta Búsqueda
      {
        id: 'whatsapp-send-busqueda',
        type: 'whatsapp',
        category: 'action',
        position: { x: 1300, y: 200 },
        data: {
          label: 'WhatsApp Send',
          subtitle: 'Enviar Respuesta',
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
          label: 'WhatsApp Send',
          subtitle: 'Pedir Más Información',
          executionCount: 6,
          hasConnection: true,
          config: {
            module: 'send-message',
            phoneNumberId: '906667632531979',
            to: '{{1.from}}',
            message: '{{gpt-busqueda.respuesta_gpt}}'
          }
        }
      },

      // [7] GPT Conversacional - Mostrar Resultados (PLACEHOLDER)
      {
        id: 'gpt-mostrar-resultados',
        type: 'gpt',
        category: 'processor',
        position: { x: 1600, y: 200 },
        data: {
          label: 'GPT Mostrar Resultados',
          subtitle: 'Formatear productos encontrados',
          executionCount: 7,
          hasConnection: true,
          config: {
            tipo: 'conversacional',
            module: 'conversacional',
            modelo: 'gpt-4',
            temperatura: 0.7,
            maxTokens: 800,
            systemPrompt: `Formatea los resultados de WooCommerce en un mensaje amigable.

FORMATO:
📚 Resultados encontrados para "{{global.search_query}}":

1. [TÍTULO]
   💰 Precio: $[PRECIO]
   📦 Stock: [STOCK] unidades

2. [TÍTULO]
   💰 Precio: $[PRECIO]
   📦 Stock: [STOCK] unidades

💡 ¿Cuál libro querés agregar a tu compra?
Escribí el número del libro (1, 2, etc.)

NOTA: Por ahora, este nodo está en desarrollo. Responde con un mensaje genérico.`,
            variablesEntrada: ['global.search_query'],
            variablesSalida: ['mensaje_resultados'],
            outputFormat: 'text'
          }
        }
      },

      // [8] GPT Conversacional - Pedir Cantidad
      {
        id: 'gpt-pedir-cantidad',
        type: 'gpt',
        category: 'processor',
        position: { x: 1900, y: 200 },
        data: {
          label: 'GPT Pedir Cantidad',
          subtitle: 'Solicitar cantidad de ejemplares',
          executionCount: 8,
          hasConnection: true,
          config: {
            tipo: 'conversacional',
            module: 'conversacional',
            modelo: 'gpt-4',
            temperatura: 0.7,
            maxTokens: 300,
            systemPrompt: `Pregunta cuántos ejemplares desea el cliente.

FORMATO:
📦 ¿Cuántos ejemplares de [PRODUCTO] querés?

Stock disponible: [STOCK] unidades
Escribí la cantidad (1-[STOCK])

NOTA: Por ahora usa valores genéricos. Integración con WooCommerce pendiente.`,
            variablesEntrada: ['global.producto_nombre', 'global.producto_stock'],
            variablesSalida: ['mensaje_cantidad'],
            globalVariablesOutput: ['cantidad'],
            outputFormat: 'text'
          }
        }
      },

      // [9] GPT Conversacional - Pedir Nombre
      {
        id: 'gpt-pedir-nombre',
        type: 'gpt',
        category: 'processor',
        position: { x: 2200, y: 200 },
        data: {
          label: 'GPT Pedir Nombre',
          subtitle: 'Solicitar nombre del cliente',
          executionCount: 9,
          hasConnection: true,
          config: {
            tipo: 'conversacional',
            module: 'conversacional',
            modelo: 'gpt-4',
            temperatura: 0.7,
            maxTokens: 300,
            systemPrompt: `Solicita el nombre completo del cliente.

FORMATO:
✅ Libro agregado a tu compra:

📘 [PRODUCTO]
📦 Cantidad: [CANTIDAD]
💰 Precio unitario: $[PRECIO]
💵 Subtotal: $[SUBTOTAL]

Para continuar, necesito algunos datos:
👤 ¿Cuál es tu nombre completo?`,
            variablesEntrada: ['global.producto_nombre', 'global.cantidad', 'global.subtotal'],
            variablesSalida: ['mensaje_nombre'],
            globalVariablesOutput: ['nombre_cliente'],
            outputFormat: 'text'
          }
        }
      },

      // [10] GPT Conversacional - Pedir Teléfono
      {
        id: 'gpt-pedir-telefono',
        type: 'gpt',
        category: 'processor',
        position: { x: 2500, y: 200 },
        data: {
          label: 'GPT Pedir Teléfono',
          subtitle: 'Solicitar teléfono del cliente',
          executionCount: 10,
          hasConnection: true,
          config: {
            tipo: 'conversacional',
            module: 'conversacional',
            modelo: 'gpt-4',
            temperatura: 0.7,
            maxTokens: 200,
            systemPrompt: `Solicita el teléfono de contacto del cliente.

FORMATO:
Gracias, {{global.nombre_cliente}} 👍

📱 ¿Cuál es tu teléfono de contacto?
(Ejemplo: 3794946066)`,
            variablesEntrada: ['global.nombre_cliente'],
            variablesSalida: ['mensaje_telefono'],
            globalVariablesOutput: ['telefono_cliente'],
            outputFormat: 'text'
          }
        }
      },

      // [11] GPT Conversacional - Mensaje Final
      {
        id: 'gpt-mensaje-final',
        type: 'gpt',
        category: 'processor',
        position: { x: 2800, y: 200 },
        data: {
          label: 'GPT Mensaje Final',
          subtitle: 'Resumen y link de pago',
          executionCount: 11,
          hasConnection: true,
          config: {
            tipo: 'conversacional',
            module: 'conversacional',
            modelo: 'gpt-4',
            temperatura: 0.7,
            maxTokens: 400,
            systemPrompt: 'Genera mensaje final con resumen de compra.\n\n' +
              'FORMATO:\n' +
              '✅ ¡Perfecto! Tu pedido está listo:\n\n' +
              '📘 {{global.producto_nombre}}\n' +
              '📦 Cantidad: {{global.cantidad}}\n' +
              '💵 Total: ${{global.subtotal}}\n\n' +
              '🔗 Link de pago:\n' +
              '[LINK MERCADO PAGO - PENDIENTE INTEGRACIÓN]\n\n' +
              '👉 Una vez realizado el pago, envianos el comprobante a:\n' +
              'https://wa.me/5493794732177\n\n' +
              '⏰ Retiro: Podés pasar a retirarlo a partir de las 24hs de confirmado el pago.\n\n' +
              '📍 San Juan 1037 - Corrientes Capital\n' +
              '🕗 Lunes a Viernes 8:30-12 y 17-21 | Sábados 9-13 y 17-21\n\n' +
              '¡Gracias por tu compra! 📚✨',
            variablesEntrada: ['global.producto_nombre', 'global.cantidad', 'global.subtotal'],
            variablesSalida: ['mensaje_final'],
            outputFormat: 'text'
          }
        }
      },

      // [12] WhatsApp Send - Enviar Mensaje Final
      {
        id: 'whatsapp-send-final',
        type: 'whatsapp',
        category: 'action',
        position: { x: 3100, y: 200 },
        data: {
          label: 'WhatsApp Send',
          subtitle: 'Enviar Link de Pago',
          executionCount: 12,
          hasConnection: true,
          config: {
            module: 'send-message',
            phoneNumberId: '906667632531979',
            to: '{{1.from}}',
            message: '{{gpt-mensaje-final.mensaje_final}}'
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
      
      // Send Búsqueda → Mostrar Resultados (PLACEHOLDER)
      {
        id: 'e5-7',
        source: 'whatsapp-send-busqueda',
        target: 'gpt-mostrar-resultados',
        type: 'default'
      },
      
      // Mostrar Resultados → Pedir Cantidad (PLACEHOLDER)
      {
        id: 'e7-8',
        source: 'gpt-mostrar-resultados',
        target: 'gpt-pedir-cantidad',
        type: 'default'
      },
      
      // Pedir Cantidad → Pedir Nombre
      {
        id: 'e8-9',
        source: 'gpt-pedir-cantidad',
        target: 'gpt-pedir-nombre',
        type: 'default'
      },
      
      // Pedir Nombre → Pedir Teléfono
      {
        id: 'e9-10',
        source: 'gpt-pedir-nombre',
        target: 'gpt-pedir-telefono',
        type: 'default'
      },
      
      // Pedir Teléfono → Mensaje Final
      {
        id: 'e10-11',
        source: 'gpt-pedir-telefono',
        target: 'gpt-mensaje-final',
        type: 'default'
      },
      
      // Mensaje Final → Send Final
      {
        id: 'e11-12',
        source: 'gpt-mensaje-final',
        target: 'whatsapp-send-final',
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
          nombre: 'Veo Veo - Flujo Venta Completo',
          nodes: nodes,
          edges: edges,
          botType: 'visual',
          activo: true,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Flujo actualizado en BD');
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

    console.log('🎯 ETAPAS DEL FLUJO:');
    console.log('   1. Búsqueda (título, editorial, edición)');
    console.log('   2. Transform para WooCommerce');
    console.log('   3. Mostrar resultados (PLACEHOLDER)');
    console.log('   4. Pedir cantidad');
    console.log('   5. Pedir nombre');
    console.log('   6. Pedir teléfono');
    console.log('   7. Mensaje final con link de pago\n');

    console.log('📝 PRÓXIMOS PASOS:');
    console.log('   1. Testear búsqueda: "Busco Harry Potter"');
    console.log('   2. Agregar nodo WooCommerce API');
    console.log('   3. Agregar nodo Mercado Pago API');
    console.log('   4. Completar validaciones de cantidad/nombre/teléfono');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

crearFlujoVentaCompleto();
