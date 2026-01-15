import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixFlujoIntencionCompra() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔧 Reestructurando flujo con intención de compra...\n');

    const workflows = api.workflows;
    const workflowIndex = workflows.findIndex(w => w.id === 'veo-veo-consultar-libros');

    if (workflowIndex === -1) {
      console.log('❌ Workflow no encontrado');
      await mongoose.disconnect();
      return;
    }

    // Nuevo flujo optimizado
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
        nombre: 'Buscar productos e intención de compra',
        tipo: 'consulta_filtrada',
        nombreVariable: 'productos_encontrados',
        pregunta: '🔍 Buscando libros...\n\n📚 *Resultados encontrados:*\n\n{{opciones}}\n\n💡 *¿Querés comprar alguno de estos libros?*\n\nEscribí el número del libro que te interesa',
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
        nombre: 'Cantidad',
        tipo: 'recopilar',
        nombreVariable: 'cantidad',
        pregunta: '📦 ¿Cuántos ejemplares querés?\n\nEscribí la cantidad (1-10)',
        validacion: { tipo: 'numero', min: 1, max: 10 }
      },
      {
        orden: 6,
        nombre: 'Nombre del cliente',
        tipo: 'recopilar',
        nombreVariable: 'cliente_nombre',
        pregunta: '👤 ¿A nombre de quién hacemos el pedido?',
        validacion: { tipo: 'texto' }
      },
      {
        orden: 7,
        nombre: 'Teléfono',
        tipo: 'recopilar',
        nombreVariable: 'cliente_telefono',
        pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
        validacion: { tipo: 'texto' }
      },
      {
        orden: 8,
        nombre: 'Email',
        tipo: 'recopilar',
        nombreVariable: 'cliente_email',
        pregunta: '📧 ¿Cuál es tu email?\n\nLo usaremos para enviarte la confirmación del pedido',
        validacion: { tipo: 'texto' }
      },
      {
        orden: 9,
        nombre: 'Generar link de pago',
        tipo: 'consulta_filtrada',
        nombreVariable: 'pago',
        endpointId: 'generar-link-pago',
        mensajeExito: 'Perfecto 😊\n📘 {{producto_nombre}}\n\n💰 Precio: ${{producto_precio}}\n📦 Cantidad: {{cantidad}}\n💵 *Total a pagar: ${{total}}*\n\n🎁 *Promociones vigentes:* 20% OFF en efectivo o transferencia, las promociones con tarjetas se aplican de forma física en el local\n\n🔗 *Link de pago:*\n{{link_pago}}\n\n⚠️ *IMPORTANTE:*\n👉 Una vez realizado el pago, por favor enviános:\n• 📸 *Comprobante de pago*\n• ✍️ *Nombre completo del titular de la cuenta que realizó la transferencia*\n\n⏰ *Retiro del pedido:*\nPodés pasar a retirarlo a partir de las 24 hs de confirmado el pago.\n\n📍 *Dirección:* San Juan 1037\n🕗 *Horario:* 8:30-12:00hs y 17:00-21:00hs\n\nQuedamos atentos para ayudarte con cualquier otra consulta 📚✨'
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

    console.log('✅ Flujo de intención de compra actualizado:');
    console.log('   - Paso 4: Búsqueda + intención de compra');
    console.log('   - Paso 5-8: Datos del cliente (cantidad, nombre, teléfono, email)');
    console.log('   - Paso 9: Genera link de pago y muestra mensaje completo');
    console.log('   - Eliminados: Pasos de confirmación redundantes');
    console.log('   - Total pasos: 9 (antes 11)');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixFlujoIntencionCompra();
