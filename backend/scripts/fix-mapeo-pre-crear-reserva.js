import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixMapeoPreCrearReserva() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas');

    const db = client.db('gptchatbot');
    const workflowsCollection = db.collection('workflows');

    // Buscar workflow de Juventus por ID (del log)
    const workflowId = '694b0b35a83ef01dc4c6af6d';
    const workflow = await workflowsCollection.findOne({
      _id: new ObjectId(workflowId)
    });

    if (!workflow) {
      console.log('❌ No se encontró el workflow de Juventus');
      return;
    }

    console.log('\n📋 Workflow encontrado:', workflow.nombre);
    console.log('🆔 ID:', workflow._id);

    // Buscar paso 9 (pre-crear-reserva)
    const paso9 = workflow.steps.find(s => s.orden === 9);
    
    if (!paso9) {
      console.log('❌ No se encontró el paso 9');
      return;
    }

    console.log('\n📍 Paso 9 actual:');
    console.log('   Nombre:', paso9.nombre);
    console.log('   Tipo:', paso9.tipo);
    console.log('   Endpoint:', paso9.endpointId);
    console.log('   Mapeo actual:', JSON.stringify(paso9.mapeoParametros, null, 2));

    // Verificar si el mapeo está correcto
    const mapeoActual = paso9.mapeoParametros || {};
    
    if (mapeoActual.turno_id === 'turno_seleccionado') {
      console.log('\n⚠️ PROBLEMA DETECTADO: turno_id está mapeado a "turno_seleccionado" (objeto completo)');
      console.log('✅ SOLUCIÓN: Cambiar a "cancha_id" (solo el ID)');

      // Actualizar el mapeo
      const nuevoMapeo = {
        ...mapeoActual,
        turno_id: 'cancha_id'  // Cambiar de turno_seleccionado a cancha_id
      };

      const resultado = await workflowsCollection.updateOne(
        { 
          _id: workflow._id,
          'steps.orden': 9
        },
        {
          $set: {
            'steps.$.mapeoParametros': nuevoMapeo
          }
        }
      );

      if (resultado.modifiedCount > 0) {
        console.log('\n✅ Mapeo actualizado correctamente');
        console.log('   Nuevo mapeo:', JSON.stringify(nuevoMapeo, null, 2));
      } else {
        console.log('\n❌ No se pudo actualizar el mapeo');
      }
    } else if (mapeoActual.turno_id === 'cancha_id') {
      console.log('\n✅ El mapeo ya está correcto: turno_id → cancha_id');
    } else {
      console.log('\n⚠️ Mapeo inesperado:', mapeoActual.turno_id);
      console.log('   Se recomienda cambiar a "cancha_id"');
    }

    // Verificar workflow actualizado
    const workflowActualizado = await workflowsCollection.findOne({ _id: workflow._id });
    const paso9Actualizado = workflowActualizado.steps.find(s => s.orden === 9);
    
    console.log('\n📋 Verificación final - Paso 9:');
    console.log('   Mapeo:', JSON.stringify(paso9Actualizado.mapeoParametros, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

fixMapeoPreCrearReserva();
