const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function implementarArquitectura() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));
    const flow = await Flow.findById('695a156681f6d67f0ae9cf40');

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('\n🏗️ Implementando arquitectura modular...');

    // ============================================
    // NODO 1: WhatsApp Trigger (ya existe)
    // ============================================

    // ============================================
    // NODO 2: GPT CONVERSACIONAL (actualizar)
    // ============================================
    const gptConversacionalIndex = flow.nodes.findIndex(n => n.id === 'gpt-conversacional');
    if (gptConversacionalIndex !== -1) {
      flow.nodes[gptConversacionalIndex].data.config = {
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
            contenido: `Nuestras promociones bancarias vigentes son:

🏦 Banco de Corrientes:
- Lunes y Miércoles: 3 cuotas sin interés y 20% de bonificación con +Banco
- Jueves: 30% Off 6 cuotas sin interés con Bonita Visa (tope $50.000)

🏦 Banco Nación:
- Sábados con MODO BNA+: 10% de reintegro y hasta 3 cuotas sin interés (tope $10.000)

🏦 Banco Hipotecario:
- Todos los días: 6 cuotas fijas con tarjeta de crédito
- Miércoles: 25% off con débito (tope $10.000)

💳 LOCRED: 3 y 6 cuotas sin interés todos los días
💳 NaranjaX: planZ 3 cuotas sin interés, 6 cuotas sin interés
💳 Go Cuotas: Hasta 3 cuotas sin interés con débito

Recordamos que las promociones son sobre el precio de lista`,
            keywords: ['promocion', 'descuento', 'cuotas', 'banco', 'tarjeta', 'credito', 'debito', 'oferta']
          },
          {
            id: 'libros-ingles',
            titulo: 'Libros de Inglés',
            contenido: 'Los libros de inglés se realizan únicamente a pedido con seña.\n\nPara realizar tu pedido, comunicate con un asesor de ventas: https://wa.me/5493794732177?text=Hola,%20estoy%20interesado%20en%20un%20libro%20de%20inglés',
            keywords: ['ingles', 'english', 'idioma', 'lengua']
          },
          {
            id: 'cambios-devoluciones',
            titulo: 'Política de Cambios y Devoluciones',
            contenido: `Si compraste un libro por error, tenemos estas opciones:

✏️ Después de corroborar que el libro está en el mismo estado y con tu recibo:

1. Nota de crédito con el monto del libro
2. Cambiar por otro del mismo valor
3. Elegir uno de mayor valor y abonar la diferencia
4. Uno de menor valor y recibir nota de crédito

📍 Para completar la gestión acércate a San Juan 1037

Si el libro tiene fallas de fábrica:
- Acércate con el libro en buenas condiciones (sin forrar)
- Trae tu recibo o ticket`,
            keywords: ['cambio', 'devolucion', 'error', 'equivocado', 'falla', 'defecto', 'problema']
          },
          {
            id: 'retiro-envio',
            titulo: 'Retiro y Envío',
            contenido: `📍 Podes retirar tu libro por San Juan 1037

🕗 Horario: 8:30 a 12:00 y 17:00 a 21:00

⏰ Podes retirarlo después de las 24hs de realizada la compra

📦 Envíos:
Los envíos son a cargo del cliente. Para cotización dentro de Corrientes, comunicate con nuestros asesores: https://wa.me/5493794732177?text=Hola,%20compré%20un%20libro%20y%20quiero%20que%20me%20lo%20envíen`,
            keywords: ['retiro', 'retirar', 'envio', 'enviar', 'delivery', 'entrega']
          }
        ],
        variablesRecopilar: [],
        accionesCompletado: [],
        outputFormat: 'text',
        variablesEntrada: ['mensaje_usuario'],
        variablesSalida: ['contexto_conversacion', 'intencion_detectada']
      };
    }

    // ============================================
    // NODO 3: GPT FORMATEADOR (actualizar)
    // ============================================
    const gptFormateadorIndex = flow.nodes.findIndex(n => n.id === 'gpt-formateador');
    if (gptFormateadorIndex !== -1) {
      flow.nodes[gptFormateadorIndex].data.config = {
        tipo: 'formateador',
        module: 'transform',
        modelo: 'gpt-4',
        temperatura: 0.3,
        maxTokens: 300,
        systemPrompt: `Tu tarea es extraer información estructurada de la conversación para buscar libros.

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
5. Calcula el % de completitud (campos completos / total * 100)

EJEMPLOS:

Conversación: "Busco Harry Potter de Salamandra"
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

Conversación: "Harry Potter y la Piedra Filosofal, editorial Salamandra, primera edición"
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
- Sé flexible con variaciones (1ra, primera, 1°, etc.)
- Si el usuario dice "cualquier edición", marca edicion como "cualquiera"
- Extrae SOLO lo que el usuario menciona, no inventes`,
        outputFormat: 'json',
        jsonSchema: '{"datos_extraidos": {"titulo": "", "editorial": "", "edicion": ""}, "datos_faltantes": [], "completitud": 0, "listo_para_api": false}',
        variablesEntrada: ['contexto_conversacion'],
        variablesSalida: ['datos_extraidos', 'datos_faltantes', 'completitud', 'listo_para_api']
      };
    }

    // ============================================
    // NODO 4: VALIDADOR DE DATOS (nuevo)
    // ============================================
    const validadorNode = {
      id: 'validador-datos',
      type: 'router',
      position: { x: 900, y: 200 },
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
            falta_edicion: '📖 ¿Qué edición necesitas? (o escribe "cualquiera" si no importa)',
            multiple_faltantes: '📚 Para ayudarte mejor, necesito que me indiques:\n\n{{#each datos_faltantes}}- {{this}}\n{{/each}}\n¿Podrías proporcionarme esta información?'
          }
        }
      }
    };

    // ============================================
    // NODO 5: WHATSAPP SOLICITAR DATOS (nuevo)
    // ============================================
    const whatsappSolicitarDatos = {
      id: 'whatsapp-solicitar-datos',
      type: 'whatsapp',
      position: { x: 1150, y: 350 },
      data: {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Solicitar Datos Faltantes',
        executionCount: 5,
        hasConnection: false,
        color: '#25D366',
        config: {
          module: 'send-message',
          mensaje: '📚 Para ayudarte mejor, necesito que me indiques:\n\n{{#each datos_faltantes}}- {{this}}\n{{/each}}\n\n¿Podrías proporcionarme esta información?'
        }
      }
    };

    // ============================================
    // NODO 6: ROUTER DE INTENCIÓN (actualizar router existente)
    // ============================================
    const routerIndex = flow.nodes.findIndex(n => n.id === 'router-validacion');
    if (routerIndex !== -1) {
      flow.nodes[routerIndex].position.x = 1150;
      flow.nodes[routerIndex].data.executionCount = 5;
      flow.nodes[routerIndex].data.subtitle = 'Router de Búsqueda';
      flow.nodes[routerIndex].data.config.conditions = [
        {
          label: 'Buscar en WooCommerce',
          condition: 'completitud == 100',
          outputHandle: 'route-1'
        },
        {
          label: 'Sin Búsqueda',
          condition: 'completitud < 100',
          outputHandle: 'route-2'
        }
      ];
    }

    // Actualizar posiciones de nodos existentes
    const wooIndex = flow.nodes.findIndex(n => n.id === 'woocommerce-search');
    if (wooIndex !== -1) {
      flow.nodes[wooIndex].position.x = 1400;
      flow.nodes[wooIndex].data.executionCount = 6;
    }

    const whatsappResultadosIndex = flow.nodes.findIndex(n => n.id === 'whatsapp-resultados');
    if (whatsappResultadosIndex !== -1) {
      flow.nodes[whatsappResultadosIndex].position.x = 1650;
      flow.nodes[whatsappResultadosIndex].data.executionCount = 7;
    }

    const whatsappSinBusquedaIndex = flow.nodes.findIndex(n => n.id === 'whatsapp-sin-busqueda');
    if (whatsappSinBusquedaIndex !== -1) {
      flow.nodes[whatsappSinBusquedaIndex].position.x = 1400;
      flow.nodes[whatsappSinBusquedaIndex].position.y = 450;
      flow.nodes[whatsappSinBusquedaIndex].data.executionCount = 6;
    }

    // Insertar nuevos nodos
    const formateadorIndex = flow.nodes.findIndex(n => n.id === 'gpt-formateador');
    flow.nodes.splice(formateadorIndex + 1, 0, validadorNode);
    flow.nodes.splice(formateadorIndex + 2, 0, whatsappSolicitarDatos);

    // ============================================
    // ACTUALIZAR EDGES
    // ============================================
    
    // Cambiar edge: GPT Formateador → Router a GPT Formateador → Validador
    const formateadorToRouterEdge = flow.edges.find(e => 
      e.source === 'gpt-formateador' && e.target === 'router-validacion'
    );
    if (formateadorToRouterEdge) {
      formateadorToRouterEdge.target = 'validador-datos';
      formateadorToRouterEdge.id = 'gpt-formateador-default-validador-datos';
    }

    // Nuevo edge: Validador → Router (datos completos)
    flow.edges.push({
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
    });

    // Nuevo edge: Validador → WhatsApp Solicitar Datos (faltan datos)
    flow.edges.push({
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
    });

    // Guardar cambios
    await flow.save();

    console.log('\n✅ Arquitectura modular implementada correctamente');
    console.log('📦 Total nodos:', flow.nodes.length);
    console.log('🔗 Total edges:', flow.edges.length);
    
    console.log('\n🔄 NUEVA ARQUITECTURA MODULAR:');
    console.log('1. WhatsApp Watch Events (trigger)');
    console.log('2. GPT Conversacional (personalidad + tópicos estáticos Veo Veo)');
    console.log('3. GPT Formateador (extractor con schema dinámico)');
    console.log('4. Validador de Datos (verifica completitud)');
    console.log('   ├─ Datos Completos → Router');
    console.log('   └─ Faltan Datos → WhatsApp Solicitar');
    console.log('5. Router de Búsqueda');
    console.log('   ├─ Buscar → WooCommerce');
    console.log('   └─ Sin Búsqueda → WhatsApp Ayuda');
    console.log('6. WooCommerce Search / WhatsApp');
    console.log('7. WhatsApp Resultados');

    console.log('\n📊 RESPONSABILIDADES:');
    console.log('✅ Conversacional: Conversar + Info Estática');
    console.log('✅ Formateador: Extraer datos estructurados');
    console.log('✅ Validador: Verificar completitud');
    console.log('✅ Router: Dirigir según datos');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

implementarArquitectura();
