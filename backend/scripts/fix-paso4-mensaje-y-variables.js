import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixPaso4() {
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
    const paso4Index = workflow.steps.findIndex(s => s.orden === 4);

    if (paso4Index === -1) {
      console.log('❌ No se encontró paso 4');
      await mongoose.disconnect();
      return;
    }

    console.log('📝 ANTES:');
    console.log('   Pregunta:', workflow.steps[paso4Index].pregunta);
    console.log('');

    // Actualizar la pregunta del paso 4 - quitar "Buscando libros..."
    const nuevaPregunta = `📚 *Resultados encontrados:*

{{opciones}}

💡 *¿Cuál libro querés agregar a tu compra?*

Escribí el número del libro`;

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          [`workflows.${workflowIndex}.steps.${paso4Index}.pregunta`]: nuevaPregunta
        }
      }
    );

    console.log('✅ Paso 4 actualizado');
    console.log('');
    console.log('📝 DESPUÉS:');
    console.log('   Pregunta:', nuevaPregunta);

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPaso4();
