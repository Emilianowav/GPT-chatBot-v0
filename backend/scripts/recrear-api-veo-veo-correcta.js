import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!!';

function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function recrearAPI() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    console.log('🏢 Empresa:', empresa.nombre);
    console.log('   ID:', empresa._id);

    // Eliminar API anterior
    await db.collection('api_configurations').deleteMany({
      nombre: /veo veo/i
    });

    console.log('🗑️  API anterior eliminada\n');

    // Credenciales
    const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
    const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

    console.log('🔐 Encriptando credenciales...');
    const usernameEncrypted = encrypt(CONSUMER_KEY);
    const passwordEncrypted = encrypt(CONSUMER_SECRET);

    // Crear API nueva con estructura correcta
    const apiConfig = {
      nombre: 'WooCommerce API - Veo Veo',
      descripcion: 'API de WooCommerce para tienda de libros Veo Veo',
      baseUrl: 'https://www.veoveolibros.com.ar/wp-json/wc/v3',
      activa: true,
      empresaId: empresa._id, // ObjectId
      autenticacion: {
        tipo: 'basic',
        configuracion: {
          username: usernameEncrypted,
          password: passwordEncrypted
        }
      },
      headers: {
        'Content-Type': 'application/json'
      },
      endpoints: [
        {
          id: 'listar-productos',
          nombre: 'Listar Productos',
          descripcion: 'Lista todos los productos disponibles',
          method: 'GET',
          path: '/products',
          parametros: {
            per_page: 100,
            status: 'publish'
          }
        },
        {
          id: 'buscar-productos',
          nombre: 'Buscar Productos',
          descripcion: 'Busca productos por nombre o categoría',
          method: 'GET',
          path: '/products',
          parametros: {
            search: '{{query}}',
            per_page: 10,
            status: 'publish'
          }
        },
        {
          id: 'obtener-producto',
          nombre: 'Obtener Producto',
          descripcion: 'Obtiene detalles de un producto específico',
          method: 'GET',
          path: '/products/{{product_id}}'
        },
        {
          id: 'listar-categorias',
          nombre: 'Listar Categorías',
          descripcion: 'Lista todas las categorías de productos',
          method: 'GET',
          path: '/products/categories',
          parametros: {
            per_page: 100
          }
        },
        {
          id: 'productos-por-categoria',
          nombre: 'Productos por Categoría',
          descripcion: 'Lista productos de una categoría específica',
          method: 'GET',
          path: '/products',
          parametros: {
            category: '{{category_id}}',
            per_page: 20,
            status: 'publish'
          }
        },
        {
          id: 'crear-pedido',
          nombre: 'Crear Pedido',
          descripcion: 'Crea un nuevo pedido en WooCommerce',
          method: 'POST',
          path: '/orders',
          body: {
            payment_method: 'mercadopago',
            payment_method_title: 'Mercado Pago',
            set_paid: false,
            billing: {
              first_name: '{{cliente_nombre}}',
              phone: '{{cliente_telefono}}',
              email: '{{cliente_email}}'
            },
            line_items: [{
              product_id: '{{product_id}}',
              quantity: '{{cantidad}}'
            }],
            meta_data: [{
              key: 'origen',
              value: 'whatsapp'
            }]
          }
        },
        {
          id: 'generar-link-pago',
          nombre: 'Generar Link de Pago',
          descripcion: 'Genera link de Mercado Pago para el pedido',
          method: 'POST',
          path: '/mercadopago/payment-link',
          esInterno: true
        }
      ],
      workflows: [{
        id: 'veo-veo-compra-libros',
        nombre: 'Veo Veo - Compra de Libros',
        activo: true,
        trigger: {
          tipo: 'keyword',
          keywords: ['comprar', 'libro', 'libros', 'catalogo', 'catálogo', 'tienda', 'hola', 'menu']
        },
        mensajeInicial: '¡Hola! 📚\nBienvenido a *Veo Veo*\n\nSomos tu librería de confianza.\n¿Qué te gustaría hacer hoy?',
        configPago: {
          seña: 1,
          porcentajeSeña: 1,
          tiempoExpiracion: 15,
          moneda: 'ARS'
        },
        steps: [
          {
            orden: 1,
            nombre: 'Elegir acción',
            tipo: 'recopilar',
            nombreVariable: 'accion',
            pregunta: '📖 ¿Qué te gustaría hacer?\n\n1️⃣ Ver catálogo completo\n2️⃣ Buscar un libro específico\n3️⃣ Ver por categorías\n\nEscribí el número',
            validacion: {
              tipo: 'opcion',
              opciones: ['1', '2', '3', 'catalogo', 'catálogo', 'buscar', 'categorias', 'categorías'],
              mapeo: {
                '1': 'catalogo',
                '2': 'buscar',
                '3': 'categorias',
                'catalogo': 'catalogo',
                'catálogo': 'catalogo',
                'buscar': 'buscar',
                'categorias': 'categorias',
                'categorías': 'categorias'
              }
            }
          },
          {
            orden: 2,
            nombre: 'Buscar o listar productos',
            tipo: 'consulta_filtrada',
            nombreVariable: 'producto_seleccionado',
            pregunta: '📚 *Libros disponibles:*\n\n{{opciones}}\n\n¿Cuál libro te interesa?\nEscribí el número',
            endpointId: 'listar-productos',
            endpointResponseConfig: {
              idField: 'id',
              displayField: 'name',
              priceField: 'price',
              stockField: 'stock_status',
              imageField: 'images[0].src'
            }
          },
          {
            orden: 3,
            nombre: 'Cantidad',
            tipo: 'recopilar',
            nombreVariable: 'cantidad',
            pregunta: '📦 ¿Cuántos ejemplares querés?\n\nEscribí la cantidad (1-10)',
            validacion: {
              tipo: 'numero',
              min: 1,
              max: 10
            }
          },
          {
            orden: 4,
            nombre: 'Nombre del cliente',
            tipo: 'recopilar',
            nombreVariable: 'cliente_nombre',
            pregunta: '👤 ¿A nombre de quién hacemos el pedido?',
            validacion: {
              tipo: 'texto'
            }
          },
          {
            orden: 5,
            nombre: 'Teléfono',
            tipo: 'recopilar',
            nombreVariable: 'cliente_telefono',
            pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
            validacion: {
              tipo: 'texto'
            }
          },
          {
            orden: 6,
            nombre: 'Email',
            tipo: 'recopilar',
            nombreVariable: 'cliente_email',
            pregunta: '📧 ¿Cuál es tu email?\n\nLo usaremos para enviarte la confirmación del pedido',
            validacion: {
              tipo: 'texto'
            }
          },
          {
            orden: 7,
            nombre: 'Confirmar pedido',
            tipo: 'recopilar',
            nombreVariable: 'confirmacion',
            pregunta: '📋 *Resumen de tu pedido:*\n\n📚 Libro: {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Precio unitario: ${{precio}}\n💵 Total: ${{total}}\n\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n📧 Email: {{cliente_email}}\n\n¿Confirmás el pedido?\nEscribí SI para confirmar o NO para cancelar\n\n_Se enviará un link de pago de Mercado Pago. Una vez abonado, procesaremos tu pedido y te contactaremos para coordinar la entrega._',
            validacion: {
              tipo: 'opcion',
              opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
            }
          },
          {
            orden: 8,
            nombre: 'Generar link de pago',
            tipo: 'consulta_filtrada',
            nombreVariable: 'pago',
            endpointId: 'generar-link-pago',
            mensajeExito: '💳 *Link de pago generado*\n\n💵 *Total a pagar:* ${{total}}\n\n👉 *Completá el pago aquí:*\n{{link_pago}}\n\n⏰ Tenés {{tiempo_expiracion}} minutos para completar el pago.\n\n✅ Una vez confirmado el pago, procesaremos tu pedido y te enviaremos la confirmación por email.'
          }
        ]
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('api_configurations').insertOne(apiConfig);

    console.log('\n✅ API CREADA EXITOSAMENTE');
    console.log('   ID:', result.insertedId);
    console.log('   Nombre:', apiConfig.nombre);
    console.log('   Endpoints:', apiConfig.endpoints.length);
    console.log('   Workflows:', apiConfig.workflows.length);

    console.log('\n📋 Verificación de endpoints:');
    apiConfig.endpoints.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.nombre}: ${ep.method}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

recrearAPI();
