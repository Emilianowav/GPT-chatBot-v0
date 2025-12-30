import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixFlujoCarritoSimple() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔧 Implementando flujo con opción de agregar más libros...\n');

    const workflows = api.workflows;
    const workflowIndex = workflows.findIndex(w => w.id === 'veo-veo-consultar-libros');

    if (workflowIndex === -1) {
      console.log('❌ Workflow no encontrado');
      await mongoose.disconnect();
      return;
    }

    // Flujo simplificado: por ahora solo un libro, pero con la pregunta de agregar más
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
        pregunta: '🔍 Buscando libros...\n\n📚 *Resultados encontrados:*\n\n{{opciones}}\n\n💡 *¿Cuál libro querés agregar a tu compra?*\n\nEscribí el número del libro',
        endpointId: 'buscar-productos',
        mapeoParametros: {
          search: '{{titulo}}',
          per_page: '100',
          status: 'publish'
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
        orden: 5,
        nombre: 'Cantidad del libro',
        tipo: 'recopilar',
        nombreVariable: 'cantidad',
        pregunta: '📦 ¿Cuántos ejemplares de *{{producto_nombre}}* querés?\n\nEscribí la cantidad (1-10)',
        validacion: { tipo: 'numero', min: 1, max: 10 }
      },
      {
        orden: 6,
        nombre: 'Agregar más libros o finalizar',
        tipo: 'recopilar',
        nombreVariable: 'continuar_compra',
        pregunta: '✅ *Libro agregado a tu compra:*\n\n📘 {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Precio: ${{producto_precio}}\n💵 Subtotal: ${{subtotal}}\n\n¿Qué querés hacer?\n\n1️⃣ Agregar otro libro a mi compra\n2️⃣ Finalizar y generar link de pago\n\nEscribí el número',
        validacion: {
          tipo: 'opcion',
          opciones: ['1', '2'],
          mensajeError: 'Por favor escribí 1 para agregar otro libro o 2 para finalizar'
        }
      },
      {
        orden: 7,
        nombre: 'Nombre del cliente',
        tipo: 'recopilar',
        nombreVariable: 'cliente_nombre',
        pregunta: 'Perfecto, vamos a finalizar tu compra 😊\n\n👤 ¿A nombre de quién hacemos el pedido?',
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
        nombre: 'Generar link de pago',
        tipo: 'consulta_filtrada',
        nombreVariable: 'pago',
        endpointId: 'generar-link-pago',
        mensajeExito: '🛒 *Resumen de tu compra:*\n\n📘 {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Precio unitario: ${{producto_precio}}\n\n💵 *Total a pagar: ${{total}}*\n\n🎁 *Promociones vigentes:* 20% OFF en efectivo o transferencia, las promociones con tarjetas se aplican de forma física en el local\n\n🔗 *Link de pago:*\n{{link_pago}}\n\n⚠️ *IMPORTANTE:*\n👉 Una vez realizado el pago, por favor enviános:\n• 📸 *Comprobante de pago*\n• ✍️ *Nombre completo del titular de la cuenta que realizó la transferencia*\n\n⏰ *Retiro del pedido:*\nPodés pasar a retirarlo a partir de las 24 hs de confirmado el pago.\n\n📍 *Dirección:* San Juan 1037\n🕗 *Horario:* 8:30-12:00hs y 17:00-21:00hs\n\nQuedamos atentos para ayudarte con cualquier otra consulta 📚✨'
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

    console.log('✅ Flujo con opción de agregar más libros implementado:');
    console.log('   - Paso 6: Pregunta si quiere agregar otro libro o finalizar');
    console.log('   - Opción 1: Agregar otro libro (por ahora muestra mensaje)');
    console.log('   - Opción 2: Finalizar y continuar a datos del cliente');
    console.log('   - Total pasos: 10');
    console.log('');
    console.log('   ⚠️ NOTA: La funcionalidad de agregar múltiples libros');
    console.log('   requiere lógica adicional en el código del handler');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixFlujoCarritoSimple();
