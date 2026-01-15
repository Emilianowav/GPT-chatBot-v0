import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixFlujoCarritoCompras() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔧 Implementando carrito de compras...\n');

    const workflows = api.workflows;
    const workflowIndex = workflows.findIndex(w => w.id === 'veo-veo-consultar-libros');

    if (workflowIndex === -1) {
      console.log('❌ Workflow no encontrado');
      await mongoose.disconnect();
      return;
    }

    // Flujo con carrito de compras
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
        nombreVariable: 'agregar_mas',
        pregunta: '✅ *{{producto_nombre}}* agregado a tu compra\n📦 Cantidad: {{cantidad}}\n💰 Subtotal: ${{subtotal}}\n\n¿Querés agregar otro libro?\n\n1️⃣ Sí, agregar otro libro\n2️⃣ No, finalizar compra\n\nEscribí el número',
        validacion: {
          tipo: 'opcion',
          opciones: ['1', '2']
        }
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
        nombre: 'Generar link de pago',
        tipo: 'consulta_filtrada',
        nombreVariable: 'pago',
        endpointId: 'generar-link-pago',
        mensajeExito: '🛒 *Resumen de tu compra:*\n\n{{resumen_productos}}\n\n💵 *Total a pagar: ${{total}}*\n\n🎁 *Promociones vigentes:* 20% OFF en efectivo o transferencia, las promociones con tarjetas se aplican de forma física en el local\n\n🔗 *Link de pago:*\n{{link_pago}}\n\n⚠️ *IMPORTANTE:*\n👉 Una vez realizado el pago, por favor enviános:\n• 📸 *Comprobante de pago*\n• ✍️ *Nombre completo del titular de la cuenta que realizó la transferencia*\n\n⏰ *Retiro del pedido:*\nPodés pasar a retirarlo a partir de las 24 hs de confirmado el pago.\n\n📍 *Dirección:* San Juan 1037\n🕗 *Horario:* 8:30-12:00hs y 17:00-21:00hs\n\nQuedamos atentos para ayudarte con cualquier otra consulta 📚✨'
      }
    ];

    // Configurar workflowsSiguientes para el paso 6 (agregar más libros)
    workflows[workflowIndex].workflowsSiguientes = {
      pregunta: null,
      workflows: [
        { workflowId: 'veo-veo-consultar-libros', opcion: '1' } // Si elige "1", volver a buscar
      ]
    };

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

    console.log('✅ Carrito de compras implementado:');
    console.log('   - Paso 4: Búsqueda de productos');
    console.log('   - Paso 5: Cantidad del libro');
    console.log('   - Paso 6: ¿Agregar más libros? (1=Sí, 2=No)');
    console.log('   - Si elige "1": Vuelve al inicio para buscar otro libro');
    console.log('   - Si elige "2": Continúa a datos del cliente');
    console.log('   - Paso 7-9: Datos del cliente');
    console.log('   - Paso 10: Genera link de pago con resumen completo');
    console.log('   - Total pasos: 10');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixFlujoCarritoCompras();
