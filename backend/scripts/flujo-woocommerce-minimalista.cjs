const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * FLUJO MINIMALISTA - UN SOLO CAMINO LINEAL
 * 
 * Arquitectura simple:
 * Webhook → GPT Conversacional → GPT Formateador → Router → WooCommerce → WhatsApp
 *                              ↓
 *                         WhatsApp Respuesta
 */

async function crearFlujoMinimalista() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('crm_bot');
    const flowsCollection = db.collection('flows');

    console.log('🎯 CREANDO FLUJO MINIMALISTA\n');

    const flujoMinimalista = {
      _id: new ObjectId(FLOW_ID),
      nombre: 'WooCommerce - Búsqueda Simple',
      descripcion: 'Flujo minimalista para búsqueda de productos',
      activo: true,
      
      whatsapp: {
        phoneNumberId: '906667632531979',
        verifyToken: '2001-ic'
      },
      woocommerce: {
        eshopUrl: 'https://www.veoveolibros.com.ar',
        consumerKey: 'ck_1f3a8bc8e8f8e8f8e8f8e8f8e8f8e8f8',
        consumerSecret: 'cs_1f3a8bc8e8f8e8f8e8f8e8f8e8f8e8f8'
      },

      // 6 NODOS ESENCIALES
      nodes: [
        // 1. WEBHOOK
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

IMPORTANTE: Solo extrae si el usuario mencionó un libro específico. Si solo saludó o preguntó algo general, deja titulo_libro en null.`,
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

        // 5. ROUTER (ÚNICO PUNTO DE DECISIÓN)
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

      // CONEXIONES SIMPLES
      edges: [
        // Flujo principal
        { 
          id: 'e1', 
          source: '1', 
          target: 'gpt-conversacional',
          type: 'smoothstep',
          animated: true
        },
        
        // GPT → WhatsApp respuesta (siempre)
        { 
          id: 'e2', 
          source: 'gpt-conversacional', 
          target: 'whatsapp-respuesta',
          type: 'smoothstep'
        },
        
        // GPT → Formateador (siempre)
        { 
          id: 'e3', 
          source: 'gpt-conversacional', 
          target: 'gpt-formateador',
          type: 'smoothstep',
          animated: true
        },
        
        // Formateador → Router
        { 
          id: 'e4', 
          source: 'gpt-formateador', 
          target: 'router',
          type: 'smoothstep',
          animated: true
        },
        
        // Router → WooCommerce (solo si tiene datos)
        { 
          id: 'e5', 
          source: 'router', 
          target: 'woocommerce',
          sourceHandle: 'buscar',
          type: 'smoothstep',
          animated: true,
          label: 'Con datos'
        },
        
        // WooCommerce → WhatsApp resultados
        { 
          id: 'e6', 
          source: 'woocommerce', 
          target: 'whatsapp-resultados',
          type: 'smoothstep',
          animated: true
        }
      ],

      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Eliminar y recrear
    await flowsCollection.deleteOne({ _id: new ObjectId(FLOW_ID) });
    await flowsCollection.insertOne(flujoMinimalista);

    console.log('✅ Flujo minimalista creado\n');
    console.log('📊 RESUMEN:');
    console.log(`   Nodos: ${flujoMinimalista.nodes.length}`);
    console.log(`   Conexiones: ${flujoMinimalista.edges.length}`);
    console.log('\n🎯 FLUJO LINEAL:');
    console.log('   Webhook → GPT → Formateador → Router');
    console.log('              ↓                      ↓');
    console.log('         WhatsApp              WooCommerce → WhatsApp');
    console.log('\n💡 LÓGICA:');
    console.log('   - Siempre responde con GPT');
    console.log('   - Siempre intenta extraer datos');
    console.log('   - Solo busca en WooCommerce si extrajo titulo_libro');
    console.log('   - Si no extrajo datos, termina (sigue conversando)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

crearFlujoMinimalista();
