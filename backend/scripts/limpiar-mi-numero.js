import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TELEFONO = '5493794946066';

async function limpiarNumero() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // Limpiar workflowState del contacto
  const r1 = await db.collection('contactoempresas').updateMany(
    { telefono: TELEFONO },
    { $unset: { workflowState: '' } }
  );
  console.log(`✅ workflowState limpiado: ${r1.modifiedCount} contacto(s)`);

  // Limpiar conversation_states
  const r2 = await db.collection('conversation_states').deleteMany({ telefono: TELEFONO });
  console.log(`✅ conversation_states eliminados: ${r2.deletedCount}`);

  // Limpiar historial_conversaciones
  const r3 = await db.collection('historial_conversaciones').deleteMany({ telefono: TELEFONO });
  console.log(`✅ historial_conversaciones eliminados: ${r3.deletedCount}`);

  // Limpiar workflow_states
  const r4 = await db.collection('workflow_states').deleteMany({ telefono: TELEFONO });
  console.log(`✅ workflow_states eliminados: ${r4.deletedCount}`);

  console.log(`\n✅ Estado limpiado para ${TELEFONO}`);
  await mongoose.disconnect();
}

limpiarNumero().catch(console.error);
