require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function createWooCommerceFlow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    // Eliminar flujo existente
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    await flowsCollection.deleteOne({ _id: flowId });
    console.log('🗑️  Flujo anterior eliminado');
    
    // Crear nuevo flujo con la lógica correcta
    const newFlow = {
      _id: flowId,
      nombre: 'WooCommerce Flow',
      empresaId: '6940a9a181b92bfce970fdb5',
      activo: true,
      nodes: [
        // 1. Webhook WhatsApp (Trigger)
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
              module: 'watch-events'
            }
          }
        },
        
        // 2. GPT Conversacional (Recopila info dinámicamente)
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
              instrucciones: 'Eres un asistente de ventas. Ayuda al cliente a encontrar productos preguntando qué necesita. Sé amable y conversacional.',
              temperatura: 0.7
            }
          }
        },
        
        // 3. GPT Formateador (Extrae datos del historial en JSON)
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
              instruccionesExtraccion: 'Extrae del historial de conversación: búsqueda (qué producto busca), categoría (si la mencionó), precio_max (si mencionó presupuesto). Devuelve JSON con estos campos.',
              formatoSalida: 'json',
              camposEsperados: ['busqueda', 'categoria', 'precio_max']
            }
          }
        },
        
        // 4. Router (Evalúa si el JSON está completo)
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
              conditions: [
                { 
                  label: 'Faltan datos', 
                  condition: '{{busqueda}} not exists' 
                },
                { 
                  label: 'JSON completo', 
                  condition: '{{busqueda}} exists' 
                }
              ]
            }
          }
        },
        
        // 5. GPT Conversacional (Pide datos faltantes) - Ruta 1
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
              instrucciones: 'El usuario no ha especificado qué producto busca. Pregúntale de manera amable qué necesita o qué está buscando.',
              temperatura: 0.7
            }
          }
        },
        
        // 6. WhatsApp Send (Envía pregunta) - Ruta 1
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
              message: '{{gpt_response}}'
            }
          }
        },
        
        // 7. WooCommerce (Consulta productos) - Ruta 2
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
              apiConfigId: 'veo-veo-woocommerce',
              endpointId: 'buscar-productos',
              parametros: {
                search: '{{busqueda}}',
                category: '{{categoria}}',
                max_price: '{{precio_max}}'
              },
              responseConfig: {
                arrayPath: 'productos',
                idField: 'id',
                displayField: 'nombre',
                priceField: 'precio',
                stockField: 'stock'
              }
            }
          }
        },
        
        // 8. GPT Formatea Resultados - Ruta 2
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
              instrucciones: 'Toma los productos de WooCommerce y genera un mensaje amigable mostrando las opciones disponibles con nombre, precio y stock.',
              temperatura: 0.7
            }
          }
        },
        
        // 9. WhatsApp Send (Envía resultados) - Ruta 2
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
              message: '{{gpt_response}}'
            }
          }
        }
      ],
      
      edges: [
        // Flujo principal
        { id: 'e1', source: 'webhook-whatsapp', target: 'gpt-conversacional', type: 'default', animated: true },
        { id: 'e2', source: 'gpt-conversacional', target: 'gpt-formateador', type: 'default', animated: true },
        { id: 'e3', source: 'gpt-formateador', target: 'router', type: 'default', animated: true },
        
        // Ruta 1: Faltan datos
        { id: 'e4', source: 'router', sourceHandle: 'route-1', target: 'gpt-pedir-datos', type: 'default', animated: true },
        { id: 'e5', source: 'gpt-pedir-datos', target: 'whatsapp-preguntar', type: 'default', animated: true },
        
        // Ruta 2: JSON completo
        { id: 'e6', source: 'router', sourceHandle: 'route-2', target: 'woocommerce', type: 'default', animated: true },
        { id: 'e7', source: 'woocommerce', target: 'gpt-resultados', type: 'default', animated: true },
        { id: 'e8', source: 'gpt-resultados', target: 'whatsapp-resultados', type: 'default', animated: true }
      ],
      
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await flowsCollection.insertOne(newFlow);
    
    console.log('\n✅ Nuevo flujo WooCommerce creado exitosamente!');
    console.log(`📊 Nodos: ${newFlow.nodes.length}`);
    console.log(`🔗 Edges: ${newFlow.edges.length}`);
    console.log('\n📋 Estructura del flujo:');
    console.log('1. Webhook WhatsApp → Recibe mensaje');
    console.log('2. GPT Conversacional → Genera conversación');
    console.log('3. GPT Formateador → Extrae datos en JSON');
    console.log('4. Router → Evalúa si JSON está completo');
    console.log('   ├─ Ruta 1 (Faltan datos): GPT → WhatsApp (pregunta)');
    console.log('   └─ Ruta 2 (JSON completo): WooCommerce → GPT → WhatsApp (resultados)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createWooCommerceFlow();
