import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixWorkflowBusquedaMejorada() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔧 Mejorando workflow de búsqueda de libros...\n');

    // Encontrar el workflow de consultar libros
    const workflows = api.workflows;
    const workflowIndex = workflows.findIndex(w => w.id === 'veo-veo-consultar-libros');

    if (workflowIndex === -1) {
      console.log('❌ Workflow de consultar libros no encontrado');
      await mongoose.disconnect();
      return;
    }

    // Actualizar el workflow con los cambios
    workflows[workflowIndex].steps = [
      {
        orden: 1,
        nombre: 'Solicitar título',
        tipo: 'recopilar',
        nombreVariable: 'titulo',
        pregunta: 'Por favor, ingresa los siguientes datos:\n\n📖 *Título:*\n\n⚠️ *No enviar fotografía de libros, únicamente por escrito*',
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
        nombre: 'Buscar productos',
        tipo: 'consulta_filtrada',
        nombreVariable: 'productos_encontrados',
        pregunta: '🔍 Buscando libros...\n\n📚 *Resultados:*\n\n{{opciones}}\n\n¿Cuál libro te interesa?\nEscribí el número',
        endpointId: 'buscar-productos',
        parametros: {
          query: {
            search: '{{titulo}}',
            per_page: 100, // Traer hasta 100 productos
            status: 'publish'
          }
        },
        endpointResponseConfig: {
          idField: 'id',
          displayField: 'name',
          priceField: 'price',
          stockField: 'stock_quantity',
          imageField: 'images[0].src',
          filtroInteligente: true, // Flag para activar filtro inteligente
          campoFiltro: 'name' // Campo a filtrar
        },
        validacion: {
          tipo: 'numero',
          min: 1,
          max: 10
        }
      },
      {
        orden: 5,
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
        orden: 6,
        nombre: 'Cantidad',
        tipo: 'recopilar',
        nombreVariable: 'cantidad',
        pregunta: '📦 ¿Cuántos ejemplares querés?\n\nEscribí la cantidad (1-10)',
        validacion: { tipo: 'numero', min: 1, max: 10 }
      },
      {
        orden: 7,
        nombre: 'Nombre del cliente',
        tipo: 'recopilar',
        nombreVariable: 'cliente_nombre',
        pregunta: '👤 ¿A nombre de quién hacemos el pedido?',
        validacion: { tipo: 'texto' }
      },
      {
        orden: 8,
        nombre: 'Teléfono',
        tipo: 'recopilar',
        nombreVariable: 'cliente_telefono',
        pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
        validacion: { tipo: 'texto' }
      },
      {
        orden: 9,
        nombre: 'Email',
        tipo: 'recopilar',
        nombreVariable: 'cliente_email',
        pregunta: '📧 ¿Cuál es tu email?\n\nLo usaremos para enviarte la confirmación del pedido',
        validacion: { tipo: 'texto' }
      },
      {
        orden: 10,
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
        orden: 11,
        nombre: 'Generar link de pago',
        tipo: 'consulta_filtrada',
        nombreVariable: 'pago',
        endpointId: 'generar-link-pago',
        mensajeExito: '💳 *Link de pago generado*\n\n💵 *Total a pagar:* ${{total}}\n\n👉 *Completá el pago aquí:*\n{{link_pago}}\n\n⏰ Tenés 15 minutos para completar el pago.\n\n✅ Una vez confirmado el pago, procesaremos tu pedido.\n\n📍 Retiro: San Juan 1037\n🕗 Horario: 8:30-12:00hs y 17:00-21:00hs\n\n¡Gracias por tu compra! 📚✨'
      }
    ];

    // Actualizar en la base de datos
    const result = await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          workflows: workflows,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Workflow de búsqueda mejorado:');
    console.log('   - Paso 1: Mensaje corregido con advertencia');
    console.log('   - Paso 4 (antes 5): Búsqueda con per_page=100');
    console.log('   - Eliminado: Paso de número de libro');
    console.log('   - Total pasos: 11 (antes 12)');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkflowBusquedaMejorada();
