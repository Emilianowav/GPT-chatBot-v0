require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Configurar API de WooCommerce completa en la BD
 * Basado en la documentación encontrada en PLAN_MIGRACION_VEO_VEO.md
 */

async function setupWooCommerceAPI() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const apisCollection = db.collection('apis');
    const empresasCollection = db.collection('empresas');
    
    // IDs de la documentación
    const API_CONFIG_ID = new ObjectId('695320fda03785dacc8d950b');
    const EMPRESA_ID = new ObjectId('6940a9a181b92bfce970fdb5');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CONFIGURAR API DE WOOCOMMERCE - VEO VEO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verificar si la empresa existe
    const empresa = await empresasCollection.findOne({ _id: EMPRESA_ID });
    if (!empresa) {
      console.log('❌ Empresa no encontrada');
      return;
    }
    
    console.log('✅ Empresa encontrada:', empresa.nombre);
    console.log('');
    
    // Credenciales de WooCommerce (de los scripts existentes)
    const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
    const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';
    const BASE_URL = 'https://www.veoveolibros.com.ar/wp-json/wc/v3';
    
    // Configuración completa de la API
    const apiConfig = {
      _id: API_CONFIG_ID,
      nombre: 'WooCommerce API - Veo Veo',
      descripcion: 'API de WooCommerce para gestionar productos, pedidos y clientes de la librería Veo Veo',
      empresaId: EMPRESA_ID,
      baseUrl: BASE_URL,
      activo: true,
      autenticacion: {
        tipo: 'basic',
        configuracion: {
          username: CONSUMER_KEY,
          password: CONSUMER_SECRET
        }
      },
      headers: {
        'Content-Type': 'application/json'
      },
      endpoints: [
        {
          id: 'buscar-productos',
          nombre: 'Buscar Productos',
          descripcion: 'Buscar productos por título, categoría o palabra clave',
          method: 'GET',
          path: '/products',
          parametros: [
            {
              nombre: 'search',
              tipo: 'string',
              requerido: false,
              descripcion: 'Término de búsqueda (título del producto)',
              ejemplo: 'Harry Potter'
            },
            {
              nombre: 'category',
              tipo: 'string',
              requerido: false,
              descripcion: 'ID de categoría para filtrar',
              ejemplo: '15'
            },
            {
              nombre: 'per_page',
              tipo: 'number',
              requerido: false,
              descripcion: 'Cantidad de resultados por página',
              ejemplo: '10',
              default: '10'
            },
            {
              nombre: 'page',
              tipo: 'number',
              requerido: false,
              descripcion: 'Número de página',
              ejemplo: '1',
              default: '1'
            },
            {
              nombre: 'orderby',
              tipo: 'string',
              requerido: false,
              descripcion: 'Campo para ordenar (date, id, title, relevance)',
              ejemplo: 'relevance',
              default: 'relevance'
            },
            {
              nombre: 'order',
              tipo: 'string',
              requerido: false,
              descripcion: 'Orden ascendente o descendente (asc, desc)',
              ejemplo: 'desc',
              default: 'desc'
            },
            {
              nombre: 'status',
              tipo: 'string',
              requerido: false,
              descripcion: 'Estado del producto (publish, draft, pending)',
              ejemplo: 'publish',
              default: 'publish'
            }
          ],
          respuesta: {
            tipo: 'array',
            estructura: {
              id: 'number',
              name: 'string',
              slug: 'string',
              price: 'string',
              regular_price: 'string',
              sale_price: 'string',
              stock_quantity: 'number',
              stock_status: 'string',
              images: 'array',
              categories: 'array',
              short_description: 'string',
              description: 'string'
            }
          }
        },
        {
          id: 'obtener-producto',
          nombre: 'Obtener Producto',
          descripcion: 'Obtener detalles de un producto específico por ID',
          method: 'GET',
          path: '/products/{id}',
          parametros: [
            {
              nombre: 'id',
              tipo: 'number',
              requerido: true,
              descripcion: 'ID del producto',
              ejemplo: '123'
            }
          ],
          respuesta: {
            tipo: 'object',
            estructura: {
              id: 'number',
              name: 'string',
              price: 'string',
              stock_quantity: 'number',
              images: 'array'
            }
          }
        },
        {
          id: 'crear-pedido',
          nombre: 'Crear Pedido',
          descripcion: 'Crear un nuevo pedido en WooCommerce',
          method: 'POST',
          path: '/orders',
          parametros: [
            {
              nombre: 'payment_method',
              tipo: 'string',
              requerido: true,
              descripcion: 'Método de pago',
              ejemplo: 'mercadopago'
            },
            {
              nombre: 'payment_method_title',
              tipo: 'string',
              requerido: true,
              descripcion: 'Título del método de pago',
              ejemplo: 'Mercado Pago'
            },
            {
              nombre: 'set_paid',
              tipo: 'boolean',
              requerido: false,
              descripcion: 'Marcar como pagado',
              ejemplo: 'false',
              default: 'false'
            },
            {
              nombre: 'billing',
              tipo: 'object',
              requerido: true,
              descripcion: 'Datos de facturación del cliente',
              estructura: {
                first_name: 'string',
                last_name: 'string',
                email: 'string',
                phone: 'string'
              }
            },
            {
              nombre: 'line_items',
              tipo: 'array',
              requerido: true,
              descripcion: 'Productos del pedido',
              estructura: {
                product_id: 'number',
                quantity: 'number'
              }
            }
          ],
          respuesta: {
            tipo: 'object',
            estructura: {
              id: 'number',
              order_key: 'string',
              status: 'string',
              total: 'string',
              line_items: 'array'
            }
          }
        },
        {
          id: 'obtener-categorias',
          nombre: 'Obtener Categorías',
          descripcion: 'Listar todas las categorías de productos',
          method: 'GET',
          path: '/products/categories',
          parametros: [
            {
              nombre: 'per_page',
              tipo: 'number',
              requerido: false,
              descripcion: 'Cantidad de resultados',
              ejemplo: '100',
              default: '100'
            }
          ],
          respuesta: {
            tipo: 'array',
            estructura: {
              id: 'number',
              name: 'string',
              slug: 'string',
              count: 'number'
            }
          }
        }
      ],
      creadoEn: new Date(),
      actualizadoEn: new Date()
    };
    
    // Verificar si ya existe
    const existingApi = await apisCollection.findOne({ _id: API_CONFIG_ID });
    
    if (existingApi) {
      console.log('⚠️  La API ya existe. Actualizando...\n');
      
      await apisCollection.updateOne(
        { _id: API_CONFIG_ID },
        { 
          $set: {
            ...apiConfig,
            actualizadoEn: new Date()
          }
        }
      );
      
      console.log('✅ API actualizada exitosamente');
    } else {
      console.log('📝 Creando nueva configuración de API...\n');
      
      await apisCollection.insertOne(apiConfig);
      
      console.log('✅ API creada exitosamente');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CONFIGURACIÓN APLICADA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 Detalles:');
    console.log(`   ID: ${API_CONFIG_ID}`);
    console.log(`   Nombre: ${apiConfig.nombre}`);
    console.log(`   Base URL: ${apiConfig.baseUrl}`);
    console.log(`   Autenticación: Basic Auth`);
    console.log(`   Consumer Key: ${CONSUMER_KEY.substring(0, 20)}...`);
    console.log(`   Endpoints: ${apiConfig.endpoints.length}`);
    console.log('');
    
    console.log('📡 Endpoints disponibles:');
    apiConfig.endpoints.forEach((endpoint, index) => {
      console.log(`   ${index + 1}. ${endpoint.nombre} (${endpoint.id})`);
      console.log(`      ${endpoint.method} ${endpoint.path}`);
    });
    
    console.log('');
    console.log('✅ Configuración completa. El nodo WooCommerce ahora puede usar esta API.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

setupWooCommerceAPI();
