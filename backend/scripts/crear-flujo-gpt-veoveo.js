import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const EMPRESA_ID = '6940a9a181b92bfce970fdb5'; // ID de Veo Veo
const API_CONFIG_ID = '695320fda03785dacc8d950b'; // ID de la API de WooCommerce

async function crearFlujoGPTVeoVeo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // 1. Crear el Flow principal (GPT Conversacional)
    const flowData = {
      empresaId: EMPRESA_ID,
      id: 'veo-veo-gpt-conversacional',
      nombre: 'Veo Veo - Asistente GPT Conversacional',
      descripcion: 'Flujo conversacional inteligente con GPT para búsqueda y compra de libros sin pasos predefinidos',
      categoria: 'ventas',
      botType: 'conversacional',
      startNode: 'gpt-inicio',
      variables: {
        EMPRESA_NOMBRE: 'Librería Veo Veo',
        EMPRESA_DIRECCION: 'San Juan 1037, Corrientes Capital',
        EMPRESA_HORARIO: 'Lun-Vie 8:30-12:00 y 17:00-21:00, Sáb 9:00-13:00 y 17:00-21:00',
        EMPRESA_WHATSAPP: '5493794732177',
        EMPRESA_WHATSAPP_LINK: 'https://wa.me/5493794732177',
        WOOCOMMERCE_URL: 'https://www.veoveolibros.com.ar',
        RETIRO_TIEMPO: '24 horas',
        PAGO_EXPIRACION: '10 minutos'
      },
      triggers: {
        keywords: [
          'hola',
          'menu',
          'inicio',
          'ayuda',
          'consulta',
          'libro',
          'libros',
          'comprar',
          'buscar',
          'catalogo',
          'catálogo',
          'precio',
          'stock',
          'disponible'
        ],
        priority: 10,
        primeraRespuesta: true
      },
      apiConfig: {
        apiConfigurationId: new mongoose.Types.ObjectId(API_CONFIG_ID),
        workflowId: 'consultar-libros',
        baseUrl: 'https://www.veoveolibros.com.ar/wp-json/wc/v3',
        endpoints: [
          {
            id: 'buscar-productos',
            nombre: 'Buscar Productos',
            metodo: 'GET',
            path: '/products'
          },
          {
            id: 'obtener-producto',
            nombre: 'Obtener Producto',
            metodo: 'GET',
            path: '/products/{id}'
          },
          {
            id: 'crear-pedido',
            nombre: 'Crear Pedido',
            metodo: 'POST',
            path: '/orders'
          },
          {
            id: 'generar-link-pago',
            nombre: 'Generar Link de Pago',
            metodo: 'POST',
            path: '/mercadopago/payment-link'
          }
        ]
      },
      settings: {
        timeout: 600,
        maxRetries: 3,
        enableGPT: true,
        saveHistory: true,
        permitirAbandonar: true,
        timeoutMinutos: 30
      },
      activo: true,
      version: 1,
      createdBy: 'system'
    };

    console.log('📝 Creando Flow GPT Conversacional...');
    const flowResult = await db.collection('flows').updateOne(
      { empresaId: EMPRESA_ID, id: flowData.id },
      { $set: flowData },
      { upsert: true }
    );
    console.log(`✅ Flow creado/actualizado: ${flowResult.upsertedId || 'existente'}`);

    // 2. Crear nodos del flujo
    const nodes = [
      {
        empresaId: EMPRESA_ID,
        flowId: 'veo-veo-gpt-conversacional',
        id: 'gpt-inicio',
        type: 'gpt',
        name: 'GPT - Asistente Conversacional',
        message: `Eres un asistente virtual de Librería Veo Veo, especializada en libros escolares y de inglés.

INFORMACIÓN DE LA EMPRESA:
- Nombre: Librería Veo Veo
- Ubicación: San Juan 1037, Corrientes Capital
- Horarios: Lunes a Viernes 8:30-12:00 y 17:00-21:00, Sábados 9:00-13:00 y 17:00-21:00
- WhatsApp atención: https://wa.me/5493794732177
- Especialidad: Libros escolares, libros de inglés, útiles escolares

CAPACIDADES:
1. Buscar libros en el catálogo (tienes acceso a la API de WooCommerce)
2. Mostrar precios y stock
3. Procesar compras y generar links de pago
4. Brindar información sobre promociones, envíos y retiros
5. Derivar a atención humana cuando sea necesario

INSTRUCCIONES:
- Sé amable, profesional y conciso
- Usa emojis moderadamente (📚 📖 💰 📍 🕗)
- Si el cliente busca un libro, pregunta: Título, Editorial (opcional), Edición (opcional)
- Consulta la API de WooCommerce para buscar productos
- Si hay stock, muestra opciones con precio
- Si no hay stock, ofrece reserva y deriva a atención humana
- Para finalizar compra, solicita: cantidad, nombre, teléfono, email
- Genera link de Mercado Pago para el pago
- Confirma retiro en 24hs

HERRAMIENTAS DISPONIBLES:
- buscar_productos(query): Busca libros en WooCommerce
- obtener_producto(id): Obtiene detalles de un producto
- crear_pedido(datos): Crea pedido en WooCommerce
- generar_link_pago(pedido): Genera link de Mercado Pago

REGLAS:
- NO inventes información de productos
- NO confirmes stock sin consultar la API
- NO proceses pagos sin datos completos del cliente
- SI el cliente pregunta por libros de inglés, informa que son a pedido con seña
- SI hay dudas complejas, deriva a atención humana`,
        action: {
          type: 'api_call',
          config: {
            model: 'gpt-4-turbo-preview',
            temperature: 0.7,
            max_tokens: 500,
            functions: [
              {
                name: 'buscar_productos',
                description: 'Busca productos en el catálogo de WooCommerce',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Término de búsqueda (título del libro)'
                    },
                    per_page: {
                      type: 'number',
                      description: 'Cantidad de resultados (default: 10)'
                    }
                  },
                  required: ['query']
                }
              },
              {
                name: 'obtener_producto',
                description: 'Obtiene detalles completos de un producto',
                parameters: {
                  type: 'object',
                  properties: {
                    product_id: {
                      type: 'number',
                      description: 'ID del producto en WooCommerce'
                    }
                  },
                  required: ['product_id']
                }
              },
              {
                name: 'crear_pedido',
                description: 'Crea un pedido en WooCommerce',
                parameters: {
                  type: 'object',
                  properties: {
                    product_id: {
                      type: 'number',
                      description: 'ID del producto'
                    },
                    cantidad: {
                      type: 'number',
                      description: 'Cantidad de productos'
                    },
                    cliente_nombre: {
                      type: 'string',
                      description: 'Nombre completo del cliente'
                    },
                    cliente_telefono: {
                      type: 'string',
                      description: 'Teléfono del cliente'
                    },
                    cliente_email: {
                      type: 'string',
                      description: 'Email del cliente'
                    }
                  },
                  required: ['product_id', 'cantidad', 'cliente_nombre', 'cliente_telefono', 'cliente_email']
                }
              },
              {
                name: 'generar_link_pago',
                description: 'Genera link de pago de Mercado Pago',
                parameters: {
                  type: 'object',
                  properties: {
                    pedido_id: {
                      type: 'string',
                      description: 'ID del pedido de WooCommerce'
                    },
                    monto: {
                      type: 'number',
                      description: 'Monto total a pagar'
                    },
                    descripcion: {
                      type: 'string',
                      description: 'Descripción del pedido'
                    }
                  },
                  required: ['pedido_id', 'monto', 'descripcion']
                }
              }
            ]
          },
          onSuccess: 'gpt-respuesta',
          onError: 'gpt-error'
        },
        metadata: {
          position: { x: 100, y: 100 },
          description: 'Nodo principal de GPT que maneja toda la conversación',
          tags: ['gpt', 'conversacional', 'principal'],
          orden: 1
        },
        activo: true
      },
      {
        empresaId: EMPRESA_ID,
        flowId: 'veo-veo-gpt-conversacional',
        id: 'gpt-respuesta',
        type: 'message',
        name: 'Respuesta GPT',
        message: '{{gpt_response}}',
        next: 'gpt-inicio',
        metadata: {
          position: { x: 300, y: 100 },
          description: 'Envía la respuesta generada por GPT',
          tags: ['respuesta', 'gpt'],
          orden: 2
        },
        activo: true
      },
      {
        empresaId: EMPRESA_ID,
        flowId: 'veo-veo-gpt-conversacional',
        id: 'gpt-error',
        type: 'message',
        name: 'Error GPT',
        message: 'Disculpá, estamos teniendo problemas técnicos. Por favor contactá directamente a un asesor:\n\n👉 https://wa.me/5493794732177?text=Hola,%20necesito%20ayuda',
        metadata: {
          position: { x: 300, y: 250 },
          description: 'Mensaje de error cuando GPT falla',
          tags: ['error', 'fallback'],
          orden: 3
        },
        activo: true
      }
    ];

    console.log('📝 Creando nodos del flujo...');
    for (const node of nodes) {
      const nodeResult = await db.collection('flownodes').updateOne(
        { empresaId: EMPRESA_ID, flowId: node.flowId, id: node.id },
        { $set: node },
        { upsert: true }
      );
      console.log(`  ✅ Nodo ${node.id}: ${nodeResult.upsertedId || 'actualizado'}`);
    }

    console.log('\n🎉 FLUJO GPT DE VEO VEO CREADO EXITOSAMENTE\n');
    console.log('📊 RESUMEN:');
    console.log(`  - Flow ID: veo-veo-gpt-conversacional`);
    console.log(`  - Empresa ID: ${EMPRESA_ID}`);
    console.log(`  - Tipo: Conversacional con GPT`);
    console.log(`  - Nodos creados: ${nodes.length}`);
    console.log(`  - API Config ID: ${API_CONFIG_ID}`);
    console.log(`  - Triggers: ${flowData.triggers.keywords.length} keywords`);
    console.log('\n🔍 VERIFICACIÓN:');
    console.log('  1. Ir a http://localhost:3001/dashboard/flow-builder');
    console.log('  2. Buscar el flujo "Veo Veo - Asistente GPT Conversacional"');
    console.log('  3. Verificar que se visualice correctamente');
    console.log('\n💡 FUNCIONES GPT DISPONIBLES:');
    console.log('  - buscar_productos(query)');
    console.log('  - obtener_producto(product_id)');
    console.log('  - crear_pedido(datos)');
    console.log('  - generar_link_pago(pedido)');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearFlujoGPTVeoVeo();
