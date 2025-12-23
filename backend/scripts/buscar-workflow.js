import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function buscarWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar workflows de Juventus
    const workflows = await db.collection('workflows').find({
      nombre: /juventus/i
    }).toArray();

    console.log(`📋 Workflows encontrados: ${workflows.length}\n`);

    workflows.forEach((wf, index) => {
      console.log(`${index + 1}. ${wf.nombre}`);
      console.log(`   ID: ${wf._id}`);
      console.log(`   Activo: ${wf.activo}`);
      console.log(`   Pasos: ${wf.steps?.length || 0}`);
      
      // Buscar paso 5
      const paso5 = wf.steps?.find(s => s.orden === 5);
      if (paso5) {
        console.log(`   Paso 5: ${paso5.nombre}`);
        console.log(`   Endpoint: ${paso5.endpointId}`);
        console.log(`   Mapeo: ${JSON.stringify(paso5.mapeoParametros)}`);
      }
      console.log('');
    });

    // Si encontramos el workflow, actualizarlo
    if (workflows.length > 0) {
      const workflow = workflows[0];
      console.log(`\n🔧 Actualizando workflow: ${workflow.nombre}\n`);

      const result = await db.collection('workflows').updateOne(
        { _id: workflow._id, 'steps.orden': 5 },
        {
          $set: {
            'steps.$.mapeoParametros': {
              fecha: 'fecha',
              deporte: 'deporte',
              hora_inicio: 'hora_preferida',  // Cambiar de 'hora' a 'hora_inicio'
              duracion: 'duracion'
            }
          }
        }
      );

      console.log(`✅ Actualizado: ${result.modifiedCount} documento(s)`);

      // Verificar
      const wfActualizado = await db.collection('workflows').findOne({ _id: workflow._id });
      const paso5Actualizado = wfActualizado.steps.find(s => s.orden === 5);
      
      console.log('\n📍 Paso 5 actualizado:');
      console.log('   Mapeo:', paso5Actualizado.mapeoParametros);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

buscarWorkflow();
