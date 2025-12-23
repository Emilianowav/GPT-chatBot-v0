import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

// Tu número de teléfono
const MI_TELEFONO = '5493794946066';

async function limpiarForzado() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    console.log(`\n🧹 LIMPIEZA FORZADA para: ${MI_TELEFONO}\n`);

    // 1. Buscar contacto por teléfono (cualquier formato)
    const contacto = await db.collection('contactos').findOne({
      $or: [
        { telefono: MI_TELEFONO },
        { telefono: `+${MI_TELEFONO}` },
        { telefono: MI_TELEFONO.substring(2) }, // sin código país
      ]
    });

    if (contacto) {
      console.log('📞 Contacto encontrado:', contacto._id.toString());
      console.log('   Nombre:', contacto.nombre);
      console.log('   Teléfono:', contacto.telefono);
      console.log('   Tiene workflowState:', !!contacto.workflowState);

      // Limpiar workflowState del contacto
      const resultContacto = await db.collection('contactos').updateOne(
        { _id: contacto._id },
        { 
          $unset: { 
            workflowState: '',
            'workflowState.workflowId': '',
            'workflowState.pasoActual': '',
            'workflowState.datosRecopilados': '',
            'workflowState.datosEjecutados': ''
          } 
        }
      );
      console.log(`✅ WorkflowState eliminado del contacto: ${resultContacto.modifiedCount}`);

      // Limpiar por ID del contacto
      const contactoId = contacto._id.toString();

      // 2. Limpiar conversation_states por contactoId
      const resultConversation = await db.collection('conversation_states').deleteMany({
        $or: [
          { telefono: MI_TELEFONO },
          { contactoId: contactoId },
          { contactoId: contacto._id }
        ]
      });
      console.log(`✅ Conversation states: ${resultConversation.deletedCount} eliminados`);

      // 3. Limpiar historial
      const resultHistorial = await db.collection('historial_conversaciones').deleteMany({
        $or: [
          { telefono: MI_TELEFONO },
          { contactoId: contactoId },
          { contactoId: contacto._id }
        ]
      });
      console.log(`✅ Historial: ${resultHistorial.deletedCount} eliminados`);

      // 4. Limpiar workflow_states
      const resultWorkflowStates = await db.collection('workflow_states').deleteMany({
        $or: [
          { telefono: MI_TELEFONO },
          { contactoId: contactoId },
          { contactoId: contacto._id }
        ]
      });
      console.log(`✅ Workflow states: ${resultWorkflowStates.deletedCount} eliminados`);

    } else {
      console.log('⚠️ No se encontró contacto con ese teléfono');
      
      // Limpiar por teléfono de todas formas
      const resultConversation = await db.collection('conversation_states').deleteMany({ telefono: MI_TELEFONO });
      console.log(`✅ Conversation states: ${resultConversation.deletedCount} eliminados`);

      const resultHistorial = await db.collection('historial_conversaciones').deleteMany({ telefono: MI_TELEFONO });
      console.log(`✅ Historial: ${resultHistorial.deletedCount} eliminados`);

      const resultWorkflowStates = await db.collection('workflow_states').deleteMany({ telefono: MI_TELEFONO });
      console.log(`✅ Workflow states: ${resultWorkflowStates.deletedCount} eliminados`);
    }

    // 5. Verificar estado final
    const contactoFinal = await db.collection('contactos').findOne({
      $or: [
        { telefono: MI_TELEFONO },
        { telefono: `+${MI_TELEFONO}` },
      ]
    });
    
    console.log('\n📋 ESTADO FINAL:');
    console.log('   Contacto existe:', !!contactoFinal);
    console.log('   Tiene workflowState:', !!contactoFinal?.workflowState);
    console.log('   Nombre:', contactoFinal?.nombre);

    console.log('\n✅ Listo para empezar el flujo desde cero');
    console.log('   Escribí "hola" o "reservar" en WhatsApp');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

limpiarForzado();
