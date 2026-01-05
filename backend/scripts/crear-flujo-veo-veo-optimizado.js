import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const FLOW_ID = '695b5802cf46dd410a91f37c';
const EMPRESA_ID = '6940a9a181b92bfce970fdb5';
const WOOCOMMERCE_CONFIG_ID = '695320fda03785dacc8d950b';

/**
 * ARQUITECTURA OPTIMIZADA DEL FLUJO "VEO VEO - CONSULTAR LIBROS"
 * 
 * FILOSOFÍA:
 * - GPT Conversacional como orquestador principal
 * - Nodos especializados con funcionalidades específicas pero reutilizables
 * - Variables compartidas entre nodos
 * - Comunicación fluida entre APIs
 * 
 * FLUJO:
 * 1. GPT Conversacional → Recopila información del usuario (título, editorial, edición)
 * 2. GPT Formateador → Procesa y formatea datos para búsqueda en WooCommerce
 * 3. WooCommerce API → Busca productos
 * 4. GPT Procesador → Analiza resultados y genera respuesta al usuario
 * 5. WhatsApp → Envía resultados al usuario
 * 6. GPT Conversacional → Recopila selección y cantidad
 * 7. GPT Formateador → Prepara datos para MercadoPago
 * 8. MercadoPago API → Genera link de pago
 * 9. WhatsApp → Envía link de pago
 * 10. Webhook Listener → Escucha confirmación de pago
 * 11. WhatsApp → Confirma pago recibido
 */

async function crearFlujoOptimizado() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    console.log('🎨 CREANDO FLUJO OPTIMIZADO: Veo Veo - Consultar Libros\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ============================================
    // DEFINICIÓN DE NODOS
    // ============================================

    const nodes = [];
    const edges = [];
    let yPos = 100;
    const SPACING = 180;

    // ============================================
    // NODO 1: TRIGGER - Inicio del flujo
    // ============================================
    nodes.push({
      id: 'trigger-inicio',
      type: 'whatsapp',
      position: { x: 400, y: yPos },
      data: {
        label: '🚀 Inicio del Flujo',
        icon: 'trigger',
        config: {
          tipo: 'trigger',
          descripcion: 'Usuario selecciona opción 1 del menú principal',
          trigger: {
            tipo: 'manual',
            desde: 'menu-principal',
            valor: '1'
          },
          variables_iniciales: {
            carrito: [],
            total: 0,
            estado: 'iniciado'
          }
        }
      }
    });

    yPos += SPACING;

    // ============================================
    // NODO 2: GPT CONVERSACIONAL - Recopilación de datos
    // ============================================
    nodes.push({
      id: 'gpt-recopilacion',
      type: 'gpt',
      position: { x: 400, y: yPos },
      data: {
        label: '🤖 GPT - Recopilación de Datos',
        icon: 'chat',
        config: {
          tipo: 'conversacional',
          modelo: 'gpt-4',
          temperatura: 0.7,
          max_tokens: 500,
          prompt_sistema: `Eres un asistente de librería "Veo Veo". Tu tarea es recopilar información sobre el libro que el cliente busca.

INFORMACIÓN A RECOPILAR:
1. Título del libro (OBLIGATORIO)
2. Editorial (opcional, si el usuario no sabe, continúa)
3. Edición (opcional, si el usuario no sabe, continúa)

REGLAS:
- Sé amable y conversacional
- Si el usuario no sabe algún dato opcional, no insistas
- Una vez tengas el título, pregunta por editorial y edición en el mismo mensaje
- Cuando tengas toda la info posible, confirma los datos y pasa al siguiente paso

FORMATO DE SALIDA (cuando termines):
{
  "titulo": "nombre del libro",
  "editorial": "nombre editorial o null",
  "edicion": "número de edición o null",
  "listo": true
}`,
          mensaje_inicial: 'Hola! 📚 Veo que querés consultar por un libro.\n\nPor favor, contame:\n📖 *¿Qué libro estás buscando?*\n\n⚠️ *Importante:* No envíes fotos, solo el nombre por escrito.',
          variables_salida: ['titulo', 'editorial', 'edicion'],
          condicion_salida: {
            campo: 'listo',
            valor: true
          }
        }
      }
    });

    edges.push({
      id: 'edge-1',
      source: 'trigger-inicio',
      target: 'gpt-recopilacion',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 3: GPT FORMATEADOR - Preparar query para WooCommerce
    // ============================================
    nodes.push({
      id: 'gpt-formateador-busqueda',
      type: 'gpt',
      position: { x: 400, y: yPos },
      data: {
        label: '⚙️ GPT - Formatear Búsqueda',
        icon: 'settings',
        config: {
          tipo: 'formateador',
          modelo: 'gpt-4',
          temperatura: 0.3,
          max_tokens: 200,
          prompt_sistema: `Eres un formateador de consultas para WooCommerce.

ENTRADA:
- titulo: {{titulo}}
- editorial: {{editorial}}
- edicion: {{edicion}}

TAREA:
Genera un término de búsqueda óptimo para WooCommerce que combine estos datos.

REGLAS:
- Prioriza el título
- Si hay editorial, inclúyela
- Si hay edición, inclúyela
- Genera variantes si es necesario (singular/plural, con/sin acentos)

FORMATO DE SALIDA:
{
  "search_query": "término de búsqueda optimizado",
  "filters": {
    "editorial": "nombre editorial o null",
    "edicion": "edición o null"
  }
}`,
          variables_entrada: ['titulo', 'editorial', 'edicion'],
          variables_salida: ['search_query', 'filters']
        }
      }
    });

    edges.push({
      id: 'edge-2',
      source: 'gpt-recopilacion',
      target: 'gpt-formateador-busqueda',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 4: WOOCOMMERCE API - Buscar productos
    // ============================================
    nodes.push({
      id: 'woocommerce-buscar',
      type: 'woocommerce',
      position: { x: 400, y: yPos },
      data: {
        label: '🛒 WooCommerce - Buscar Productos',
        icon: 'search',
        config: {
          tipo: 'buscar_productos',
          api_config_id: WOOCOMMERCE_CONFIG_ID,
          endpoint: 'buscar-productos',
          metodo: 'GET',
          parametros: {
            search: '{{search_query}}',
            per_page: 10,
            status: 'publish',
            stock_status: 'instock'
          },
          mapeo_respuesta: {
            arrayPath: 'data',
            campos: {
              id: 'id',
              nombre: 'name',
              precio: 'price',
              stock: 'stock_quantity',
              imagen: 'images[0].src',
              descripcion: 'short_description'
            }
          },
          variables_salida: ['productos_encontrados', 'total_resultados'],
          manejo_errores: {
            sin_resultados: 'continuar_a_nodo_sin_resultados',
            error_api: 'reintentar_3_veces'
          }
        }
      }
    });

    edges.push({
      id: 'edge-3',
      source: 'gpt-formateador-busqueda',
      target: 'woocommerce-buscar',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 5: ROUTER - ¿Hay resultados?
    // ============================================
    nodes.push({
      id: 'router-resultados',
      type: 'router',
      position: { x: 400, y: yPos },
      data: {
        label: '🔀 ¿Productos encontrados?',
        icon: 'split',
        config: {
          tipo: 'condicional',
          condiciones: [
            {
              nombre: 'con_resultados',
              expresion: 'total_resultados > 0',
              siguiente_nodo: 'gpt-procesar-resultados'
            },
            {
              nombre: 'sin_resultados',
              expresion: 'total_resultados === 0',
              siguiente_nodo: 'whatsapp-sin-resultados'
            }
          ]
        }
      }
    });

    edges.push({
      id: 'edge-4',
      source: 'woocommerce-buscar',
      target: 'router-resultados',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 6: GPT PROCESADOR - Analizar resultados y generar respuesta
    // ============================================
    nodes.push({
      id: 'gpt-procesar-resultados',
      type: 'gpt',
      position: { x: 200, y: yPos },
      data: {
        label: '🧠 GPT - Procesar Resultados',
        icon: 'brain',
        config: {
          tipo: 'procesador',
          modelo: 'gpt-4',
          temperatura: 0.7,
          max_tokens: 800,
          prompt_sistema: `Eres un asistente de librería. Recibiste resultados de búsqueda de productos.

PRODUCTOS ENCONTRADOS:
{{productos_encontrados}}

TAREA:
1. Analiza los productos
2. Genera una respuesta amigable mostrando los resultados
3. Numera cada opción (1, 2, 3...)
4. Incluye: nombre, precio, stock disponible
5. Pide al usuario que elija un número

FORMATO DE SALIDA:
{
  "mensaje": "texto formateado para WhatsApp con los productos",
  "opciones_disponibles": [1, 2, 3, ...],
  "productos_mapeados": {
    "1": { "id": "...", "nombre": "...", "precio": ... },
    "2": { "id": "...", "nombre": "...", "precio": ... }
  }
}`,
          variables_entrada: ['productos_encontrados', 'titulo'],
          variables_salida: ['mensaje', 'opciones_disponibles', 'productos_mapeados']
        }
      }
    });

    edges.push({
      id: 'edge-5a',
      source: 'router-resultados',
      target: 'gpt-procesar-resultados',
      type: 'simple',
      data: { label: 'Con resultados' }
    });

    // ============================================
    // NODO 6B: WhatsApp - Sin resultados
    // ============================================
    nodes.push({
      id: 'whatsapp-sin-resultados',
      type: 'whatsapp',
      position: { x: 600, y: yPos },
      data: {
        label: '📱 WhatsApp - Sin Resultados',
        icon: 'message',
        config: {
          tipo: 'enviar_mensaje',
          mensaje: 'Lo sentimos, no encontramos el libro "{{titulo}}" en nuestro stock actual. 😔\n\n📚 *¿Qué podés hacer?*\n\n1️⃣ Buscar otro título\n2️⃣ Consultar disponibilidad futura\n3️⃣ Volver al menú principal\n\nEscribí el número de tu opción.',
          esperar_respuesta: true,
          variables_salida: ['opcion_sin_resultados']
        }
      }
    });

    edges.push({
      id: 'edge-5b',
      source: 'router-resultados',
      target: 'whatsapp-sin-resultados',
      type: 'simple',
      data: { label: 'Sin resultados' }
    });

    yPos += SPACING;

    // ============================================
    // NODO 7: WhatsApp - Enviar resultados
    // ============================================
    nodes.push({
      id: 'whatsapp-mostrar-resultados',
      type: 'whatsapp',
      position: { x: 200, y: yPos },
      data: {
        label: '📱 WhatsApp - Mostrar Productos',
        icon: 'message',
        config: {
          tipo: 'enviar_mensaje',
          mensaje: '{{mensaje}}',
          esperar_respuesta: true,
          validacion: {
            tipo: 'numero',
            opciones_validas: '{{opciones_disponibles}}'
          },
          variables_salida: ['producto_seleccionado_numero']
        }
      }
    });

    edges.push({
      id: 'edge-6',
      source: 'gpt-procesar-resultados',
      target: 'whatsapp-mostrar-resultados',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 8: GPT CONVERSACIONAL - Recopilar cantidad
    // ============================================
    nodes.push({
      id: 'gpt-cantidad',
      type: 'gpt',
      position: { x: 200, y: yPos },
      data: {
        label: '🤖 GPT - Solicitar Cantidad',
        icon: 'chat',
        config: {
          tipo: 'conversacional',
          modelo: 'gpt-4',
          temperatura: 0.5,
          max_tokens: 300,
          prompt_sistema: `El usuario seleccionó el producto número {{producto_seleccionado_numero}}.

PRODUCTO:
{{productos_mapeados[producto_seleccionado_numero]}}

TAREA:
1. Confirma el producto seleccionado
2. Pregunta cuántos ejemplares quiere (1-10)
3. Calcula el subtotal
4. Pregunta si quiere agregar más libros o finalizar

FORMATO DE SALIDA:
{
  "cantidad": número,
  "subtotal": precio * cantidad,
  "continuar": "agregar_mas" o "finalizar",
  "listo": true
}`,
          variables_entrada: ['producto_seleccionado_numero', 'productos_mapeados'],
          variables_salida: ['cantidad', 'subtotal', 'continuar']
        }
      }
    });

    edges.push({
      id: 'edge-7',
      source: 'whatsapp-mostrar-resultados',
      target: 'gpt-cantidad',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 9: ROUTER - ¿Agregar más o finalizar?
    // ============================================
    nodes.push({
      id: 'router-continuar',
      type: 'router',
      position: { x: 200, y: yPos },
      data: {
        label: '🔀 ¿Agregar más libros?',
        icon: 'split',
        config: {
          tipo: 'condicional',
          condiciones: [
            {
              nombre: 'agregar_mas',
              expresion: 'continuar === "agregar_mas"',
              siguiente_nodo: 'gpt-recopilacion'
            },
            {
              nombre: 'finalizar',
              expresion: 'continuar === "finalizar"',
              siguiente_nodo: 'gpt-formateador-pago'
            }
          ]
        }
      }
    });

    edges.push({
      id: 'edge-8',
      source: 'gpt-cantidad',
      target: 'router-continuar',
      type: 'simple'
    });

    // Edge de vuelta al inicio (agregar más)
    edges.push({
      id: 'edge-9-loop',
      source: 'router-continuar',
      target: 'gpt-recopilacion',
      type: 'simple',
      data: { label: 'Agregar más' }
    });

    yPos += SPACING;

    // ============================================
    // NODO 10: GPT FORMATEADOR - Preparar datos para MercadoPago
    // ============================================
    nodes.push({
      id: 'gpt-formateador-pago',
      type: 'gpt',
      position: { x: 200, y: yPos },
      data: {
        label: '⚙️ GPT - Formatear Pago',
        icon: 'settings',
        config: {
          tipo: 'formateador',
          modelo: 'gpt-4',
          temperatura: 0.2,
          max_tokens: 400,
          prompt_sistema: `Prepara los datos para generar un link de pago en MercadoPago.

CARRITO:
{{carrito}}

TOTAL:
{{total}}

FORMATO DE SALIDA:
{
  "items": [
    {
      "title": "nombre del producto",
      "quantity": cantidad,
      "unit_price": precio,
      "currency_id": "ARS"
    }
  ],
  "total_amount": total,
  "description": "Compra en Librería Veo Veo",
  "external_reference": "VEO-{{timestamp}}"
}`,
          variables_entrada: ['carrito', 'total'],
          variables_salida: ['pago_data']
        }
      }
    });

    edges.push({
      id: 'edge-9',
      source: 'router-continuar',
      target: 'gpt-formateador-pago',
      type: 'simple',
      data: { label: 'Finalizar' }
    });

    yPos += SPACING;

    // ============================================
    // NODO 11: MERCADOPAGO API - Generar link de pago
    // ============================================
    nodes.push({
      id: 'mercadopago-generar-link',
      type: 'mercadopago',
      position: { x: 200, y: yPos },
      data: {
        label: '💳 MercadoPago - Generar Link',
        icon: 'payment',
        config: {
          tipo: 'crear_preferencia',
          credenciales: {
            access_token: '{{MERCADOPAGO_ACCESS_TOKEN}}',
            public_key: '{{MERCADOPAGO_PUBLIC_KEY}}'
          },
          endpoint: '/checkout/preferences',
          metodo: 'POST',
          body: '{{pago_data}}',
          configuracion: {
            back_urls: {
              success: 'https://veoveo.com/pago-exitoso',
              failure: 'https://veoveo.com/pago-fallido',
              pending: 'https://veoveo.com/pago-pendiente'
            },
            auto_return: 'approved',
            notification_url: 'https://api.veoveo.com/webhooks/mercadopago'
          },
          variables_salida: ['link_pago', 'preference_id', 'external_reference']
        }
      }
    });

    edges.push({
      id: 'edge-10',
      source: 'gpt-formateador-pago',
      target: 'mercadopago-generar-link',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 12: WhatsApp - Enviar link de pago
    // ============================================
    nodes.push({
      id: 'whatsapp-enviar-link',
      type: 'whatsapp',
      position: { x: 200, y: yPos },
      data: {
        label: '📱 WhatsApp - Enviar Link de Pago',
        icon: 'message',
        config: {
          tipo: 'enviar_mensaje',
          mensaje: '💳 *Link de pago generado*\n\n📦 *Resumen de tu pedido:*\n{{resumen_carrito}}\n\n💰 *Total a pagar:* ${{total}}\n\n🔗 *Completá tu compra aquí:*\n{{link_pago}}\n\n⏰ Tenés 15 minutos para completar el pago.\n\nUna vez realizado el pago, recibirás una confirmación automática. 📚✨',
          esperar_respuesta: false
        }
      }
    });

    edges.push({
      id: 'edge-11',
      source: 'mercadopago-generar-link',
      target: 'whatsapp-enviar-link',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 13: WEBHOOK LISTENER - Escuchar confirmación de pago
    // ============================================
    nodes.push({
      id: 'webhook-pago',
      type: 'webhook',
      position: { x: 200, y: yPos },
      data: {
        label: '🔔 Webhook - Escuchar Pago',
        icon: 'webhook',
        config: {
          tipo: 'listener',
          endpoint: '/webhooks/mercadopago',
          metodo: 'POST',
          filtros: {
            type: 'payment',
            action: 'payment.updated'
          },
          mapeo_datos: {
            payment_id: 'data.id',
            status: 'data.status',
            external_reference: 'data.external_reference',
            amount: 'data.transaction_amount'
          },
          condicion_activacion: {
            campo: 'status',
            valor: 'approved'
          },
          timeout: 900,
          variables_salida: ['payment_id', 'payment_status', 'payment_amount']
        }
      }
    });

    edges.push({
      id: 'edge-12',
      source: 'whatsapp-enviar-link',
      target: 'webhook-pago',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 14: WhatsApp - Confirmar pago recibido
    // ============================================
    nodes.push({
      id: 'whatsapp-confirmar-pago',
      type: 'whatsapp',
      position: { x: 200, y: yPos },
      data: {
        label: '📱 WhatsApp - Confirmar Pago',
        icon: 'check',
        config: {
          tipo: 'enviar_mensaje',
          mensaje: '✅ *¡Pago confirmado!*\n\nRecibimos tu pago de *${{payment_amount}}*\n\n📦 *Tu pedido está confirmado*\n🆔 ID de pago: {{payment_id}}\n\n📍 *Retiro del pedido:*\nPodés pasar a retirarlo a partir de las 24hs en:\n📌 Dirección de la librería\n\n¡Gracias por tu compra! 📚✨\n\n¿Necesitás algo más? Escribí "menú" para volver al inicio.',
          esperar_respuesta: false
        }
      }
    });

    edges.push({
      id: 'edge-13',
      source: 'webhook-pago',
      target: 'whatsapp-confirmar-pago',
      type: 'simple'
    });

    yPos += SPACING;

    // ============================================
    // NODO 15: FIN DEL FLUJO
    // ============================================
    nodes.push({
      id: 'fin-flujo',
      type: 'whatsapp',
      position: { x: 200, y: yPos },
      data: {
        label: '🏁 Fin del Flujo',
        icon: 'end',
        config: {
          tipo: 'fin',
          limpiar_variables: true,
          resetear_estado: true
        }
      }
    });

    edges.push({
      id: 'edge-14',
      source: 'whatsapp-confirmar-pago',
      target: 'fin-flujo',
      type: 'simple'
    });

    // ============================================
    // ACTUALIZAR FLOW EN MONGODB
    // ============================================

    console.log('📊 RESUMEN DEL FLUJO:');
    console.log(`   Total de nodos: ${nodes.length}`);
    console.log(`   Total de edges: ${edges.length}`);
    console.log('');
    console.log('🎯 TIPOS DE NODOS:');
    console.log(`   - GPT: ${nodes.filter(n => n.type === 'gpt').length}`);
    console.log(`   - WhatsApp: ${nodes.filter(n => n.type === 'whatsapp').length}`);
    console.log(`   - WooCommerce: ${nodes.filter(n => n.type === 'woocommerce').length}`);
    console.log(`   - MercadoPago: ${nodes.filter(n => n.type === 'mercadopago').length}`);
    console.log(`   - Router: ${nodes.filter(n => n.type === 'router').length}`);
    console.log(`   - Webhook: ${nodes.filter(n => n.type === 'webhook').length}`);
    console.log('');

    const result = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      {
        $set: {
          nodes,
          edges,
          botType: 'visual',
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ FLUJO ACTUALIZADO EXITOSAMENTE\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🎉 El flujo "Veo Veo - Consultar Libros" ha sido optimizado');
      console.log('');
      console.log('📋 CARACTERÍSTICAS:');
      console.log('   ✓ GPT como orquestador conversacional');
      console.log('   ✓ Nodos especializados y reutilizables');
      console.log('   ✓ Variables compartidas entre nodos');
      console.log('   ✓ Integración con WooCommerce y MercadoPago');
      console.log('   ✓ Webhook listener para confirmación de pago');
      console.log('   ✓ Flujo circular (agregar más productos)');
      console.log('');
      console.log('🚀 PRÓXIMOS PASOS:');
      console.log('   1. Recargar el navegador en el flow-builder');
      console.log('   2. Verificar que todos los nodos se muestran correctamente');
      console.log('   3. Implementar los tipos de nodos en el frontend si es necesario');
      console.log('');
    } else {
      console.log('❌ No se pudo actualizar el flujo');
    }

    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

crearFlujoOptimizado();
