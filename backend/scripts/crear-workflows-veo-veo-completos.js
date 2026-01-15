import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowsCompletos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔄 Creando workflows de Veo Veo con derivaciones...\n');

    // WORKFLOW 1: Menú Principal (con derivaciones)
    const workflowMenu = {
      id: 'veo-veo-menu',
      nombre: 'Veo Veo - Menú Principal',
      activo: true,
      trigger: {
        tipo: 'keyword',
        keywords: ['hola', 'menu', 'inicio', 'ayuda', 'consulta', 'libro', 'libros', 'comprar']
      },
      mensajeInicial: 'Hola 👋\n¡Bienvenido/a a Librería Veo Veo! 📚✏️\nEstamos para ayudarte.',
      steps: [
        {
          orden: 1,
          nombre: 'Menú principal',
          tipo: 'recopilar',
          nombreVariable: 'opcion_menu',
          pregunta: '👉 Por favor, elegí una opción:\n\n1️⃣ Consultar por libros escolares u otros títulos\n2️⃣ Libros de Inglés\n3️⃣ Atención post venta\n4️⃣ Información del local\n5️⃣ Promociones vigentes\n6️⃣ Atención personalizada\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4', '5', '6']
          }
        }
      ],
      workflowsSiguientes: {
        pregunta: null, // No pregunta, deriva automáticamente según la opción
        workflows: [
          { workflowId: 'veo-veo-consultar-libros', opcion: '1' },
          { workflowId: 'veo-veo-libros-ingles', opcion: '2' },
          { workflowId: 'veo-veo-post-venta', opcion: '3' },
          { workflowId: 'veo-veo-info-local', opcion: '4' },
          { workflowId: 'veo-veo-promociones', opcion: '5' },
          { workflowId: 'veo-veo-atencion-personalizada', opcion: '6' }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // WORKFLOW 2: Consultar Libros (Opción 1)
    const workflowConsultarLibros = {
      id: 'veo-veo-consultar-libros',
      nombre: 'Veo Veo - Consultar Libros',
      activo: false, // Solo se activa desde el menú
      configPago: {
        seña: 1,
        porcentajeSeña: 1,
        tiempoExpiracion: 15,
        moneda: 'ARS'
      },
      steps: [
        {
          orden: 1,
          nombre: 'Solicitar título',
          tipo: 'recopilar',
          nombreVariable: 'titulo',
          pregunta: '1.1: Por favor, ingrese:\n\n📖 *Título:*',
          validacion: { tipo: 'texto' }
        },
        {
          orden: 2,
          nombre: 'Solicitar editorial',
          tipo: 'recopilar',
          nombreVariable: 'editorial',
          pregunta: '📚 *Editorial:*\n\n(Escribí "omitir" si no sabés)',
          validacion: { tipo: 'texto', opcional: true }
        },
        {
          orden: 3,
          nombre: 'Solicitar edición',
          tipo: 'recopilar',
          nombreVariable: 'edicion',
          pregunta: '📝 *Edición:*\n\n(Escribí "omitir" si no sabés)',
          validacion: { tipo: 'texto', opcional: true }
        },
        {
          orden: 4,
          nombre: 'Solicitar número de libro',
          tipo: 'recopilar',
          nombreVariable: 'numero_libro',
          pregunta: '🔢 *Número del libro en caso de que tenga:*\n\n(Escribí "omitir" si no tenés)\n\n⚠️ *No enviar fotografía de libros, únicamente por escrito*',
          validacion: { tipo: 'texto', opcional: true }
        },
        {
          orden: 5,
          nombre: 'Buscar productos',
          tipo: 'consulta_filtrada',
          nombreVariable: 'productos_encontrados',
          pregunta: '🔍 Buscando libros...\n\n📚 *Resultados:*\n\n{{opciones}}\n\n¿Cuál libro te interesa?\nEscribí el número',
          endpointId: 'buscar-productos',
          parametros: {
            query: {
              search: '{{titulo}}',
              per_page: 10,
              status: 'publish'
            }
          },
          endpointResponseConfig: {
            idField: 'id',
            displayField: 'name',
            priceField: 'price',
            stockField: 'stock_quantity',
            imageField: 'images[0].src'
          },
          validacion: {
            tipo: 'numero',
            min: 1,
            max: 10
          }
        },
        {
          orden: 6,
          nombre: 'Información del producto',
          tipo: 'recopilar',
          nombreVariable: 'confirmar_compra',
          pregunta: 'Perfecto 😊\n📘 {{producto_nombre}}\n\n💰 Precio: ${{producto_precio}}\n📦 Stock: {{producto_stock}} unidades\n\n🎁 Promociones vigentes: 20% OFF en efectivo o transferencia, las promociones con tarjetas se aplican de forma física en el local\n\n¿Querés comprarlo? Escribí SI para continuar o NO para cancelar',
          validacion: {
            tipo: 'opcion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        {
          orden: 7,
          nombre: 'Cantidad',
          tipo: 'recopilar',
          nombreVariable: 'cantidad',
          pregunta: '📦 ¿Cuántos ejemplares querés?\n\nEscribí la cantidad (1-10)',
          validacion: { tipo: 'numero', min: 1, max: 10 }
        },
        {
          orden: 8,
          nombre: 'Nombre del cliente',
          tipo: 'recopilar',
          nombreVariable: 'cliente_nombre',
          pregunta: '👤 ¿A nombre de quién hacemos el pedido?',
          validacion: { tipo: 'texto' }
        },
        {
          orden: 9,
          nombre: 'Teléfono',
          tipo: 'recopilar',
          nombreVariable: 'cliente_telefono',
          pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
          validacion: { tipo: 'texto' }
        },
        {
          orden: 10,
          nombre: 'Email',
          tipo: 'recopilar',
          nombreVariable: 'cliente_email',
          pregunta: '📧 ¿Cuál es tu email?\n\nLo usaremos para enviarte la confirmación del pedido',
          validacion: { tipo: 'texto' }
        },
        {
          orden: 11,
          nombre: 'Resumen del pedido',
          tipo: 'recopilar',
          nombreVariable: 'confirmacion_final',
          pregunta: '📋 *Resumen de tu pedido:*\n\n📚 Libro: {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Precio unitario: ${{producto_precio}}\n💵 Total: ${{total}}\n\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n📧 Email: {{cliente_email}}\n\n¿Confirmás el pedido?\nEscribí SI para confirmar o NO para cancelar',
          validacion: {
            tipo: 'opcion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        {
          orden: 12,
          nombre: 'Generar link de pago',
          tipo: 'consulta_filtrada',
          nombreVariable: 'pago',
          endpointId: 'generar-link-pago',
          mensajeExito: '💳 *Link de pago generado*\n\n💵 *Total a pagar:* ${{total}}\n\n👉 *Completá el pago aquí:*\n{{link_pago}}\n\n⏰ Tenés 15 minutos para completar el pago.\n\n✅ Una vez confirmado el pago, procesaremos tu pedido.\n\n📍 Retiro: San Juan 1037\n🕗 Horario: 8:30-12:00hs y 17:00-21:00hs\n\n¡Gracias por tu compra! 📚✨'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // WORKFLOW 3: Libros de Inglés (Opción 2)
    const workflowLibrosIngles = {
      id: 'veo-veo-libros-ingles',
      nombre: 'Veo Veo - Libros de Inglés',
      activo: false,
      steps: [
        {
          orden: 1,
          nombre: 'Info libros de inglés',
          tipo: 'mensaje',
          mensaje: '📚 *Libros de Inglés*\n\nLos libros de inglés se realizan únicamente a pedido con seña.\n\nPara realizar tu pedido, comunicate con nuestros asesores de venta:\n\n👉 https://wa.me/5493794057297?text=Hola%20busco%20un%20libro%20de%20ingles%20a%20pedido\n\n¡Te esperamos! 📖'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // WORKFLOW 4: Post Venta (Opción 3)
    const workflowPostVenta = {
      id: 'veo-veo-post-venta',
      nombre: 'Veo Veo - Post Venta',
      activo: false,
      steps: [
        {
          orden: 1,
          nombre: 'Menú post venta',
          tipo: 'recopilar',
          nombreVariable: 'opcion_post_venta',
          pregunta: '📦 *Atención post venta*\n\nElegí una opción:\n\n1️⃣ Compré mi libro y quiero retirarlo\n2️⃣ Compré un libro por error\n3️⃣ El libro tiene fallas de fábrica\n4️⃣ Quiero que me lo envíen\n5️⃣ Consultar estado de compra\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4', '5']
          }
        },
        {
          orden: 2,
          nombre: 'Respuesta post venta',
          tipo: 'mensaje',
          mensaje: '{{respuesta_post_venta}}'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // WORKFLOW 5: Info Local (Opción 4)
    const workflowInfoLocal = {
      id: 'veo-veo-info-local',
      nombre: 'Veo Veo - Información del Local',
      activo: false,
      steps: [
        {
          orden: 1,
          nombre: 'Info del local',
          tipo: 'mensaje',
          mensaje: '🏪 *Información del local*\n\n📍 Dirección: San Juan 1037, Corrientes Capital\n\n🕗 Horarios:\n• 8:30 a 12:00hs\n• 17:00 a 21:00hs\n\n📞 WhatsApp: +54 9 3794 05-7297\n\n¿Necesitás algo más? Escribí "menu" para volver al inicio.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // WORKFLOW 6: Promociones (Opción 5)
    const workflowPromociones = {
      id: 'veo-veo-promociones',
      nombre: 'Veo Veo - Promociones',
      activo: false,
      steps: [
        {
          orden: 1,
          nombre: 'Promociones vigentes',
          tipo: 'mensaje',
          mensaje: '🎁 *Promociones vigentes*\n\n⚠️ LEER CON ATENCIÓN\n\n*Banco de Corrientes:*\n👉 Lunes y Miércoles: 3 cuotas sin interés + 20% bonificación (app +Banco, tope $20.000)\n👉 Jueves: 30% Off 6 cuotas sin interés (Bonita Visa, tope $50.000)\n\n*Banco Nación:*\n👉 Sábados con MODO BNA+: 10% reintegro + 3 cuotas sin interés (tope $10.000)\n\n*Banco Hipotecario:*\n👉 Todos los días: 6 cuotas fijas\n👉 Miércoles: 25% off con débito (tope $10.000)\n\n*LOCRED:* 3 y 6 cuotas sin interés\n*NaranjaX:* planZ 3 cuotas + 6 cuotas sin interés\n*Go Cuotas:* Hasta 3 cuotas sin interés con débito (www.gocuotas.com)\n\n📌 Promociones sobre precio de lista\n\nEscribí "menu" para volver al inicio.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // WORKFLOW 7: Atención Personalizada (Opción 6)
    const workflowAtencionPersonalizada = {
      id: 'veo-veo-atencion-personalizada',
      nombre: 'Veo Veo - Atención Personalizada',
      activo: false,
      steps: [
        {
          orden: 1,
          nombre: 'Derivar a humano',
          tipo: 'mensaje',
          mensaje: '👤 *Atención personalizada*\n\nPara una atención personalizada, comunicate con nuestros asesores:\n\n👉 https://wa.me/5493794057297?text=Hola%20necesito%20atencion%20personalizada\n\n¡Estamos para ayudarte! 😊'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Actualizar con todos los workflows
    const result = await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          workflows: [
            workflowMenu,
            workflowConsultarLibros,
            workflowLibrosIngles,
            workflowPostVenta,
            workflowInfoLocal,
            workflowPromociones,
            workflowAtencionPersonalizada
          ],
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Workflows de Veo Veo creados:');
    console.log('   1. Menú Principal (activo) → deriva a los demás');
    console.log('   2. Consultar Libros (12 pasos)');
    console.log('   3. Libros de Inglés → deriva a humano');
    console.log('   4. Post Venta (sub-menú)');
    console.log('   5. Info Local');
    console.log('   6. Promociones');
    console.log('   7. Atención Personalizada → deriva a humano');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearWorkflowsCompletos();
