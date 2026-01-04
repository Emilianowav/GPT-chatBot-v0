import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const EMPRESA_ID = '6940a9a181b92bfce970fdb5'; // ID de Veo Veo
const API_CONFIG_ID = '695320fda03785dacc8d950b'; // ID de la API de WooCommerce

async function actualizarFlujoGPTVeoVeo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // 1. Actualizar el Flow principal
    const flowData = {
      empresaId: EMPRESA_ID,
      id: 'veo-veo-gpt-conversacional',
      nombre: 'Veo Veo - Asistente GPT Conversacional',
      descripcion: 'Flujo conversacional: WhatsApp → GPT → WooCommerce',
      categoria: 'ventas',
      botType: 'conversacional',
      startNode: 'whatsapp-inicio', // CAMBIO: Ahora empieza en WhatsApp
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
      version: 2,
      createdBy: 'system'
    };

    console.log('📝 Actualizando Flow GPT Conversacional...');
    await db.collection('flows').updateOne(
      { empresaId: EMPRESA_ID, id: flowData.id },
      { $set: flowData }
    );
    console.log('✅ Flow actualizado');

    // 2. Eliminar nodos antiguos
    console.log('🗑️  Eliminando nodos antiguos...');
    await db.collection('flownodes').deleteMany({
      empresaId: EMPRESA_ID,
      flowId: 'veo-veo-gpt-conversacional'
    });

    // 3. Crear nuevos nodos con estructura correcta
    const nodes = [
      // NODO 1: WhatsApp - Recibir mensaje
      {
        empresaId: EMPRESA_ID,
        flowId: 'veo-veo-gpt-conversacional',
        id: 'whatsapp-inicio',
        type: 'input',
        name: 'WhatsApp - Recibir Mensaje',
        message: 'Esperando mensaje del cliente...',
        next: 'gpt-procesar',
        nombreVariable: 'mensaje_usuario',
        validation: {
          type: 'text',
          required: true
        },
        metadata: {
          position: { x: 100, y: 200 },
          description: 'Nodo inicial que recibe mensajes de WhatsApp',
          tags: ['whatsapp', 'input', 'inicio'],
          orden: 1
        },
        activo: true
      },
      
      // NODO 2: GPT - Procesar y decidir acción
      {
        empresaId: EMPRESA_ID,
        flowId: 'veo-veo-gpt-conversacional',
        id: 'gpt-procesar',
        type: 'gpt',
        name: 'GPT - Procesar Consulta',
        message: `Eres un asistente virtual de Librería Veo Veo.

INFORMACIÓN DE LA EMPRESA:
- Nombre: Librería Veo Veo
- Ubicación: San Juan 1037, Corrientes Capital
- Horarios: Lun-Vie 8:30-12:00 y 17:00-21:00, Sáb 9:00-13:00 y 17:00-21:00
- WhatsApp: https://wa.me/5493794732177
- Especialidad: Libros escolares, libros de inglés, útiles escolares

TU TAREA:
1. Analizar el mensaje del cliente
2. Determinar qué necesita (buscar libro, información, compra, etc.)
3. Si busca un libro:
   - Extraer: título, editorial (opcional), edición (opcional)
   - Llamar a buscar_productos() con el título
4. Si quiere comprar:
   - Solicitar datos: cantidad, nombre, teléfono, email
   - Llamar a crear_pedido() con todos los datos
5. Si necesita info general:
   - Responder directamente con la información

FUNCIONES DISPONIBLES:
- buscar_productos(query): Busca en WooCommerce
- obtener_producto(id): Detalles de un producto
- crear_pedido(datos): Crea pedido en WooCommerce
- generar_link_pago(pedido): Link de Mercado Pago

REGLAS:
- NO inventes información de productos
- NO confirmes stock sin consultar API
- Si faltan datos para compra, pregunta uno por uno
- Sé amable y conciso
- Usa emojis moderadamente (📚 💰 📍)`,
        action: {
          type: 'api_call',
          config: {
            model: 'gpt-4-turbo-preview',
            temperature: 0.7,
            max_tokens: 500,
            functions: [
              {
                name: 'buscar_productos',
                description: 'Busca productos en WooCommerce por título',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Término de búsqueda (título del libro)'
                    }
                  },
                  required: ['query']
                }
              },
              {
                name: 'obtener_producto',
                description: 'Obtiene detalles de un producto específico',
                parameters: {
                  type: 'object',
                  properties: {
                    product_id: {
                      type: 'number',
                      description: 'ID del producto'
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
                    product_id: { type: 'number' },
                    cantidad: { type: 'number' },
                    cliente_nombre: { type: 'string' },
                    cliente_telefono: { type: 'string' },
                    cliente_email: { type: 'string' }
                  },
                  required: ['product_id', 'cantidad', 'cliente_nombre', 'cliente_telefono', 'cliente_email']
                }
              },
              {
                name: 'generar_link_pago',
                description: 'Genera link de Mercado Pago',
                parameters: {
                  type: 'object',
                  properties: {
                    pedido_id: { type: 'string' },
                    monto: { type: 'number' },
                    descripcion: { type: 'string' }
                  },
                  required: ['pedido_id', 'monto', 'descripcion']
                }
              }
            ]
          },
          onSuccess: 'gpt-ejecutar-funcion',
          onError: 'gpt-error'
        },
        metadata: {
          position: { x: 400, y: 200 },
          description: 'GPT analiza el mensaje y decide qué hacer',
          tags: ['gpt', 'procesamiento', 'core'],
          orden: 2
        },
        activo: true
      },

      // NODO 3: Ejecutar función (WooCommerce)
      {
        empresaId: EMPRESA_ID,
        flowId: 'veo-veo-gpt-conversacional',
        id: 'gpt-ejecutar-funcion',
        type: 'api_call',
        name: 'WooCommerce - Ejecutar Acción',
        message: 'Ejecutando consulta a WooCommerce...',
        action: {
          type: 'api_call',
          config: {
            // Aquí se ejecutará la función que GPT decidió llamar
            dynamic: true
          },
          onSuccess: 'gpt-responder',
          onError: 'gpt-error'
        },
        metadata: {
          position: { x: 700, y: 200 },
          description: 'Ejecuta la función de WooCommerce que GPT solicitó',
          tags: ['woocommerce', 'api', 'ejecucion'],
          orden: 3
        },
        activo: true
      },

      // NODO 4: GPT - Generar respuesta final
      {
        empresaId: EMPRESA_ID,
        flowId: 'veo-veo-gpt-conversacional',
        id: 'gpt-responder',
        type: 'gpt',
        name: 'GPT - Generar Respuesta',
        message: `Genera una respuesta natural para el cliente basándote en:
1. El mensaje original del cliente
2. Los resultados de la consulta a WooCommerce

Si hay productos:
- Muestra lista numerada con nombre, precio y stock
- Pregunta cuál quiere o si necesita más info

Si se creó un pedido:
- Confirma el pedido
- Muestra el link de pago
- Indica tiempo de retiro (24hs)

Si no hay resultados:
- Informa que no hay stock
- Ofrece reserva o contacto con asesor

Sé amable, claro y conciso.`,
        action: {
          type: 'api_call',
          config: {
            model: 'gpt-4-turbo-preview',
            temperature: 0.7,
            max_tokens: 300
          },
          onSuccess: 'whatsapp-enviar',
          onError: 'gpt-error'
        },
        metadata: {
          position: { x: 1000, y: 200 },
          description: 'GPT genera respuesta natural con los resultados',
          tags: ['gpt', 'respuesta', 'final'],
          orden: 4
        },
        activo: true
      },

      // NODO 5: WhatsApp - Enviar respuesta
      {
        empresaId: EMPRESA_ID,
        flowId: 'veo-veo-gpt-conversacional',
        id: 'whatsapp-enviar',
        type: 'message',
        name: 'WhatsApp - Enviar Respuesta',
        message: '{{gpt_response}}',
        next: 'whatsapp-inicio', // Vuelve al inicio para continuar conversación
        metadata: {
          position: { x: 1300, y: 200 },
          description: 'Envía la respuesta generada por GPT al cliente',
          tags: ['whatsapp', 'output', 'respuesta'],
          orden: 5
        },
        activo: true
      },

      // NODO 6: Error - Manejo de errores
      {
        empresaId: EMPRESA_ID,
        flowId: 'veo-veo-gpt-conversacional',
        id: 'gpt-error',
        type: 'message',
        name: 'Error - Fallback',
        message: 'Disculpá, estamos teniendo problemas técnicos. Por favor contactá directamente:\n\n👉 https://wa.me/5493794732177?text=Hola,%20necesito%20ayuda',
        next: 'whatsapp-inicio',
        metadata: {
          position: { x: 700, y: 400 },
          description: 'Mensaje de error cuando algo falla',
          tags: ['error', 'fallback'],
          orden: 6
        },
        activo: true
      }
    ];

    console.log('📝 Creando nuevos nodos...');
    for (const node of nodes) {
      await db.collection('flownodes').insertOne(node);
      console.log(`  ✅ Nodo ${node.id} creado`);
    }

    console.log('\n🎉 FLUJO GPT DE VEO VEO ACTUALIZADO EXITOSAMENTE\n');
    console.log('📊 NUEVA ESTRUCTURA:');
    console.log('  1. WhatsApp Inicio → Recibe mensaje');
    console.log('  2. GPT Procesar → Analiza y decide acción');
    console.log('  3. WooCommerce → Ejecuta función (buscar/crear pedido)');
    console.log('  4. GPT Responder → Genera respuesta natural');
    console.log('  5. WhatsApp Enviar → Envía al cliente');
    console.log('  6. Error → Manejo de errores');
    console.log('\n🔄 FLUJO COMPLETO:');
    console.log('  WhatsApp → GPT → WooCommerce → GPT → WhatsApp (loop)');
    console.log('\n🔍 VERIFICACIÓN:');
    console.log('  1. Recargar http://localhost:3001/dashboard/flow-builder');
    console.log('  2. Ver flujo actualizado con 6 nodos');
    console.log('  3. Verificar conexiones entre nodos');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarFlujoGPTVeoVeo();
