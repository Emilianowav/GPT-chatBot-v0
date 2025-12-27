import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const TELEFONO = '5493794946066';

async function verEstado() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar contacto
    const contacto = await db.collection('contactos_empresa').findOne({
      telefono: TELEFONO
    });

    if (!contacto) {
      console.log('❌ Contacto no encontrado');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 ESTADO DEL WORKFLOW\n');
    console.log('Contacto ID:', contacto._id);
    console.log('Teléfono:', contacto.telefono);
    console.log('');

    if (contacto.workflowState) {
      const ws = contacto.workflowState;
      console.log('🔄 Workflow State:');
      console.log('   workflowId:', ws.workflowId);
      console.log('   pasoActual:', ws.pasoActual);
      console.log('   intentosFallidos:', ws.intentosFallidos);
      console.log('   esperandoRepeticion:', ws.esperandoRepeticion);
      console.log('');
      console.log('📦 Datos Recopilados:');
      console.log(JSON.stringify(ws.datosRecopilados, null, 2));
    } else {
      console.log('⚠️ No hay workflowState activo');
    }

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verEstado();
