require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixFlowComplete() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    
    // Actualizar flujo con configuración correcta
    await flowsCollection.updateOne(
      { _id: flowId },
      {
        $set: {
          nodes: [
            // 1. Webhook WhatsApp
            {
              id: 'webhook-whatsapp',
              type: 'webhook',
              category: 'trigger',
              position: { x: 100, y: 300 },
              data: {
                label: 'WhatsApp Business Cloud',
                subtitle: 'Watch Events',
                executionCount: 1,
                config: {
                  tipo: 'listener',
                  module: 'watch-events',
                  empresaId: '6940a9a181b92bfce970fdb5',
                  phoneNumberId: '906667632531979'
                }
              }
            },
            
            // 2. GPT Conversacional
            {
              id: 'gpt-conversacional',
              type: 'gpt',
              category: 'processor',
              position: { x: 350, y: 300 },
              data: {
                label: 'OpenAI (ChatGPT, Sera...',
                subtitle: 'conversacional',
                executionCount: 2,
                config: {
                  module: 'chat-completion',
                  tipo: 'conversacional',
                  modelo: 'gpt-3.5-turbo',
                  instrucciones: 'Eres un asistente de ventas de Veo Veo Libros. Ayuda al cliente a encontrar libros preguntando qué necesita. Sé amable y conversacional. Pregunta sobre género, autor, tema o título que busca.',
                  temperatura: 0.7,
                  maxTokens: 500
                }
              }
            },
            
            // 3. GPT Formateador
            {
              id: 'gpt-formateador',
              type: 'gpt',
              category: 'processor',
              position: { x: 600, y: 300 },
              data: {
                label: 'OpenAI (ChatGPT, Sera...',
                subtitle: 'formateador',
                executionCount: 3,
                config: {
                  module: 'chat-completion',
                  tipo: 'formateador',
                  modelo: 'gpt-3.5-turbo',
                  instruccionesExtraccion: 'Analiza el historial de conversación y extrae la información de búsqueda del cliente. Devuelve un JSON con: "busqueda" (término de búsqueda principal: título, autor, tema o género que mencionó), "categoria" (si mencionó una categoría específica), "precio_max" (si mencionó un presupuesto máximo). Si no mencionó algo, deja el campo vacío.',
                  formatoSalida: 'json',
                  camposEsperados: ['busqueda', 'categoria', 'precio_max'],
                  variablesAExtraer: [
                    {
                      nombre: 'busqueda',
                      descripcion: 'Término de búsqueda: título, autor, tema o género',
                      obligatorio: true,
                      tipo: 'texto'
                    },
                    {
                      nombre: 'categoria',
                      descripcion: 'Categoría de libro si fue mencionada',
                      obligatorio: false,
                      tipo: 'texto'
                    },
                    {
                      nombre: 'precio_max',
                      descripcion: 'Presupuesto máximo si fue mencionado',
                      obligatorio: false,
                      tipo: 'numero'
                    }
                  ]
                }
              }
            },
            
            // 4. Router - CORREGIDO con routes array
            {
              id: 'router',
              type: 'router',
              category: 'processor',
              position: { x: 850, y: 300 },
              data: {
                label: 'Router',
                executionCount: 4,
                routes: 2,
                config: {
                  tipo: 'condicional',
                  routes: [
                    {
                      id: 'route-1',
                      label: 'Faltan datos',
                      condition: '{{busqueda}} not exists',
                      descripcion: 'Si no se extrajo el término de búsqueda'
                    },
                    {
                      id: 'route-2',
                      label: 'JSON completo',
                      condition: '{{busqueda}} exists',
                      descripcion: 'Si ya tenemos el término de búsqueda'
                    }
                  ]
                }
              }
            },
            
            // 5. GPT Pedir Datos - Ruta 1
            {
              id: 'gpt-pedir-datos',
              type: 'gpt',
              category: 'processor',
              position: { x: 1100, y: 150 },
              data: {
                label: 'OpenAI (ChatGPT, Sera...',
                subtitle: 'conversacional',
                executionCount: 5,
                config: {
                  module: 'chat-completion',
                  tipo: 'conversacional',
                  modelo: 'gpt-3.5-turbo',
                  instrucciones: 'El cliente no ha especificado qué libro busca. Pregúntale de manera amable y específica qué libro, autor, tema o género le interesa. Sé breve y directo.',
                  temperatura: 0.7,
                  maxTokens: 200
                }
              }
            },
            
            // 6. WhatsApp Send - Ruta 1 - CORREGIDO con respuesta_gpt
            {
              id: 'whatsapp-preguntar',
              type: 'whatsapp',
              category: 'action',
              position: { x: 1350, y: 150 },
              data: {
                label: 'WhatsApp Business Cloud',
                subtitle: 'Send a Message',
                executionCount: 6,
                config: {
                  module: 'send-message',
                  message: '{{gpt-pedir-datos.respuesta_gpt}}',
                  telefono: '{{telefono_cliente}}',
                  empresaId: '6940a9a181b92bfce970fdb5',
                  phoneNumberId: '906667632531979'
                }
              }
            },
            
            // 7. WooCommerce - Ruta 2
            {
              id: 'woocommerce',
              type: 'woocommerce',
              category: 'action',
              position: { x: 1100, y: 450 },
              data: {
                label: 'WooCommerce',
                subtitle: 'Get a Product',
                executionCount: 7,
                config: {
                  module: 'get-product',
                  apiConfigId: '695320fda03785dacc8d950b',
                  endpointId: 'buscar-productos',
                  parametros: {
                    search: '{{busqueda}}',
                    category: '{{categoria}}',
                    per_page: '5',
                    orderby: 'relevance'
                  },
                  responseConfig: {
                    arrayPath: '',
                    idField: 'id',
                    displayField: 'name',
                    priceField: 'price',
                    stockField: 'stock_quantity',
                    imageField: 'images[0].src'
                  },
                  mensajeSinResultados: 'No encontré libros con esa búsqueda. ¿Podrías ser más específico o probar con otro término?'
                }
              }
            },
            
            // 8. GPT Resultados - Ruta 2
            {
              id: 'gpt-resultados',
              type: 'gpt',
              category: 'processor',
              position: { x: 1350, y: 450 },
              data: {
                label: 'OpenAI (ChatGPT, Sera...',
                subtitle: 'formateador',
                executionCount: 8,
                config: {
                  module: 'chat-completion',
                  tipo: 'formateador',
                  modelo: 'gpt-3.5-turbo',
                  instrucciones: 'Toma los productos de WooCommerce (variable {{productos}}) y genera un mensaje amigable para WhatsApp mostrando las opciones disponibles. Para cada libro muestra: título, precio y si hay stock. Usa emojis para hacerlo más atractivo. Si no hay resultados, usa el mensaje de {{mensajeSinResultados}}.',
                  temperatura: 0.7,
                  maxTokens: 800
                }
              }
            },
            
            // 9. WhatsApp Send - Ruta 2 - CORREGIDO con respuesta_gpt
            {
              id: 'whatsapp-resultados',
              type: 'whatsapp',
              category: 'action',
              position: { x: 1600, y: 450 },
              data: {
                label: 'WhatsApp Business Cloud',
                subtitle: 'Send a Message',
                executionCount: 9,
                config: {
                  module: 'send-message',
                  message: '{{gpt-resultados.respuesta_gpt}}',
                  telefono: '{{telefono_cliente}}',
                  empresaId: '6940a9a181b92bfce970fdb5',
                  phoneNumberId: '906667632531979'
                }
              }
            }
          ],
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Flujo corregido completamente\n');
    console.log('📋 Correcciones aplicadas:');
    console.log('  ✓ Router: routes array agregado dentro de config');
    console.log('  ✓ WhatsApp nodos: message usa {{nodo-id.respuesta_gpt}}');
    console.log('  ✓ WhatsApp nodos: telefono configurado como {{telefono_cliente}}');
    console.log('  ✓ WhatsApp nodos: phoneNumberId y empresaId configurados');
    console.log('\n✅ Listo para testear desde WhatsApp');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlowComplete();
