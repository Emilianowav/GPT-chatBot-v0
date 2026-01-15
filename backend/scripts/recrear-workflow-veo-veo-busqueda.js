import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function recrearWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔄 Recreando workflow de búsqueda de libros escolares...\n');

    // Nuevo workflow con búsqueda compleja
    const nuevoWorkflow = {
      id: 'veo-veo-compra-libros',
      nombre: 'Veo Veo - Compra de Libros',
      activo: true,
      trigger: {
        tipo: 'keyword',
        keywords: ['comprar', 'libro', 'libros', 'catalogo', 'catálogo', 'tienda', 'hola', 'menu']
      },
      mensajeInicial: '¡Hola! 📚\nBienvenido/a a Librería Veo Veo! 📖✏️\nEstamos para ayudarte.',
      configPago: {
        seña: 1,
        porcentajeSeña: 1,
        tiempoExpiracion: 15,
        moneda: 'ARS'
      },
      steps: [
        // PASO 1: Elegir tipo de consulta
        {
          orden: 1,
          nombre: 'Elegir tipo de consulta',
          tipo: 'recopilar',
          nombreVariable: 'tipo_consulta',
          pregunta: '👉 Por favor, elegí una opción:\n\n1️⃣ Consultar por libros escolares u otros títulos\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', 'consultar', 'libros', 'escolares']
          }
        },
        // PASO 1.1: Solicitar título
        {
          orden: 2,
          nombre: 'Solicitar título',
          tipo: 'recopilar',
          nombreVariable: 'titulo',
          pregunta: '1.1: Por favor, ingrese:\n\n📖 *Título:*',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        // PASO 1.2: Solicitar editorial
        {
          orden: 3,
          nombre: 'Solicitar editorial',
          tipo: 'recopilar',
          nombreVariable: 'editorial',
          pregunta: '📚 *Editorial:*',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        // PASO 1.3: Solicitar edición
        {
          orden: 4,
          nombre: 'Solicitar edición',
          tipo: 'recopilar',
          nombreVariable: 'edicion',
          pregunta: '📝 *Edición:*',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        // PASO 1.4: Solicitar número de libro
        {
          orden: 5,
          nombre: 'Solicitar número de libro',
          tipo: 'recopilar',
          nombreVariable: 'numero_libro',
          pregunta: '🔢 *Número del libro en caso de que tenga:*',
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        // PASO 2: Buscar productos con filtros
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
            max: 10,
            mensaje: 'Por favor escribí un número entre 1 y 10'
          }
        },
        // PASO 3: Cantidad
        {
          orden: 7,
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
        // PASO 4: Nombre del cliente
        {
          orden: 8,
          nombre: 'Nombre del cliente',
          tipo: 'recopilar',
          nombreVariable: 'cliente_nombre',
          pregunta: '👤 ¿A nombre de quién hacemos el pedido?',
          validacion: {
            tipo: 'texto'
          }
        },
        // PASO 5: Teléfono
        {
          orden: 9,
          nombre: 'Teléfono',
          tipo: 'recopilar',
          nombreVariable: 'cliente_telefono',
          pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
          validacion: {
            tipo: 'texto'
          }
        },
        // PASO 6: Email
        {
          orden: 10,
          nombre: 'Email',
          tipo: 'recopilar',
          nombreVariable: 'cliente_email',
          pregunta: '📧 ¿Cuál es tu email?\n\nLo usaremos para enviarte la confirmación del pedido',
          validacion: {
            tipo: 'texto'
          }
        },
        // PASO 7: Confirmar pedido
        {
          orden: 11,
          nombre: 'Confirmar pedido',
          tipo: 'recopilar',
          nombreVariable: 'confirmacion',
          pregunta: '📋 *Resumen de tu pedido:*\n\n📚 Libro: {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Precio unitario: ${{precio}}\n💵 Total: ${{total}}\n\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n📧 Email: {{cliente_email}}\n\n¿Confirmás el pedido?\nEscribí SI para confirmar o NO para cancelar\n\n_Se enviará un link de pago de Mercado Pago. Una vez abonado, procesaremos tu pedido y te contactaremos para coordinar la entrega._',
          validacion: {
            tipo: 'opcion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        // PASO 8: Generar link de pago
        {
          orden: 12,
          nombre: 'Generar link de pago',
          tipo: 'consulta_filtrada',
          nombreVariable: 'pago',
          endpointId: 'generar-link-pago',
          mensajeExito: '💳 *Link de pago generado*\n\n💵 *Total a pagar:* ${{total}}\n\n👉 *Completá el pago aquí:*\n{{link_pago}}\n\n⏰ Tenés {{tiempo_expiracion}} minutos para completar el pago.\n\n✅ Una vez confirmado el pago, procesaremos tu pedido y te enviaremos la confirmación por email.'
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
          workflows: [nuevoWorkflow],
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Workflow recreado:');
    console.log('   Total pasos:', nuevoWorkflow.steps.length);
    console.log('   Pasos de recopilación de datos de búsqueda: 5');
    console.log('   - Tipo de consulta');
    console.log('   - Título');
    console.log('   - Editorial');
    console.log('   - Edición');
    console.log('   - Número de libro');
    console.log('   Paso de búsqueda: 1 (con filtros)');
    console.log('   Pasos de compra: 6');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

recrearWorkflow();
