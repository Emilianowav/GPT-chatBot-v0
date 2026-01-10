const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * RESET COMPLETO DEL FLUJO WOOCOMMERCE
 * 1. Elimina flujo anterior
 * 2. Crea flujo nuevo minimalista y funcional
 */

async function resetFlujoCompleto() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('crm_bot');
    const flowsCollection = db.collection('flows');

    // PASO 1: Eliminar flujo anterior
    console.log('🗑️  PASO 1: Eliminando flujo anterior...');
    const deleteResult = await flowsCollection.deleteOne({ _id: new ObjectId(FLOW_ID) });
    console.log(`   ${deleteResult.deletedCount > 0 ? '✅' : '⚠️'} Flujo eliminado\n`);

    // PASO 2: Crear flujo nuevo
    console.log('🎯 PASO 2: Creando flujo nuevo minimalista...\n');

    const nuevoFlujo = {
      _id: new ObjectId(FLOW_ID),
      nombre: 'WooCommerce - Búsqueda Simple',
      descripcion: 'Flujo minimalista para búsqueda de productos en WooCommerce',
      activo: true,
      empresaId: 'Veo Veo',
      
      // Configuración de servicios
      whatsapp: {
        phoneNumberId: '906667632531979',
        verifyToken: '2001-ic'
      },
      woocommerce: {
        eshopUrl: 'https://www.veoveolibros.com.ar',
        consumerKey: process.env.WOO_CONSUMER_KEY || 'ck_xxx',
        consumerSecret: process.env.WOO_CONSUMER_SECRET || 'cs_xxx'
      },

      // 7 NODOS ESENCIALES
      nodes: [
        // 1. WEBHOOK (entrada)
        {
          id: '1',
          type: 'webhook',
          position: { x: 100, y: 200 },
          data: {
            label: 'Webhook',
            type: 'webhook',
            config: {
              source: 'whatsapp',
              phoneNumberId: '906667632531979'
            }
          }
        },

        // 2. GPT CONVERSACIONAL
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

        // 3. WHATSAPP RESPUESTA
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

        // 4. GPT FORMATEADOR
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
                instruccionesExtraccion: `Extrae el título EXACTO del libro de la conversación.

REGLA: WooCommerce busca por título exacto.

Si menciona número ("la dos", "2"):
- Identifica saga
- Convierte a título completo
- Ejemplo: "la dos de harry potter" → "Harry Potter y la Cámara Secreta"

TÍTULOS HARRY POTTER:
1. Harry Potter y la piedra filosofal
2. Harry Potter y la Cámara Secreta
3. Harry Potter y el prisionero de Azkaban
4. Harry Potter y el cáliz de fuego
5. Harry Potter y la Orden del Fénix
6. Harry Potter y el misterio del príncipe
7. Harry Potter y las Reliquias de la Muerte

EDITORIAL: "cualquiera"/"me da igual" → null

IMPORTANTE: Solo extrae si el usuario mencionó un libro específico. Si solo saludó, deja titulo_libro en null.`,
                fuenteDatos: 'historial_completo',
                tipoFormato: 'json',
                estructuraJSON: '{ "titulo_libro": string | null, "editorial": string | null }',
                camposEsperados: [
                  { nombre: 'titulo_libro', tipo: 'string', requerido: false, valorPorDefecto: null },
                  { nombre: 'editorial', tipo: 'string', requerido: false, valorPorDefecto: null }
                ]
              }
            }
          }
        },

        // 5. ROUTER (único punto de decisión)
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
                  condition: '{{titulo_libro}} exists'
                }
              ]
            }
          }
        },

        // 6. WOOCOMMERCE
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

        // 7. WHATSAPP RESULTADOS
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

      // 6 CONEXIONES SIMPLES
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
          sourceHandle: 'buscar',
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

      createdAt: new Date(),
      updatedAt: new Date()
    };

    await flowsCollection.insertOne(nuevoFlujo);

    console.log('✅ Flujo creado exitosamente\n');
    console.log('📊 RESUMEN:');
    console.log(`   Nodos: ${nuevoFlujo.nodes.length}`);
    console.log(`   Conexiones: ${nuevoFlujo.edges.length}`);
    console.log('\n🎯 ARQUITECTURA:');
    console.log('   Webhook → GPT Conversacional → Formateador → Router → WooCommerce → WhatsApp');
    console.log('                  ↓');
    console.log('            WhatsApp Respuesta');
    console.log('\n📍 COLECCIÓN:');
    console.log('   Base de datos: crm_bot');
    console.log('   Colección: flows');
    console.log('   ID del flujo: 695a156681f6d67f0ae9cf40');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

resetFlujoCompleto();
