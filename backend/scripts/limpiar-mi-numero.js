import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

// Tu número de teléfono
const MI_TELEFONO = '5493794946066';

async function limpiarMiNumero() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    console.log(`\n🧹 Limpiando estado para: ${MI_TELEFONO}\n`);

    // 1. Limpiar workflowState en contactos_empresa
    const resultContactosEmpresa = await db.collection('contactos_empresa').updateMany(
      { telefono: MI_TELEFONO },
      { 
        $unset: { 
          workflowState: '',
          'conversaciones.historial': '',
          'conversaciones.mensaje_ids': ''
        },
        $set: {
          'conversaciones.saludado': false,
          'conversaciones.despedido': false,
          'conversaciones.contactoInformado': false,
          'metricas.interacciones': 0
        }
      }
    );
    console.log(`✅ Contactos empresa: ${resultContactosEmpresa.modifiedCount} actualizados`);

    // 2. Limpiar conversation_states
    const resultConversation = await db.collection('conversation_states').deleteMany(
      { telefono: MI_TELEFONO }
    );
    console.log(`✅ Conversation states: ${resultConversation.deletedCount} eliminados`);

    // 3. Limpiar historial de conversaciones
    const resultHistorial = await db.collection('historial_conversaciones').deleteMany(
      { telefono: MI_TELEFONO }
    );
    console.log(`✅ Historial: ${resultHistorial.deletedCount} eliminados`);

    // 4. Limpiar workflow_states (si existe)
    const resultWorkflowStates = await db.collection('workflow_states').deleteMany(
      { telefono: MI_TELEFONO }
    );
    console.log(`✅ Workflow states: ${resultWorkflowStates.deletedCount} eliminados`);

    // 5. Verificar estado final
    const contacto = await db.collection('contactos_empresa').findOne({ telefono: MI_TELEFONO });
    console.log('\n📋 ESTADO FINAL:');
    console.log('   Contacto existe:', !!contacto);
    console.log('   Tiene workflowState:', !!contacto?.workflowState);
    console.log('   Nombre:', contacto?.nombre);
    console.log('   Interacciones:', contacto?.metricas?.interacciones);

    console.log('\n✅ Listo para empezar el flujo desde cero');
    console.log('   Escribí "hola" o "reservar" en WhatsApp');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

limpiarMiNumero();
