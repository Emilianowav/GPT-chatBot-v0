const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function corregirFlujo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));
    const flow = await Flow.findById('695a156681f6d67f0ae9cf40');

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('\n🔧 CORRIGIENDO FLUJO COMPLETO...\n');

    // ============================================
    // LIMPIAR Y RECONSTRUIR FLUJO
    // ============================================

    // Mantener solo el trigger de WhatsApp
    const whatsappTrigger = flow.nodes.find(n => n.id === 'whatsapp-trigger');
    
    // Reconstruir todos los nodos
    flow.nodes = [
      // 1. WhatsApp Trigger (mantener existente)
      whatsappTrigger,

      // 2. GPT Conversacional (NUEVO)
      {
        id: 'gpt-conversacional',
        type: 'gpt',
        position: { x: 350, y: 200 },
        data: {
          label: 'OpenAI (ChatGPT)',
          subtitle: 'Conversacional',
          executionCount: 2,
          hasConnection: true,
          color: '#10a37f',
          config: {
            tipo: 'conversacional',
            module: 'conversacional',
            modelo: 'gpt-4',
            temperatura: 0.7,
            maxTokens: 800,
            personalidad: `Eres el asistente virtual de Librería Veo Veo 📚✏️

PERSONALIDAD:
- Amigable, profesional y servicial
- Usas emojis apropiadamente 😊
- Respondes de forma clara y concisa
- Siempre ayudas al usuario a encontrar lo que busca

TU OBJETIVO:
1. Entender qué necesita el usuario
2. Proporcionar información estática si la tienes
3. Si necesita buscar un libro, recopilar: título, editorial, edición
4. Ser conversacional y natural

IMPORTANTE:
- NO inventes información de productos
- Si el usuario busca un libro, necesitas: título, editorial, edición
- Si falta información, pregunta de forma natural`,
            topicos: [
              {
                id: 'info-local',
                titulo: 'Información del Local',
                contenido: '📍 Estamos en San Juan 1037 - Corrientes Capital.\n\n🕗 Horarios:\n- Lunes a Viernes: 8:30 a 12:00 y 17:00 a 21:00\n- Sábados: 9:00 a 13:00 y 17:00 a 21:00\n\nTe esperamos! 🤗',
                keywords: ['horario', 'direccion', 'ubicacion', 'donde', 'cuando', 'abierto', 'cerrado', 'local']
              },
              {
                id: 'promociones',
                titulo: 'Promociones Bancarias',
                contenido: `Nuestras promociones bancarias vigentes son:\n\n🏦 Banco de Corrientes:\n- Lunes y Miércoles: 3 cuotas sin interés y 20% de bonificación\n- Jueves: 30% Off 6 cuotas sin interés con Bonita Visa\n\n🏦 Banco Nación:\n- Sábados: 10% de reintegro y hasta 3 cuotas sin interés\n\n🏦 Banco Hipotecario:\n- Todos los días: 6 cuotas fijas\n- Miércoles: 25% off con débito\n\n💳 LOCRED: 3 y 6 cuotas sin interés\n💳 NaranjaX: 3 y 6 cuotas sin interés\n💳 Go Cuotas: Hasta 3 cuotas sin interés`,
                keywords: ['promocion', 'descuento', 'cuotas', 'banco', 'tarjeta', 'credito', 'debito', 'oferta']
              },
              {
                id: 'libros-ingles',
                titulo: 'Libros de Inglés',
                contenido: 'Los libros de inglés se realizan únicamente a pedido con seña.\n\nPara realizar tu pedido, comunicate con un asesor: https://wa.me/5493794732177?text=Hola,%20estoy%20interesado%20en%20un%20libro%20de%20inglés',
                keywords: ['ingles', 'english', 'idioma', 'lengua']
              },
              {
                id: 'cambios-devoluciones',
                titulo: 'Política de Cambios',
                contenido: `Si compraste un libro por error:\n\n✏️ Con tu recibo puedes:\n1. Nota de crédito\n2. Cambiar por otro del mismo valor\n3. Elegir uno de mayor valor y abonar diferencia\n4. Uno de menor valor y recibir nota de crédito\n\n📍 Acércate a San Juan 1037\n\nSi tiene fallas de fábrica:\n- Trae el libro sin forrar\n- Con tu recibo o ticket`,
                keywords: ['cambio', 'devolucion', 'error', 'equivocado', 'falla', 'defecto', 'problema']
              },
              {
                id: 'retiro-envio',
                titulo: 'Retiro y Envío',
                contenido: `📍 Retiro en San Juan 1037\n🕗 Horario: 8:30 a 12:00 y 17:00 a 21:00\n⏰ Después de 24hs de la compra\n\n📦 Envíos a cargo del cliente\nPara cotización: https://wa.me/5493794732177?text=Hola,%20compré%20un%20libro%20y%20quiero%20que%20me%20lo%20envíen`,
                keywords: ['retiro', 'retirar', 'envio', 'enviar', 'delivery', 'entrega']
              }
            ],
            variablesRecopilar: [],
            accionesCompletado: [],
            outputFormat: 'text',
            variablesEntrada: ['mensaje_usuario'],
            variablesSalida: ['contexto_conversacion', 'intencion_detectada']
          }
        }
      },

      // 3. GPT Formateador
      {
        id: 'gpt-formateador',
        type: 'gpt',
        position: { x: 600, y: 200 },
        data: {
          label: 'OpenAI (ChatGPT)',
          subtitle: 'Formatear Búsqueda',
          executionCount: 3,
          hasConnection: true,
          color: '#10a37f',
          config: {
            tipo: 'formateador',
            module: 'transform',
            modelo: 'gpt-4',
            temperatura: 0.3,
            maxTokens: 300,
            systemPrompt: `Extrae información estructurada de la conversación para buscar libros.

SCHEMA OBJETIVO:
{
  "titulo": "string (requerido)",
  "editorial": "string (requerido)",
  "edicion": "string (requerido)"
}

INSTRUCCIONES:
1. Analiza el contexto de la conversación
2. Extrae los campos del schema
3. Si un campo falta, márcalo como null
4. Lista los campos faltantes
5. Calcula completitud: (campos completos / 3) * 100

EJEMPLOS:

Input: "Busco Harry Potter de Salamandra"
Output:
{
  "datos_extraidos": {
    "titulo": "Harry Potter",
    "editorial": "Salamandra",
    "edicion": null
  },
  "datos_faltantes": ["edicion"],
  "completitud": 66,
  "listo_para_api": false
}

Input: "Harry Potter y la Piedra Filosofal, editorial Salamandra, primera edición"
Output:
{
  "datos_extraidos": {
    "titulo": "Harry Potter y la Piedra Filosofal",
    "editorial": "Salamandra",
    "edicion": "primera"
  },
  "datos_faltantes": [],
  "completitud": 100,
  "listo_para_api": true
}

IMPORTANTE:
- Sé flexible con variaciones (1ra, primera, 1°)
- Si dice "cualquier edición", marca como "cualquiera"
- Extrae SOLO lo mencionado, no inventes`,
            outputFormat: 'json',
            jsonSchema: '{"datos_extraidos": {"titulo": "", "editorial": "", "edicion": ""}, "datos_faltantes": [], "completitud": 0, "listo_para_api": false}',
            variablesEntrada: ['contexto_conversacion'],
            variablesSalida: ['datos_extraidos', 'datos_faltantes', 'completitud', 'listo_para_api']
          }
        }
      },

      // 4. Validador de Datos (NUEVO)
      {
        id: 'validador-datos',
        type: 'router',
        position: { x: 850, y: 200 },
        data: {
          label: 'Validador',
          subtitle: 'Verificar Datos',
          executionCount: 4,
          hasConnection: true,
          color: '#3b82f6',
          config: {
            tipo: 'validador',
            conditions: [
              {
                label: 'Datos Completos',
                condition: 'listo_para_api == true',
                outputHandle: 'route-1'
              },
              {
                label: 'Faltan Datos',
                condition: 'listo_para_api == false',
                outputHandle: 'route-2'
              }
            ],
            mensajes_dinamicos: {
              falta_titulo: '📚 ¿Cuál es el título del libro que buscas?',
              falta_editorial: '✏️ ¿De qué editorial es el libro?',
              falta_edicion: '📖 ¿Qué edición necesitas? (o escribe "cualquiera")',
              multiple_faltantes: '📚 Para ayudarte mejor, necesito:\n{{datos_faltantes}}\n\n¿Podrías proporcionarme esta información?'
            }
          }
        }
      },

      // 5. WhatsApp Solicitar Datos (NUEVO)
      {
        id: 'whatsapp-solicitar-datos',
        type: 'whatsapp',
        position: { x: 1100, y: 350 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Solicitar Datos',
          executionCount: 5,
          hasConnection: false,
          color: '#25D366',
          config: {
            module: 'send-message',
            mensaje: '📚 Para ayudarte mejor, necesito que me indiques:\n{{datos_faltantes}}\n\n¿Podrías proporcionarme esta información?'
          }
        }
      },

      // 6. Router de Búsqueda
      {
        id: 'router-validacion',
        type: 'router',
        position: { x: 1100, y: 200 },
        data: {
          label: 'Router',
          subtitle: 'Validar Búsqueda',
          executionCount: 5,
          hasConnection: true,
          color: '#f59e0b',
          config: {
            conditions: [
              {
                label: 'Búsqueda válida',
                condition: 'completitud == 100',
                outputHandle: 'route-1'
              },
              {
                label: 'Sin búsqueda',
                condition: 'completitud < 100',
                outputHandle: 'route-2'
              }
            ]
          }
        }
      },

      // 7. WooCommerce Search
      {
        id: 'woocommerce-search',
        type: 'woocommerce',
        position: { x: 1350, y: 100 },
        data: {
          label: 'WooCommerce',
          subtitle: 'Search Product',
          executionCount: 6,
          hasConnection: true,
          color: '#7f54b3',
          config: {
            module: 'woo_search',
            parametros: {
              search: '{{titulo}} {{editorial}} {{edicion}}'
            },
            responseConfig: {
              arrayPath: 'products',
              mapeo: {
                id: 'id',
                nombre: 'name',
                precio_lista: 'regular_price',
                precio_efectivo: 'sale_price',
                stock: 'stock_quantity'
              }
            }
          }
        }
      },

      // 8. WhatsApp Resultados
      {
        id: 'whatsapp-resultados',
        type: 'whatsapp',
        position: { x: 1600, y: 100 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Enviar Resultados',
          executionCount: 7,
          hasConnection: false,
          color: '#25D366',
          config: {
            module: 'send-message',
            mensaje: 'Perfecto😊, estos son los resultados:\n\n{{#each productos}}\n{{add @index 1}}. {{this.nombre}}\n   💰Precio de lista ${{this.precio_lista}}\n   💰Efectivo ${{this.precio_efectivo}}\n   📦 Stock: {{this.stock}}\n\n{{/each}}\n💡 ¿Cuál libro querés agregar?\n\n-> Escribí el número\n-> Escribí 0 para volver al menú'
          }
        }
      },

      // 9. WhatsApp Sin Búsqueda
      {
        id: 'whatsapp-sin-busqueda',
        type: 'whatsapp',
        position: { x: 1350, y: 300 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Mensaje de Ayuda',
          executionCount: 6,
          hasConnection: false,
          color: '#25D366',
          config: {
            module: 'send-message',
            mensaje: 'Para buscar un libro necesito:\n📚 Título\n✏️ Editorial\n📖 Edición\n\n¿Podrías proporcionarme esta información?'
          }
        }
      }
    ];

    // ============================================
    // RECONSTRUIR EDGES
    // ============================================
    flow.edges = [
      // 1. WhatsApp → GPT Conversacional
      {
        id: 'whatsapp-trigger-default-gpt-conversacional',
        source: 'whatsapp-trigger',
        target: 'gpt-conversacional',
        sourceHandle: 'default',
        targetHandle: null,
        type: 'animatedLine'
      },

      // 2. GPT Conversacional → GPT Formateador
      {
        id: 'gpt-conversacional-default-gpt-formateador',
        source: 'gpt-conversacional',
        target: 'gpt-formateador',
        sourceHandle: 'default',
        targetHandle: null,
        type: 'animatedLine'
      },

      // 3. GPT Formateador → Validador
      {
        id: 'gpt-formateador-default-validador-datos',
        source: 'gpt-formateador',
        target: 'validador-datos',
        sourceHandle: 'default',
        targetHandle: null,
        type: 'animatedLine'
      },

      // 4. Validador → Router (datos completos)
      {
        id: 'validador-datos-route-1-router-validacion',
        source: 'validador-datos',
        target: 'router-validacion',
        sourceHandle: 'route-1',
        targetHandle: null,
        type: 'animatedLine',
        data: {
          label: 'Datos Completos',
          condition: 'listo_para_api == true'
        }
      },

      // 5. Validador → WhatsApp Solicitar (faltan datos)
      {
        id: 'validador-datos-route-2-whatsapp-solicitar-datos',
        source: 'validador-datos',
        target: 'whatsapp-solicitar-datos',
        sourceHandle: 'route-2',
        targetHandle: null,
        type: 'animatedLine',
        data: {
          label: 'Faltan Datos',
          condition: 'listo_para_api == false'
        }
      },

      // 6. Router → WooCommerce (búsqueda válida)
      {
        id: 'router-validacion-route-1-woocommerce-search',
        source: 'router-validacion',
        target: 'woocommerce-search',
        sourceHandle: 'route-1',
        targetHandle: null,
        type: 'animatedLine',
        data: {
          label: 'Búsqueda válida',
          condition: 'completitud == 100'
        }
      },

      // 7. Router → WhatsApp Sin Búsqueda
      {
        id: 'router-validacion-route-2-whatsapp-sin-busqueda',
        source: 'router-validacion',
        target: 'whatsapp-sin-busqueda',
        sourceHandle: 'route-2',
        targetHandle: null,
        type: 'animatedLine',
        data: {
          label: 'Sin búsqueda',
          condition: 'completitud < 100'
        }
      },

      // 8. WooCommerce → WhatsApp Resultados
      {
        id: 'woocommerce-search-default-whatsapp-resultados',
        source: 'woocommerce-search',
        target: 'whatsapp-resultados',
        sourceHandle: 'default',
        targetHandle: null,
        type: 'animatedLine'
      }
    ];

    // Guardar cambios
    await flow.save();

    console.log('✅ FLUJO CORREGIDO COMPLETAMENTE');
    console.log('📦 Total nodos:', flow.nodes.length);
    console.log('🔗 Total edges:', flow.edges.length);
    
    console.log('\n🔄 FLUJO COMPLETO:');
    console.log('1. WhatsApp Trigger');
    console.log('2. GPT Conversacional ✅ (personalidad + 5 tópicos)');
    console.log('3. GPT Formateador ✅ (schema dinámico)');
    console.log('4. Validador de Datos ✅ (verifica completitud)');
    console.log('   ├─ Completo → Router');
    console.log('   └─ Incompleto → WhatsApp Solicitar ✅');
    console.log('5. Router de Búsqueda');
    console.log('   ├─ Válido → WooCommerce');
    console.log('   └─ Inválido → WhatsApp Ayuda');
    console.log('6. WooCommerce Search');
    console.log('7. WhatsApp Resultados');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirFlujo();
