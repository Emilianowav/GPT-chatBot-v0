const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function verificarYForzar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }), 'flows');
    
    // Buscar el flujo directamente
    const flow = await Flow.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('\n📊 ESTADO ACTUAL:');
    console.log('Nodos:', flow.nodes.length);
    console.log('Edges:', flow.edges.length);

    // Forzar actualización completa
    console.log('\n🔧 FORZANDO ACTUALIZACIÓN...\n');

    const whatsappTrigger = flow.nodes.find(n => n.id === 'whatsapp-trigger') || {
      id: 'whatsapp-trigger',
      type: 'whatsapp',
      position: { x: 100, y: 200 },
      data: {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Watch Events',
        executionCount: 1,
        hasConnection: true,
        color: '#25D366',
        config: { module: 'watch-events' }
      }
    };

    // Crear array completo de nodos
    const nodosCompletos = [
      whatsappTrigger,
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

TU OBJETIVO:
1. Entender qué necesita el usuario
2. Proporcionar información estática si la tienes
3. Si necesita buscar un libro, recopilar: título, editorial, edición`,
            topicos: [
              {
                id: 'info-local',
                titulo: 'Información del Local',
                contenido: '📍 San Juan 1037 - Corrientes Capital\n🕗 Lunes a Viernes: 8:30-12 y 17-21\n🕗 Sábados: 9-13 y 17-21',
                keywords: ['horario', 'direccion', 'ubicacion']
              },
              {
                id: 'promociones',
                titulo: 'Promociones Bancarias',
                contenido: '🏦 Banco de Corrientes: 3 cuotas sin interés\n🏦 Banco Nación: 10% reintegro',
                keywords: ['promocion', 'descuento', 'cuotas']
              }
            ],
            variablesEntrada: ['mensaje_usuario'],
            variablesSalida: ['contexto_conversacion', 'intencion_detectada']
          }
        }
      },
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
            systemPrompt: 'Extrae información estructurada: {titulo, editorial, edicion}. Calcula completitud.',
            outputFormat: 'json',
            jsonSchema: '{"datos_extraidos": {"titulo": "", "editorial": "", "edicion": ""}, "datos_faltantes": [], "completitud": 0, "listo_para_api": false}',
            variablesEntrada: ['contexto_conversacion'],
            variablesSalida: ['datos_extraidos', 'datos_faltantes', 'completitud', 'listo_para_api']
          }
        }
      },
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
              { label: 'Datos Completos', condition: 'listo_para_api == true', outputHandle: 'route-1' },
              { label: 'Faltan Datos', condition: 'listo_para_api == false', outputHandle: 'route-2' }
            ]
          }
        }
      },
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
            mensaje: '📚 Necesito: {{datos_faltantes}}'
          }
        }
      },
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
              { label: 'Búsqueda válida', condition: 'completitud == 100', outputHandle: 'route-1' },
              { label: 'Sin búsqueda', condition: 'completitud < 100', outputHandle: 'route-2' }
            ]
          }
        }
      },
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
            parametros: { search: '{{titulo}} {{editorial}} {{edicion}}' }
          }
        }
      },
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
            mensaje: 'Perfecto😊, estos son los resultados'
          }
        }
      },
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
            mensaje: 'Para buscar necesito: título, editorial, edición'
          }
        }
      }
    ];

    const edgesCompletos = [
      { id: 'e1', source: 'whatsapp-trigger', target: 'gpt-conversacional', sourceHandle: 'default', type: 'animatedLine' },
      { id: 'e2', source: 'gpt-conversacional', target: 'gpt-formateador', sourceHandle: 'default', type: 'animatedLine' },
      { id: 'e3', source: 'gpt-formateador', target: 'validador-datos', sourceHandle: 'default', type: 'animatedLine' },
      { id: 'e4', source: 'validador-datos', target: 'router-validacion', sourceHandle: 'route-1', type: 'animatedLine', data: { label: 'Completo' } },
      { id: 'e5', source: 'validador-datos', target: 'whatsapp-solicitar-datos', sourceHandle: 'route-2', type: 'animatedLine', data: { label: 'Incompleto' } },
      { id: 'e6', source: 'router-validacion', target: 'woocommerce-search', sourceHandle: 'route-1', type: 'animatedLine', data: { label: 'Válido' } },
      { id: 'e7', source: 'router-validacion', target: 'whatsapp-sin-busqueda', sourceHandle: 'route-2', type: 'animatedLine', data: { label: 'Inválido' } },
      { id: 'e8', source: 'woocommerce-search', target: 'whatsapp-resultados', sourceHandle: 'default', type: 'animatedLine' }
    ];

    // Actualizar usando updateOne para forzar
    await Flow.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          nodes: nodosCompletos,
          edges: edgesCompletos,
          updatedAt: new Date()
        } 
      }
    );

    console.log('✅ Actualización forzada aplicada');

    // Verificar inmediatamente
    const flowVerificado = await Flow.findById(flow._id);
    console.log('\n📊 VERIFICACIÓN POST-ACTUALIZACIÓN:');
    console.log('Nodos:', flowVerificado.nodes.length);
    console.log('Edges:', flowVerificado.edges.length);

    if (flowVerificado.nodes.length === 9) {
      console.log('\n✅ ¡FLUJO CORREGIDO EXITOSAMENTE!');
      flowVerificado.nodes.forEach((n, i) => {
        console.log(`${i + 1}. ${n.id} - ${n.data.subtitle}`);
      });
    } else {
      console.log('\n❌ ERROR: No se guardaron todos los nodos');
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarYForzar();
