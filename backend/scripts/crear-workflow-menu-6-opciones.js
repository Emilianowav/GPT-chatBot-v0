import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowMenu6Opciones() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔄 Creando workflow con menú de 6 opciones...\n');

    const workflow = {
      id: 'veo-veo-atencion',
      nombre: 'Veo Veo - Atención al Cliente',
      activo: true,
      trigger: {
        tipo: 'keyword',
        keywords: ['hola', 'menu', 'inicio', 'ayuda', 'consulta', 'libro', 'libros', 'comprar']
      },
      mensajeInicial: 'Hola 👋\n¡Bienvenido/a a Librería Veo Veo! 📚✏️\nEstamos para ayudarte.',
      configPago: {
        seña: 1,
        porcentajeSeña: 1,
        tiempoExpiracion: 15,
        moneda: 'ARS'
      },
      steps: [
        // PASO 1: Menú principal con 6 opciones
        {
          orden: 1,
          nombre: 'Menú principal',
          tipo: 'recopilar',
          nombreVariable: 'opcion_menu',
          pregunta: '👉 Por favor, elegí una opción:\n\n1️⃣ Consultar por libros escolares u otros títulos\n2️⃣ Libros de Inglés\n3️⃣ Atención post venta\n4️⃣ Información del local\n5️⃣ Promociones vigentes\n6️⃣ Atención personalizada\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4', '5', '6'],
            mapeo: {
              '1': 'consultar_libros',
              '2': 'libros_ingles',
              '3': 'post_venta',
              '4': 'info_local',
              '5': 'promociones',
              '6': 'atencion_personalizada'
            }
          }
        },

        // ============================================
        // OPCIÓN 2: LIBROS DE INGLÉS (Mensaje directo)
        // ============================================
        {
          orden: 2,
          nombre: 'Libros de Inglés',
          tipo: 'mensaje',
          mensaje: '📚 *Libros de Inglés*\n\nLos libros de inglés se realizan únicamente a pedido con seña.\n\nPara realizar su pedido, comunicate con nuestros asesores de venta directos:\n\n👉 https://wa.me/5493794057297?text=Hola%20busco%20un%20libro%20de%20ingles%20a%20pedido\n\n¿Necesitás algo más? Escribí "menu" para volver al inicio.'
        },

        // ============================================
        // OPCIÓN 3: ATENCIÓN POST VENTA (Sub-menú)
        // ============================================
        {
          orden: 3,
          nombre: 'Menú post venta',
          tipo: 'recopilar',
          nombreVariable: 'opcion_post_venta',
          pregunta: '📦 *Atención post venta*\n\nElegí una opción:\n\n1️⃣ Compré mi libro y quiero retirarlo\n2️⃣ Compré un libro por error\n3️⃣ El libro que compré tiene fallas de fábrica\n4️⃣ Compré un libro y quiero que me lo envíen\n5️⃣ Consultar estado de una compra\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4', '5']
          }
        },

        // ============================================
        // OPCIÓN 4: INFORMACIÓN DEL LOCAL (Mensaje directo)
        // ============================================
        {
          orden: 4,
          nombre: 'Información del local',
          tipo: 'mensaje',
          mensaje: '🏪 *Información del local*\n\n📍 Dirección: San Juan 1037, Corrientes Capital\n\n🕗 Horarios de atención:\n• 8:30 a 12:00hs\n• 17:00 a 21:00hs\n\n📞 Contacto:\n• WhatsApp: +54 9 3794 05-7297\n\n¿Necesitás algo más? Escribí "menu" para volver al inicio.'
        },

        // ============================================
        // OPCIÓN 5: PROMOCIONES VIGENTES (Mensaje directo)
        // ============================================
        {
          orden: 5,
          nombre: 'Promociones vigentes',
          tipo: 'mensaje',
          mensaje: '🎁 *Promociones vigentes*\n\n⚠️ LEER CON ATENCIÓN\n\n*Banco de Corrientes:*\n👉 Lunes y Miércoles: 3 cuotas sin interés y 20% de bonificación\nÚnicamente con la app +Banco, con tarjetas Visa y Mastercard\nTope: $20.000\n\n👉 TODOS LOS JUEVES: 30% Off 6 cuotas sin interés\nCON TARJETA BONITA VISA\nTope: $50.000\n\n*Banco Nación:*\n👉 Sábados con MODO BNA+: 10% de reintegro y hasta 3 cuotas sin interés\nTope: $10.000\n\n*Banco Hipotecario:*\n👉 Todos los días: 6 cuotas fijas\n👉 Miércoles: 25% off con débito (tope $10.000)\n\n*LOCRED:*\n👉 Todos los días: 3 y 6 cuotas sin interés\n\n*NaranjaX:*\n👉 planZ 3 cuotas sin interés\n👉 6 cuotas sin interés\n\n*Go Cuotas:*\n👉 Con débito, hasta 3 cuotas sin interés\nRegistrate en https://www.gocuotas.com/\n\n📌 Las promociones son sobre el precio de lista\n\n¿Necesitás algo más? Escribí "menu" para volver al inicio.'
        },

        // ============================================
        // OPCIÓN 6: ATENCIÓN PERSONALIZADA (Mensaje directo)
        // ============================================
        {
          orden: 6,
          nombre: 'Atención personalizada',
          tipo: 'mensaje',
          mensaje: '👤 *Atención personalizada*\n\nPara una atención personalizada, comunicate directamente con nuestros asesores:\n\n👉 https://wa.me/5493794057297?text=Hola%20necesito%20atencion%20personalizada\n\nEstamos para ayudarte con cualquier consulta específica.'
        },

        // ============================================
        // OPCIÓN 1: CONSULTAR LIBROS (Continúa el workflow)
        // ============================================
        {
          orden: 7,
          nombre: 'Solicitar título',
          tipo: 'recopilar',
          nombreVariable: 'titulo',
          pregunta: '1.1: Por favor, ingrese:\n\n📖 *Título:*',
          validacion: {
            tipo: 'texto'
          }
        },
        {
          orden: 8,
          nombre: 'Solicitar editorial',
          tipo: 'recopilar',
          nombreVariable: 'editorial',
          pregunta: '📚 *Editorial:*\n\n(Escribí "omitir" si no sabés)',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        {
          orden: 9,
          nombre: 'Solicitar edición',
          tipo: 'recopilar',
          nombreVariable: 'edicion',
          pregunta: '📝 *Edición:*\n\n(Escribí "omitir" si no sabés)',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        {
          orden: 10,
          nombre: 'Solicitar número de libro',
          tipo: 'recopilar',
          nombreVariable: 'numero_libro',
          pregunta: '🔢 *Número del libro en caso de que tenga:*\n\n(Escribí "omitir" si no tenés)\n\n⚠️ *No enviar fotografía de libros, únicamente por escrito*',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        {
          orden: 11,
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
          orden: 12,
          nombre: 'Información del producto',
          tipo: 'mensaje',
          mensaje: 'Perfecto 😊\n📘 {{producto_nombre}}\n\n💰 Precio: ${{producto_precio}}\n📦 Stock: {{producto_stock}} unidades\n\n🎁 Promociones vigentes: 20% OFF en efectivo o transferencia, las promociones con tarjetas se aplican de forma física en el local\n\n¿Querés comprarlo? Escribí SI para continuar o NO para cancelar'
        },
        {
          orden: 13,
          nombre: 'Confirmar compra',
          tipo: 'recopilar',
          nombreVariable: 'confirmar_compra',
          pregunta: '¿Confirmás la compra?',
          validacion: {
            tipo: 'opcion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        {
          orden: 14,
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
          orden: 15,
          nombre: 'Nombre del cliente',
          tipo: 'recopilar',
          nombreVariable: 'cliente_nombre',
          pregunta: '👤 ¿A nombre de quién hacemos el pedido?',
          validacion: {
            tipo: 'texto'
          }
        },
        {
          orden: 16,
          nombre: 'Teléfono',
          tipo: 'recopilar',
          nombreVariable: 'cliente_telefono',
          pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
          validacion: {
            tipo: 'texto'
          }
        },
        {
          orden: 17,
          nombre: 'Email',
          tipo: 'recopilar',
          nombreVariable: 'cliente_email',
          pregunta: '📧 ¿Cuál es tu email?\n\nLo usaremos para enviarte la confirmación del pedido',
          validacion: {
            tipo: 'texto'
          }
        },
        {
          orden: 18,
          nombre: 'Resumen del pedido',
          tipo: 'recopilar',
          nombreVariable: 'confirmacion_final',
          pregunta: '📋 *Resumen de tu pedido:*\n\n📚 Libro: {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Precio unitario: ${{producto_precio}}\n💵 Total: ${{total}}\n\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n📧 Email: {{cliente_email}}\n\n¿Confirmás el pedido?\nEscribí SI para confirmar o NO para cancelar\n\n_Se enviará un link de pago de Mercado Pago. Una vez abonado, procesaremos tu pedido y te contactaremos para coordinar la entrega._',
          validacion: {
            tipo: 'opcion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        {
          orden: 19,
          nombre: 'Generar link de pago',
          tipo: 'consulta_filtrada',
          nombreVariable: 'pago',
          endpointId: 'generar-link-pago',
          mensajeExito: '💳 *Link de pago generado*\n\n💵 *Total a pagar:* ${{total}}\n\n👉 *Completá el pago aquí:*\n{{link_pago}}\n\n⏰ Tenés 15 minutos para completar el pago.\n\n✅ Una vez confirmado el pago, procesaremos tu pedido y te enviaremos la confirmación por email.\n\n📍 Podés retirar tu libro por San Juan 1037\n🕗 Horario: 8:30 a 12:00hs y 17:00 a 21:00hs\n\n¡Gracias por tu compra! 📚✨'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          workflows: [workflow],
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Workflow con menú de 6 opciones creado:');
    console.log('   Total pasos:', workflow.steps.length);
    console.log('   - Paso 1: Menú con 6 opciones');
    console.log('   - Pasos 2-6: Respuestas directas (opciones 2-6)');
    console.log('   - Pasos 7-19: Flujo de búsqueda y compra (opción 1)');
    console.log('');
    console.log('⚠️ NOTA: El código actual ejecuta TODOS los pasos secuencialmente.');
    console.log('   Necesitamos implementar lógica de saltos/condiciones.');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearWorkflowMenu6Opciones();
