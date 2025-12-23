import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MI_TELEFONO = '5493794946066';

async function buscarContacto() {
  try {
    console.log('🔗 Conectando a producción...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar contacto por teléfono
    console.log(`🔍 Buscando contacto con teléfono: ${MI_TELEFONO}\n`);
    
    const contacto = await db.collection('contactos').findOne({ 
      telefono: MI_TELEFONO 
    });

    if (contacto) {
      console.log('✅ CONTACTO ENCONTRADO:');
      console.log('   ID:', contacto._id.toString());
      console.log('   Nombre:', contacto.nombre);
      console.log('   Teléfono:', contacto.telefono);
      console.log('   Empresa:', contacto.empresaId);
      console.log('   Tiene workflowState:', !!contacto.workflowState);
      
      if (contacto.workflowState) {
        console.log('\n📋 WORKFLOW STATE:');
        console.log('   Workflow ID:', contacto.workflowState.workflowId);
        console.log('   Paso actual:', contacto.workflowState.pasoActual);
        console.log('   Datos recopilados:', JSON.stringify(contacto.workflowState.datosRecopilados, null, 2));
      }

      // Ahora limpiar
      console.log('\n🧹 LIMPIANDO...\n');

      const resultContacto = await db.collection('contactos').updateOne(
        { _id: contacto._id },
        { $unset: { workflowState: '' } }
      );
      console.log(`✅ WorkflowState eliminado: ${resultContacto.modifiedCount}`);

      const resultConversation = await db.collection('conversation_states').deleteMany({
        telefono: MI_TELEFONO
      });
      console.log(`✅ Conversation states: ${resultConversation.deletedCount} eliminados`);

      const resultHistorial = await db.collection('historial_conversaciones').deleteMany({
        telefono: MI_TELEFONO
      });
      console.log(`✅ Historial: ${resultHistorial.deletedCount} eliminados`);

      const resultWorkflowStates = await db.collection('workflow_states').deleteMany({
        telefono: MI_TELEFONO
      });
      console.log(`✅ Workflow states: ${resultWorkflowStates.deletedCount} eliminados`);

      console.log('\n✅ LIMPIEZA COMPLETA');

    } else {
      console.log('❌ No se encontró contacto con ese teléfono');
      
      // Buscar en todas las colecciones
      console.log('\n🔍 Buscando en otras colecciones...\n');
      
      const conversations = await db.collection('conversation_states').find({ telefono: MI_TELEFONO }).toArray();
      console.log(`📋 Conversation states: ${conversations.length}`);
      
      const historial = await db.collection('historial_conversaciones').find({ telefono: MI_TELEFONO }).toArray();
      console.log(`📋 Historial: ${historial.length}`);
      
      const workflowStates = await db.collection('workflow_states').find({ telefono: MI_TELEFONO }).toArray();
      console.log(`📋 Workflow states: ${workflowStates.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

buscarContacto();
