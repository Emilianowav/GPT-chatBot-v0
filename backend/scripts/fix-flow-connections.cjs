const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFlowConnections() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');

    // Flujo corregido 100% funcional
    const fixedFlow = {
      _id: new ObjectId(FLOW_ID),
      nombre: 'WooCommerce - Búsqueda Simple',
      descripcion: 'Flujo minimalista para búsqueda de productos en WooCommerce',
      activo: true,
      empresaId: 'Veo Veo',
      botType: 'visual',
      startNode: '1',
      variables: {},
      triggers: {
        keywords: [],
        patterns: [],
        priority: 0,
        primeraRespuesta: true
      },
      whatsapp: {
        phoneNumberId: '906667632531979',
        verifyToken: '2001-ic'
      },
      woocommerce: {
        eshopUrl: 'https://www.veoveolibros.com.ar',
        consumerKey: 'ck_xxx',
        consumerSecret: 'cs_xxx'
      },
      nodes: [
        {
          id: '1',
          type: 'webhook',
          position: { x: 100, y: 200 },
          data: {
            label: 'Webhook WhatsApp',
            type: 'webhook',
            config: {
              source: 'whatsapp',
              phoneNumberId: '906667632531979'
            }
          }
        },
        {
          id: 'gpt-conversacional',
          type: 'gpt',
          position: { x: 350, y: 200 },
          data: {
            label: 'GPT Conversacional',
            type: 'gpt',
            config: {
              tipo: 'conversacional',
              modelo: 'gpt-4o-mini',
              personalidad: 'Sos un asistente de librería amigable. Ayudás a buscar libros.',
              topicos: ['libros', 'literatura'],
              mensajeInput: '{{1.message}}',
              contextoAdicional: 'Cliente: {{1.profileName}}'
            }
          }
        },
        {
          id: 'whatsapp-respuesta',
          type: 'whatsapp',
          position: { x: 350, y: 50 },
          data: {
            label: 'Respuesta GPT',
            type: 'whatsapp',
            config: {
              module: 'send-message',
              message: '{{gpt-conversacional.respuesta_gpt}}',
              to: '{{1.from}}'
            }
          }
        },
        {
          id: 'gpt-formateador',
          type: 'gpt',
          position: { x: 600, y: 200 },
          data: {
            label: 'Formateador',
            type: 'gpt',
            config: {
              tipo: 'formateador',
              modelo: 'gpt-3.5-turbo',
              mensajeInput: '{{1.message}}',
              configuracionExtraccion: {
                instruccionesExtraccion: 'Extrae el título EXACTO del libro que el usuario mencionó. Si solo saludó, deja titulo_libro en null.',
                fuenteDatos: 'historial_completo',
                tipoFormato: 'json',
                estructuraJSON: '{ "titulo_libro": string | null }',
                camposEsperados: [
                  {
                    nombre: 'titulo_libro',
                    tipo: 'string',
                    requerido: false,
                    valorPorDefecto: null
                  }
                ]
              }
            }
          }
        },
        {
          id: 'router',
          type: 'router',
          position: { x: 850, y: 200 },
          data: {
            label: 'Router',
            type: 'router',
            config: {
              routes: [
                {
                  id: 'buscar',
                  label: 'Buscar en WooCommerce',
                  condition: '{{titulo_libro}} exists',
                  targetNode: 'woocommerce'
                }
              ]
            }
          }
        },
        {
          id: 'woocommerce',
          type: 'woocommerce',
          position: { x: 1100, y: 200 },
          data: {
            label: 'WooCommerce',
            type: 'woocommerce',
            config: {
              module: 'search-product',
              search: '{{titulo_libro}}',
              limit: '10',
              orderBy: 'title'
            }
          }
        },
        {
          id: 'whatsapp-resultados',
          type: 'whatsapp',
          position: { x: 1350, y: 200 },
          data: {
            label: 'Enviar Resultados',
            type: 'whatsapp',
            config: {
              module: 'send-message',
              mensaje: '📚 Encontré {{woocommerce.productos.length || 0}} resultados para "{{titulo_libro}}":\n\n{{woocommerce.productos}}',
              to: '{{1.from}}'
            }
          }
        }
      ],
      edges: [
        {
          id: 'e1',
          source: '1',
          target: 'gpt-conversacional',
          type: 'default',
          animated: true
        },
        {
          id: 'e2',
          source: 'gpt-conversacional',
          target: 'whatsapp-respuesta',
          type: 'default'
        },
        {
          id: 'e3',
          source: 'gpt-conversacional',
          target: 'gpt-formateador',
          type: 'default',
          animated: true
        },
        {
          id: 'e4',
          source: 'gpt-formateador',
          target: 'router',
          type: 'default',
          animated: true
        },
        {
          id: 'e5',
          source: 'router',
          target: 'woocommerce',
          type: 'default',
          animated: true,
          label: 'Con datos'
        },
        {
          id: 'e6',
          source: 'woocommerce',
          target: 'whatsapp-resultados',
          type: 'default',
          animated: true
        }
      ],
      settings: {
        timeout: 300,
        maxRetries: 3,
        enableGPT: true,
        saveHistory: true,
        permitirAbandonar: true,
        timeoutMinutos: 30
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('🔄 Actualizando flujo en neural_chatbot...\n');
    
    await flowsCollection.replaceOne(
      { _id: new ObjectId(FLOW_ID) },
      fixedFlow,
      { upsert: true }
    );

    console.log('✅ Flujo actualizado correctamente');
    console.log(`   Nodos: ${fixedFlow.nodes.length}`);
    console.log(`   Edges: ${fixedFlow.edges.length}`);
    console.log('\n📋 Conexiones:');
    fixedFlow.edges.forEach(edge => {
      console.log(`   ${edge.source} → ${edge.target} ${edge.label ? `(${edge.label})` : ''}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlowConnections();
