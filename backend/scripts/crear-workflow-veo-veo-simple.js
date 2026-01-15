import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowSimple() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔄 Creando workflow simplificado de Veo Veo...\n');

    // Workflow simplificado: menú principal que deriva a búsqueda de libros
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
        // PASO 1: Menú principal
        {
          orden: 1,
          nombre: 'Menú principal',
          tipo: 'recopilar',
          nombreVariable: 'opcion_menu',
          pregunta: '👉 Por favor, elegí una opción:\n\n1️⃣ Consultar por libros escolares u otros títulos\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        },
        // PASO 2: Solicitar título
        {
          orden: 2,
          nombre: 'Solicitar título',
          tipo: 'recopilar',
          nombreVariable: 'titulo',
          pregunta: '1.1: Por favor, ingrese:\n\n📖 *Título:*',
          validacion: {
            tipo: 'texto'
          }
        },
        // PASO 3: Solicitar editorial
        {
          orden: 3,
          nombre: 'Solicitar editorial',
          tipo: 'recopilar',
          nombreVariable: 'editorial',
          pregunta: '📚 *Editorial:*\n\n(Escribí "omitir" si no sabés)',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        // PASO 4: Solicitar edición
        {
          orden: 4,
          nombre: 'Solicitar edición',
          tipo: 'recopilar',
          nombreVariable: 'edicion',
          pregunta: '📝 *Edición:*\n\n(Escribí "omitir" si no sabés)',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        // PASO 5: Solicitar número de libro
        {
          orden: 5,
          nombre: 'Solicitar número de libro',
          tipo: 'recopilar',
          nombreVariable: 'numero_libro',
          pregunta: '🔢 *Número del libro en caso de que tenga:*\n\n(Escribí "omitir" si no tenés)\n\n⚠️ *No enviar fotografía de libros, únicamente por escrito*',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        // PASO 6: Buscar productos
        {
          orden: 6,
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
        // PASO 7: Mostrar info del producto
        {
          orden: 7,
          nombre: 'Información del producto',
          tipo: 'mensaje',
          mensaje: 'Perfecto 😊\n📘 {{producto_nombre}}\n\n💰 Precio: ${{producto_precio}}\n📦 Stock: {{producto_stock}} unidades\n\n🎁 Promociones vigentes: 20% OFF en efectivo o transferencia, las promociones con tarjetas se aplican de forma física en el local\n\n¿Querés comprarlo? Escribí SI para continuar o NO para cancelar'
        },
        // PASO 8: Confirmar compra
        {
          orden: 8,
          nombre: 'Confirmar compra',
          tipo: 'recopilar',
          nombreVariable: 'confirmar_compra',
          pregunta: '¿Confirmás la compra?',
          validacion: {
            tipo: 'opcion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        // PASO 9: Cantidad
        {
          orden: 9,
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
        // PASO 10: Nombre del cliente
        {
          orden: 10,
          nombre: 'Nombre del cliente',
          tipo: 'recopilar',
          nombreVariable: 'cliente_nombre',
          pregunta: '👤 ¿A nombre de quién hacemos el pedido?',
          validacion: {
            tipo: 'texto'
          }
        },
        // PASO 11: Teléfono
        {
          orden: 11,
          nombre: 'Teléfono',
          tipo: 'recopilar',
          nombreVariable: 'cliente_telefono',
          pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
          validacion: {
            tipo: 'texto'
          }
        },
        // PASO 12: Email
        {
          orden: 12,
          nombre: 'Email',
          tipo: 'recopilar',
          nombreVariable: 'cliente_email',
          pregunta: '📧 ¿Cuál es tu email?\n\nLo usaremos para enviarte la confirmación del pedido',
          validacion: {
            tipo: 'texto'
          }
        },
        // PASO 13: Resumen y confirmación final
        {
          orden: 13,
          nombre: 'Resumen del pedido',
          tipo: 'recopilar',
          nombreVariable: 'confirmacion_final',
          pregunta: '📋 *Resumen de tu pedido:*\n\n📚 Libro: {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Precio unitario: ${{producto_precio}}\n💵 Total: ${{total}}\n\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n📧 Email: {{cliente_email}}\n\n¿Confirmás el pedido?\nEscribí SI para confirmar o NO para cancelar\n\n_Se enviará un link de pago de Mercado Pago. Una vez abonado, procesaremos tu pedido y te contactaremos para coordinar la entrega._',
          validacion: {
            tipo: 'opcion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        // PASO 14: Generar link de pago
        {
          orden: 14,
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

    // Actualizar workflow
    const result = await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          workflows: [workflow],
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Workflow simplificado creado:');
    console.log('   Total pasos:', workflow.steps.length);
    console.log('   Flujo: Menú → Búsqueda (5 datos) → Selección → Compra (5 datos) → Pago');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearWorkflowSimple();
