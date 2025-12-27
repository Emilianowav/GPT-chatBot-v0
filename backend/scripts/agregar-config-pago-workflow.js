import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function agregarConfigPago() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];

    // Agregar configuración de pago al workflow
    workflow.configPago = {
      seña: 1,                    // Monto mínimo de seña (Mercado Pago requiere mínimo $1)
      porcentajeSeña: 0.5,        // 50% del total (para referencia, no se usa actualmente)
      tiempoExpiracion: 10,       // Minutos para completar el pago
      moneda: 'ARS'
    };

    // Agregar mensaje de éxito de pago al paso 9 (generar-link-pago)
    const paso9 = workflow.steps.find(s => s.orden === 9);
    if (paso9) {
      paso9.mensajeExito = '💳 *Link de pago generado*\n\n💵 *Precio total:* ${{precio_total}}\n💰 *Seña a pagar:* ${{seña}}\n\n👉 *Completá el pago de la seña aquí:*\n{{link_pago}}\n\n⏰ Tenés {{tiempo_expiracion}} minutos para completar el pago.\n\n✅ Una vez confirmado el pago, tu reserva quedará confirmada automáticamente.\n💡 El resto (${{resto}}) se abona al llegar a la cancha.';
    }

    // Guardar
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: api.workflows } }
    );

    console.log('✅ Configuración de pago agregada al workflow:');
    console.log('   seña:', workflow.configPago.seña);
    console.log('   porcentajeSeña:', workflow.configPago.porcentajeSeña);
    console.log('   tiempoExpiracion:', workflow.configPago.tiempoExpiracion);
    console.log('   moneda:', workflow.configPago.moneda);
    console.log('');
    console.log('✅ Mensaje de éxito agregado al paso 9');

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

agregarConfigPago();
