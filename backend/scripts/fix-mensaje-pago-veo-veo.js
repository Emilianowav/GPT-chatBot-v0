import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixMensajePago() {
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

    const workflow = api.workflows[workflowIndex];
    const paso7Index = workflow.steps.findIndex(s => s.orden === 7);

    if (paso7Index === -1) {
      console.log('❌ No se encontró paso 7');
      await mongoose.disconnect();
      return;
    }

    console.log('📝 ANTES:');
    console.log('   Pregunta:', workflow.steps[paso7Index].pregunta?.substring(0, 100) + '...');
    console.log('');

    const nuevaPregunta = '💳 *Link de pago generado*\n\n📦 *Resumen de tu pedido:*\n📘 {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Total a pagar: ${{subtotal}}\n\n🔗 *Completá tu compra aquí:*\n{{link_pago}}\n\n⏰ Tenés 10 minutos para completar el pago.\n\n✅ Una vez confirmado el pago, nos contactaremos con vos para coordinar el retiro o envío de tu pedido.';

    // Actualizar el mensaje del paso 7
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          [`workflows.${workflowIndex}.steps.${paso7Index}.pregunta`]: nuevaPregunta
        }
      }
    );

    console.log('✅ Paso 7 actualizado');
    console.log('');
    console.log('📝 DESPUÉS:');
    console.log(nuevaPregunta);

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMensajePago();
