import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    const workflowIndex = api.workflows?.findIndex(w => w.nombre?.includes('Consultar Libros'));

    if (workflowIndex === -1) {
      console.log('❌ No se encontró workflow de consulta de libros');
      await mongoose.disconnect();
      return;
    }

    console.log('🔧 Reestructurando workflow...\n');

    // Nuevo flujo: cuando el usuario elige "2", ir directo a generar link de pago
    // Paso 6: tiene validación con opciones ["1", "2"]
    // Si elige "1": agregar otro libro (volver a paso 1)
    // Si elige "2": ir directo a paso 7 (generar link de pago)
    
    const nuevosSteps = [
      // Paso 1: Título
      {
        orden: 1,
        tipo: 'recopilar',
        nombre: 'Solicitar título',
        nombreVariable: 'titulo',
        pregunta: 'Por favor, ingresa los siguientes datos:\n\n📖 *Título:*\n\n⚠️ *No enviar fotografía de libros, únicamente por escrito*',
        validacion: {
          tipo: 'texto',
          requerido: true
        }
      },
      // Paso 2: Editorial
      {
        orden: 2,
        tipo: 'recopilar',
        nombre: 'Solicitar editorial',
        nombreVariable: 'editorial',
        pregunta: '📚 *Editorial:*\n\n(Escribí "omitir" si no sabés)',
        validacion: {
          tipo: 'texto',
          requerido: false
        }
      },
      // Paso 3: Edición
      {
        orden: 3,
        tipo: 'recopilar',
        nombre: 'Solicitar edición',
        nombreVariable: 'edicion',
        pregunta: '📝 *Edición:*\n\n(Escribí "omitir" si no sabés)',
        validacion: {
          tipo: 'texto',
          requerido: false
        }
      },
      // Paso 4: Buscar productos
      {
        orden: 4,
        tipo: 'consulta_filtrada',
        nombre: 'Buscar productos',
        nombreVariable: 'productos_encontrados',
        endpointId: 'buscar-productos',
        pregunta: '📚 *Resultados encontrados:*\n\n{{opciones}}\n\n💡 *¿Cuál libro querés agregar a tu compra?*\n\nEscribí el número del libro',
        mapeoParametros: {
          search: {
            origen: 'variable',
            nombreVariable: 'titulo'
          }
        },
        endpointResponseConfig: {
          idField: 'id',
          displayField: 'name',
          priceField: 'price',
          stockField: 'stock_quantity'
        },
        validacion: {
          tipo: 'numero',
          requerido: true
        }
      },
      // Paso 5: Cantidad
      {
        orden: 5,
        tipo: 'recopilar',
        nombre: 'Cantidad del libro',
        nombreVariable: 'cantidad',
        pregunta: '📦 ¿Cuántos ejemplares de *{{producto_nombre}}* querés?\n\nEscribí la cantidad (1-10)',
        validacion: {
          tipo: 'numero',
          requerido: true,
          min: 1,
          max: 10
        }
      },
      // Paso 6: Continuar compra o finalizar
      {
        orden: 6,
        tipo: 'recopilar',
        nombre: 'Agregar más libros o finalizar',
        nombreVariable: 'continuar_compra',
        pregunta: '✅ *Libro agregado a tu compra:*\n\n📘 {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Precio: ${{producto_precio}}\n💵 Subtotal: ${{subtotal}}\n\n¿Qué querés hacer?\n\n1️⃣ Agregar otro libro a mi compra\n2️⃣ Finalizar y generar link de pago\n\nEscribí el número',
        validacion: {
          tipo: 'opcion',
          opciones: ['1', '2'],
          requerido: true
        }
      },
      // Paso 7: Generar link de pago (solo si eligió "2")
      {
        orden: 7,
        tipo: 'consulta_filtrada',
        nombre: 'Generar link de pago',
        nombreVariable: 'pago',
        endpointId: 'generar-link-pago',
        pregunta: '💳 *Generando tu link de pago...*\n\n📦 Resumen de tu pedido:\n📘 {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Total: ${{subtotal}}\n\n🔗 Link de pago: {{link_pago}}\n\n📞 *Una vez realizado el pago, te contactaremos para coordinar el retiro o envío.*\n\n¡Gracias por tu compra! 📚✨'
      }
    ];

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          [`workflows.${workflowIndex}.steps`]: nuevosSteps
        }
      }
    );

    console.log('✅ Workflow actualizado');
    console.log('   Total de pasos:', nuevosSteps.length);
    console.log('');
    console.log('📋 Flujo actualizado:');
    console.log('   1. Título');
    console.log('   2. Editorial');
    console.log('   3. Edición');
    console.log('   4. Buscar productos');
    console.log('   5. Cantidad');
    console.log('   6. Continuar compra (1=agregar otro, 2=finalizar)');
    console.log('   7. Generar link de pago (solo si eligió 2)');

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkflow();
