import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const TELEFONO = '5493794057297'; // Tu número de prueba

async function limpiar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`LIMPIANDO ESTADO DE ${TELEFONO}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 1. Limpiar contacto
    console.log('1️⃣ Limpiando workflowState del contacto...');
    const contactoUpdate = await db.collection('contactos').updateOne(
      { telefono: TELEFONO },
      {
        $unset: {
          workflowState: '',
          currentWorkflowId: '',
          datosRecopilados: ''
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );
    console.log(`   ✅ Contacto actualizado (${contactoUpdate.modifiedCount} documento)\n`);
    
    // 2. Eliminar conversation_states
    console.log('2️⃣ Eliminando conversation_states...');
    const conversationStates = await db.collection('conversation_states').deleteMany({
      telefono: TELEFONO
    });
    console.log(`   ✅ Estados eliminados (${conversationStates.deletedCount} documentos)\n`);
    
    // 3. Eliminar historial_conversaciones
    console.log('3️⃣ Eliminando historial_conversaciones...');
    const historial = await db.collection('historial_conversaciones').deleteMany({
      telefono: TELEFONO
    });
    console.log(`   ✅ Historial eliminado (${historial.deletedCount} documentos)\n`);
    
    // 4. Eliminar workflow_states
    console.log('4️⃣ Eliminando workflow_states...');
    const workflowStates = await db.collection('workflow_states').deleteMany({
      telefono: TELEFONO
    });
    console.log(`   ✅ Workflow states eliminados (${workflowStates.deletedCount} documentos)\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📱 Ahora puedes enviar "Hola" al bot para probar el flujo desde cero\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

limpiar();
