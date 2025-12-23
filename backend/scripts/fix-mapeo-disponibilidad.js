import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixMapeoDisponibilidad() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar el workflow de Juventus
    const workflow = await db.collection('workflows').findOne({
      nombre: 'Juventus - Reserva de Canchas'
    });

    if (!workflow) {
      console.log('❌ No se encontró el workflow');
      return;
    }

    console.log('✅ Workflow encontrado:', workflow.nombre);
    console.log('📊 Total pasos:', workflow.steps.length);

    // Buscar el paso 5 (consultar disponibilidad)
    const paso5 = workflow.steps.find(s => s.orden === 5);

    if (!paso5) {
      console.log('❌ No se encontró el paso 5');
      return;
    }

    console.log('\n📍 Paso 5 actual:');
    console.log('   Nombre:', paso5.nombre);
    console.log('   Endpoint:', paso5.endpointId);
    console.log('   Mapeo actual:', paso5.mapeoParametros);

    // Actualizar el mapeo de parámetros
    const nuevoMapeo = {
      fecha: 'fecha',           // Se transformará con función
      deporte: 'deporte',       // OK
      hora_inicio: 'hora_preferida',  // Cambiar de 'hora' a 'hora_inicio'
      duracion: 'duracion'      // Se transformará con función
    };

    // Agregar transformaciones
    const transformaciones = {
      fecha: {
        tipo: 'fecha',
        formato: 'YYYY-MM-DD'
      },
      duracion: {
        tipo: 'duracion_a_minutos'
      }
    };

    const result = await db.collection('workflows').updateOne(
      { _id: workflow._id, 'steps.orden': 5 },
      {
        $set: {
          'steps.$.mapeoParametros': nuevoMapeo,
          'steps.$.transformaciones': transformaciones
        }
      }
    );

    console.log('\n✅ Workflow actualizado:', result.modifiedCount);

    // Verificar
    const workflowActualizado = await db.collection('workflows').findOne({
      _id: workflow._id
    });

    const paso5Actualizado = workflowActualizado.steps.find(s => s.orden === 5);

    console.log('\n📍 Paso 5 actualizado:');
    console.log('   Mapeo nuevo:', paso5Actualizado.mapeoParametros);
    console.log('   Transformaciones:', paso5Actualizado.transformaciones);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

fixMapeoDisponibilidad();
