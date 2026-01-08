import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * FLUJO DE WOOCOMMERCE - BÚSQUEDA Y COMPRA DE PRODUCTOS
 * 
 * Flujo completo:
 * 1. WhatsApp Watch Events (trigger)
 * 2. GPT Formateador (extrae búsqueda del usuario)
 * 3. Router (valida JSON)
 * 4. WooCommerce Search Product
 * 5. WhatsApp Send (muestra resultados)
 */

async function crearFlujoWooCommerce() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🛒 CREANDO FLUJO DE WOOCOMMERCE\n');

    const nodes = [
      // [1] TRIGGER - WhatsApp Watch Events
      {
        id: 'whatsapp-trigger',
        type: 'whatsapp',
        position: { x: 100, y: 300 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Watch Events',
          executionCount: 1,
          hasConnection: true,
          color: '#25D366',
          config: {
            module: 'watch-events',
            phoneNumberId: '906667632531979',
            verifyToken: '2001-ic'
          }
        }
      },

      // [2] GPT Formateador - Extrae búsqueda
      {
        id: 'gpt-formateador',
        type: 'gpt',
        position: { x: 400, y: 300 },
        data: {
          label: 'OpenAI (ChatGPT)',
          subtitle: 'Formatear Búsqueda',
          executionCount: 2,
          hasConnection: true,
          color: '#10a37f',
          config: {
            tipo: 'formateador',
            module: 'transform',
            modelo: 'gpt-4',
            temperatura: 0.3,
            maxTokens: 200,
            systemPrompt: `Extrae el término de búsqueda del mensaje del usuario y devuélvelo en formato JSON.

Ejemplos:
Usuario: "busco zapatillas nike"
Respuesta: {"search": "zapatillas nike"}

Usuario: "quiero una remera roja"
Respuesta: {"search": "remera roja"}

Usuario: "hola"
Respuesta: {"search": ""}

Si el mensaje no contiene una búsqueda clara, devuelve search vacío.`,
            outputFormat: 'json',
            jsonSchema: '{"search": ""}',
            variablesEntrada: ['mensaje_usuario'],
            variablesSalida: ['search']
          }
        }
      },

      // [3] Router - Valida JSON
      {
        id: 'router-validacion',
        type: 'router',
        position: { x: 700, y: 300 },
        data: {
          label: 'Router',
          subtitle: 'Validar Búsqueda',
          executionCount: 3,
          routes: 2,
          color: '#A3E635',
          config: {
            conditions: [
              {
                label: 'Búsqueda válida',
                condition: 'search != ""',
                outputHandle: 'route-1'
              },
              {
                label: 'Sin búsqueda',
                condition: 'search == ""',
                outputHandle: 'route-2'
              }
            ]
          }
        }
      },

      // [4] WooCommerce Search Product
      {
        id: 'woocommerce-search',
        type: 'woocommerce',
        position: { x: 1000, y: 200 },
        data: {
          label: 'WooCommerce',
          subtitle: 'Search Product',
          executionCount: 4,
          hasConnection: true,
          color: '#96588a',
          config: {
            module: 'woo_search',
            apiConfigId: 'woocommerce-main',
            endpointId: 'search-products',
            parametros: {
              search: '{{search}}'
            },
            responseConfig: {
              arrayPath: 'products',
              idField: 'id',
              displayField: 'name',
              priceField: 'price',
              stockField: 'stock_quantity'
            },
            mensajeSinResultados: 'No encontramos productos con ese término. ¿Querés buscar otra cosa?'
          }
        }
      },

      // [5] WhatsApp Send - Mostrar resultados
      {
        id: 'whatsapp-resultados',
        type: 'whatsapp',
        position: { x: 1300, y: 200 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Enviar Resultados',
          executionCount: 5,
          hasConnection: false,
          color: '#25D366',
          config: {
            module: 'send-message',
            mensaje: '🛒 *Productos encontrados:*\n\n{{#each products}}\n{{add @index 1}}. *{{this.name}}*\n   💰 Precio: ${{this.price}}\n   📦 Stock: {{this.stock_quantity}} unidades\n   \n{{/each}}\n\n¿Te interesa alguno? Escribí el número del producto.'
          }
        }
      },

      // [6] WhatsApp Send - Sin resultados
      {
        id: 'whatsapp-sin-busqueda',
        type: 'whatsapp',
        position: { x: 1000, y: 400 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Mensaje de Ayuda',
          executionCount: 6,
          hasConnection: false,
          color: '#25D366',
          config: {
            module: 'send-message',
            mensaje: '👋 ¡Hola! Para buscar productos, escribí lo que estás buscando. Por ejemplo: "zapatillas nike" o "remera roja".'
          }
        }
      }
    ];

    const edges = [
      // WhatsApp → GPT
      {
        id: 'whatsapp-trigger-default-gpt-formateador',
        source: 'whatsapp-trigger',
        target: 'gpt-formateador',
        sourceHandle: 'default',
        targetHandle: null,
        type: 'animatedLine'
      },
      // GPT → Router
      {
        id: 'gpt-formateador-default-router-validacion',
        source: 'gpt-formateador',
        target: 'router-validacion',
        sourceHandle: 'default',
        targetHandle: null,
        type: 'animatedLine'
      },
      // Router → WooCommerce (ruta 1: búsqueda válida)
      {
        id: 'router-validacion-route-1-woocommerce-search',
        source: 'router-validacion',
        target: 'woocommerce-search',
        sourceHandle: 'route-1',
        targetHandle: null,
        type: 'animatedLine'
      },
      // Router → WhatsApp sin búsqueda (ruta 2)
      {
        id: 'router-validacion-route-2-whatsapp-sin-busqueda',
        source: 'router-validacion',
        target: 'whatsapp-sin-busqueda',
        sourceHandle: 'route-2',
        targetHandle: null,
        type: 'animatedLine'
      },
      // WooCommerce → WhatsApp resultados
      {
        id: 'woocommerce-search-default-whatsapp-resultados',
        source: 'woocommerce-search',
        target: 'whatsapp-resultados',
        sourceHandle: 'default',
        targetHandle: null,
        type: 'animatedLine'
      }
    ];

    const flowData = {
      _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40'), // Nuevo ID
      nombre: 'WooCommerce - Búsqueda de Productos',
      empresaId: new mongoose.Types.ObjectId('6940a9a181b92bfce970fdb5'), // Veo Veo
      activo: true,
      nodes,
      edges,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insertar flujo
    await db.collection('flows').insertOne(flowData);
    
    console.log('✅ Flujo de WooCommerce creado exitosamente');
    console.log(`📋 ID del flujo: ${flowData._id}`);
    console.log(`📊 Nodos: ${nodes.length}`);
    console.log(`🔗 Conexiones: ${edges.length}`);
    console.log('\n🎯 ESTRUCTURA DEL FLUJO:');
    console.log('1. WhatsApp Watch Events (trigger)');
    console.log('2. GPT Formateador (extrae búsqueda)');
    console.log('3. Router (valida JSON)');
    console.log('   ├─ Ruta 1: Búsqueda válida → WooCommerce');
    console.log('   └─ Ruta 2: Sin búsqueda → Mensaje de ayuda');
    console.log('4. WooCommerce Search Product');
    console.log('5. WhatsApp Send (resultados)');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearFlujoWooCommerce();
