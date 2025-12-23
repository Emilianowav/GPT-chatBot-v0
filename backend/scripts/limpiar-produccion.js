import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// IMPORTANTE: Usar la URI de producción (MongoDB Atlas)
const MONGODB_URI = process.env.MONGODB_URI;

// Tu número de teléfono
const MI_TELEFONO = '5493794946066';
const CONTACTO_ID = '694aee24135230aae10d6b5c'; // ID del contacto en producción

async function limpiarProduccion() {
  try {
    console.log('🔗 Conectando a:', MONGODB_URI?.substring(0, 50) + '...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    console.log(`\n🧹 LIMPIEZA EN PRODUCCIÓN\n`);
    console.log(`📞 Teléfono: ${MI_TELEFONO}`);
    console.log(`🆔 Contacto ID: ${CONTACTO_ID}\n`);

    // 1. Limpiar workflowState del contacto por ID
    const resultContacto = await db.collection('contactos').updateOne(
      { _id: new mongoose.Types.ObjectId(CONTACTO_ID) },
      { 
        $unset: { 
          workflowState: ''
        } 
      }
    );
    console.log(`✅ WorkflowState eliminado del contacto: ${resultContacto.modifiedCount}`);

    // 2. Limpiar conversation_states
    const resultConversation = await db.collection('conversation_states').deleteMany({
      $or: [
        { telefono: MI_TELEFONO },
        { contactoId: CONTACTO_ID },
        { contactoId: new mongoose.Types.ObjectId(CONTACTO_ID) }
      ]
    });
    console.log(`✅ Conversation states: ${resultConversation.deletedCount} eliminados`);

    // 3. Limpiar historial
    const resultHistorial = await db.collection('historial_conversaciones').deleteMany({
      $or: [
        { telefono: MI_TELEFONO },
        { contactoId: CONTACTO_ID },
        { contactoId: new mongoose.Types.ObjectId(CONTACTO_ID) }
      ]
    });
    console.log(`✅ Historial: ${resultHistorial.deletedCount} eliminados`);

    // 4. Limpiar workflow_states
    const resultWorkflowStates = await db.collection('workflow_states').deleteMany({
      $or: [
        { telefono: MI_TELEFONO },
        { contactoId: CONTACTO_ID },
        { contactoId: new mongoose.Types.ObjectId(CONTACTO_ID) }
      ]
    });
    console.log(`✅ Workflow states: ${resultWorkflowStates.deletedCount} eliminados`);

    // 5. Verificar estado final
    const contactoFinal = await db.collection('contactos').findOne({ 
      _id: new mongoose.Types.ObjectId(CONTACTO_ID) 
    });
    
    console.log('\n📋 ESTADO FINAL:');
    console.log('   Contacto existe:', !!contactoFinal);
    console.log('   Tiene workflowState:', !!contactoFinal?.workflowState);
    console.log('   Nombre:', contactoFinal?.nombre);
    console.log('   Teléfono:', contactoFinal?.telefono);

    console.log('\n✅ Listo para empezar el flujo desde cero');
    console.log('   Escribí "hola" o "reservar" en WhatsApp');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

limpiarProduccion();
