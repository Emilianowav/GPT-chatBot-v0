import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

// Configurar aquí el teléfono a limpiar
const TELEFONO_TEST = '5493794044057'; // Número para testing de Intercapital

async function limpiarEstado() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    console.log(`🧹 Limpiando estado para: ${TELEFONO_TEST}\n`);

    // 1. Limpiar workflow state del contacto
    const contacto = await db.collection('contactos_empresa').findOne({
      telefono: TELEFONO_TEST
    });

    if (contacto) {
      await db.collection('contactos_empresa').updateOne(
        { _id: contacto._id },
        { $unset: { workflowState: 1 } }
      );
      console.log('✅ Workflow state limpiado del contacto');
    } else {
      console.log('⚠️  Contacto no encontrado');
    }

    // 2. Limpiar conversation states
    const conversationStates = await db.collection('conversation_states').deleteMany({
      telefono: TELEFONO_TEST
    });
    console.log(`✅ Conversation states: ${conversationStates.deletedCount} eliminados`);

    // 3. Limpiar historial (opcional)
    const historial = await db.collection('historial_conversaciones').deleteMany({
      telefono: TELEFONO_TEST
    });
    console.log(`✅ Historial: ${historial.deletedCount} eliminados`);

    // 4. Limpiar workflow states
    const workflowStates = await db.collection('workflow_states').deleteMany({
      telefono: TELEFONO_TEST
    });
    console.log(`✅ Workflow states: ${workflowStates.deletedCount} eliminados`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ESTADO LIMPIADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 ESTADO FINAL:');
    if (contacto) {
      const contactoActualizado = await db.collection('contactos_empresa').findOne({
        _id: contacto._id
      });
      console.log(`   Contacto existe: true`);
      console.log(`   Tiene workflowState: ${!!contactoActualizado.workflowState}`);
      console.log(`   Nombre: ${contactoActualizado.nombre || 'Sin nombre'}`);
    }
    console.log('\n✅ Listo para empezar el flujo desde cero');
    console.log('   Escribe "hola" o "intercapital" en WhatsApp\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

limpiarEstado();
