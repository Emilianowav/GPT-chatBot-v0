const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * FLUJO LIMPIO Y EJECUTIVO - WooCommerce
 * 
 * Arquitectura:
 * 1. Webhook (entrada) → 2. GPT Conversacional → 3. WhatsApp Respuesta
 *                      ↓
 * 4. GPT Formateador → 5. Router Validación → 6. WooCommerce Search
 *                                           ↓
 * 7. Router Productos → 8. WhatsApp Resultados
 */

async function recrearFlujoLimpio() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('crm_bot');
    const flowsCollection = db.collection('flows');

    console.log('🧹 RECREANDO FLUJO WOOCOMMERCE LIMPIO\n');

    // Estructura limpia del flujo
    const nuevoFlujo = {
      _id: new ObjectId(FLOW_ID),
      nombre: 'WooCommerce - Búsqueda de Productos',
      descripcion: 'Flujo optimizado para búsqueda de productos en WooCommerce',
      activo: true,
      
      // Configuración de servicios
      whatsapp: {
        phoneNumberId: '906667632531979',
        verifyToken: '2001-ic'
      },
      woocommerce: {
        eshopUrl: 'https://www.veoveolibros.com.ar',
        consumerKey: 'ck_1f3a8bc8e8f8e8f8e8f8e8f8e8f8e8f8',
        consumerSecret: 'cs_1f3a8bc8e8f8e8f8e8f8e8f8e8f8e8f8'
      },

      // NODOS LIMPIOS
      nodes: [
        // 1. WEBHOOK (entrada)
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

        // 2. GPT CONVERSACIONAL
        {
          id: 'gpt-conversacional',
          type: 'gpt',
          position: { x: 300, y: 200 },
          data: {
            label: 'GPT Conversacional',
            type: 'gpt',
            config: {
              tipo: 'conversacional',
              modelo: 'gpt-4o-mini',
              personalidad: 'Sos un asistente de librería amigable y profesional. Tu trabajo es ayudar a los clientes a encontrar libros.',
              topicos: ['libros', 'literatura', 'búsqueda de productos'],
              mensajeInput: '{{1.message}}',
              contextoAdicional: 'Cliente: {{1.profileName}}'
            }
          }
        },

        // 3. WHATSAPP RESPUESTA GPT
        {
          id: 'whatsapp-respuesta',
          type: 'whatsapp',
          position: { x: 500, y: 200 },
          data: {
            label: 'Enviar Respuesta',
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
          position: { x: 300, y: 350 },
          data: {
            label: 'Formateador Datos',
            type: 'gpt',
            config: {
              tipo: 'formateador',
              modelo: 'gpt-3.5-turbo',
              mensajeInput: '{{1.message}}',
              configuracionExtraccion: {
                instruccionesExtraccion: `Analiza la conversación completa y extrae el título EXACTO del libro.

REGLA: WooCommerce busca por título exacto. Extrae el nombre completo del libro.

Si el usuario menciona un número ("la dos", "2"):
- Identifica la saga
- Convierte al título completo
- Ejemplo: "la dos de harry potter" → "Harry Potter y la Cámara Secreta"

Si el asistente mencionó el título completo, úsalo.

TÍTULOS HARRY POTTER:
1. Harry Potter y la piedra filosofal
2. Harry Potter y la Cámara Secreta
3. Harry Potter y el prisionero de Azkaban
4. Harry Potter y el cáliz de fuego
5. Harry Potter y la Orden del Fénix
6. Harry Potter y el misterio del príncipe
7. Harry Potter y las Reliquias de la Muerte

EDITORIAL/EDICIÓN:
- "cualquiera", "me da igual", "no" → null
- Específica → extrae nombre
- No menciona → null`,
                fuenteDatos: 'historial_completo',
                tipoFormato: 'json',
                estructuraJSON: '{ "titulo_libro": string, "editorial": string | null, "edicion": string | null }',
                camposEsperados: [
                  { nombre: 'titulo_libro', tipo: 'string', requerido: true },
                  { nombre: 'editorial', tipo: 'string', requerido: false, valorPorDefecto: null },
                  { nombre: 'edicion', tipo: 'string', requerido: false, valorPorDefecto: null }
                ]
              }
            }
          }
        },

        // 5. ROUTER VALIDACIÓN
        {
          id: 'router-validacion',
          type: 'router',
          position: { x: 500, y: 350 },
          data: {
            label: 'Validar Datos',
            type: 'router',
            config: {
              routes: [
                {
                  id: 'datos-completos',
                  label: 'Datos Completos',
                  condition: '{{titulo_libro}} exists'
                },
                {
                  id: 'datos-incompletos',
                  label: 'Faltan Datos',
                  condition: '{{titulo_libro}} not exists'
                }
              ]
            }
          }
        },

        // 6. WOOCOMMERCE SEARCH
        {
          id: 'woocommerce-search',
          type: 'woocommerce',
          position: { x: 700, y: 300 },
          data: {
            label: 'Buscar Productos',
            type: 'woocommerce',
            config: {
              module: 'search-product',
              search: '{{titulo_libro}}',
              limit: '10',
              orderBy: 'title'
            }
          }
        },

        // 7. ROUTER PRODUCTOS
        {
          id: 'router-productos',
          type: 'router',
          position: { x: 900, y: 300 },
          data: {
            label: 'Verificar Resultados',
            type: 'router',
            config: {
              routes: [
                {
                  id: 'con-productos',
                  label: 'Con Productos',
                  condition: '{{woocommerce-search.count}} > 0'
                },
                {
                  id: 'sin-productos',
                  label: 'Sin Productos',
                  condition: '{{woocommerce-search.count}} == 0'
                }
              ]
            }
          }
        },

        // 8. WHATSAPP RESULTADOS
        {
          id: 'whatsapp-resultados',
          type: 'whatsapp',
          position: { x: 1100, y: 250 },
          data: {
            label: 'Enviar Productos',
            type: 'whatsapp',
            config: {
              module: 'send-message',
              mensaje: '📚 Encontré {{woocommerce-search.productos.length || 0}} resultados para "{{titulo_libro}}":\n\n{{woocommerce-search.productos}}',
              to: '{{1.from}}'
            }
          }
        },

        // 9. WHATSAPP SIN RESULTADOS
        {
          id: 'whatsapp-sin-resultados',
          type: 'whatsapp',
          position: { x: 1100, y: 400 },
          data: {
            label: 'Sin Resultados',
            type: 'whatsapp',
            config: {
              module: 'send-message',
              mensaje: '😔 No encontré resultados para "{{titulo_libro}}". ¿Querés buscar otro libro?',
              to: '{{1.from}}'
            }
          }
        }
      ],

      // CONEXIONES LIMPIAS
      edges: [
        // Flujo principal
        { id: 'e1-2', source: '1', target: 'gpt-conversacional' },
        { id: 'e2-3', source: 'gpt-conversacional', target: 'whatsapp-respuesta' },
        { id: 'e2-4', source: 'gpt-conversacional', target: 'gpt-formateador' },
        { id: 'e4-5', source: 'gpt-formateador', target: 'router-validacion' },
        
        // Router validación
        { 
          id: 'e5-6', 
          source: 'router-validacion', 
          target: 'woocommerce-search',
          sourceHandle: 'datos-completos'
        },
        
        // WooCommerce → Router productos
        { id: 'e6-7', source: 'woocommerce-search', target: 'router-productos' },
        
        // Router productos
        { 
          id: 'e7-8', 
          source: 'router-productos', 
          target: 'whatsapp-resultados',
          sourceHandle: 'con-productos'
        },
        { 
          id: 'e7-9', 
          source: 'router-productos', 
          target: 'whatsapp-sin-resultados',
          sourceHandle: 'sin-productos'
        }
      ],

      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Eliminar flujo anterior y crear nuevo
    await flowsCollection.deleteOne({ _id: new ObjectId(FLOW_ID) });
    console.log('🗑️  Flujo anterior eliminado');

    await flowsCollection.insertOne(nuevoFlujo);
    console.log('✅ Nuevo flujo creado\n');

    console.log('📊 RESUMEN DEL FLUJO:');
    console.log(`   Nodos: ${nuevoFlujo.nodes.length}`);
    console.log(`   Conexiones: ${nuevoFlujo.edges.length}`);
    console.log('\n🎯 ARQUITECTURA:');
    console.log('   1. Webhook → 2. GPT Conversacional → 3. WhatsApp Respuesta');
    console.log('                     ↓');
    console.log('   4. GPT Formateador → 5. Router Validación');
    console.log('                                ↓');
    console.log('   6. WooCommerce → 7. Router Productos → 8. WhatsApp Resultados');
    console.log('                                        → 9. WhatsApp Sin Resultados');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

recrearFlujoLimpio();
