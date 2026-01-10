require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function recreateWooCommerceFlow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    
    // Eliminar si existe
    await flowsCollection.deleteOne({ _id: flowId });
    console.log('🗑️  Flujo anterior eliminado (si existía)\n');
    
    // Crear flujo completo con configuración de Veo Veo
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
              module: 'watch-events',
              empresaId: '6940a9a181b92bfce970fdb5',
              phoneNumberId: '906667632531979'
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
              instrucciones: 'Eres un asistente de ventas de Veo Veo Libros. Ayuda al cliente a encontrar libros preguntando qué necesita. Sé amable y conversacional. Pregunta sobre género, autor, tema o título que busca.',
              temperatura: 0.7,
              maxTokens: 500
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
              tipo: 'condicional',
              conditions: [
                { 
                  label: 'Faltan datos', 
                  condition: '{{busqueda}} not exists',
                  descripcion: 'Si no se extrajo el término de búsqueda'
                },
                { 
                  label: 'JSON completo', 
                  condition: '{{busqueda}} exists',
                  descripcion: 'Si ya tenemos el término de búsqueda'
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
              instrucciones: 'El cliente no ha especificado qué libro busca. Pregúntale de manera amable y específica qué libro, autor, tema o género le interesa. Sé breve y directo.',
              temperatura: 0.7,
              maxTokens: 200
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
              message: '{{gpt_response}}',
              empresaId: '6940a9a181b92bfce970fdb5',
              phoneNumberId: '906667632531979'
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
              instrucciones: 'Toma los productos de WooCommerce (variable {{productos}}) y genera un mensaje amigable para WhatsApp mostrando las opciones disponibles. Para cada libro muestra: título, precio y si hay stock. Usa emojis para hacerlo más atractivo. Si no hay resultados, usa el mensaje de {{mensajeSinResultados}}.',
              temperatura: 0.7,
              maxTokens: 800
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
              message: '{{gpt_response}}',
              empresaId: '6940a9a181b92bfce970fdb5',
              phoneNumberId: '906667632531979'
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
    
    console.log('✅ Flujo WooCommerce recreado exitosamente!\n');
    console.log('📊 Nodos: 9');
    console.log('🔗 Edges: 8\n');
    console.log('📋 Configuración aplicada:');
    console.log('  ✓ Empresa ID: 6940a9a181b92bfce970fdb5');
    console.log('  ✓ Phone Number ID: 906667632531979');
    console.log('  ✓ API Config ID: 695320fda03785dacc8d950b');
    console.log('  ✓ Endpoint: buscar-productos');
    console.log('  ✓ Variables a extraer: busqueda, categoria, precio_max');
    console.log('  ✓ Instrucciones GPT optimizadas para librería\n');
    console.log('✅ Listo para redeploy y testing desde WhatsApp');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

recreateWooCommerceFlow();
