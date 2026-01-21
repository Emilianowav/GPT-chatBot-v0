/**
 * 🧹 Limpiar estado de conversación de Emiliano
 */

import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';
const TELEFONO = '5493794946066';
const EMPRESA = 'San Jose';

async function limpiarEstado() {
  try {
    console.log('\n🧹 LIMPIANDO ESTADO DE CONVERSACIÓN\n');
    console.log('='.repeat(80));
    console.log(`📱 Teléfono: ${TELEFONO}`);
    console.log(`🏢 Empresa: ${EMPRESA}\n`);
    
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    // 1. Limpiar conversation_states
    const result1 = await db.collection('conversation_states').deleteMany({
      telefono: TELEFONO,
      empresaId: EMPRESA
    });
    console.log(`✅ conversation_states eliminados: ${result1.deletedCount}`);
    
    // 2. Limpiar conversaciones_bot
    const result2 = await db.collection('conversaciones_bot').deleteMany({
      clienteTelefono: TELEFONO,
      empresaId: EMPRESA
    });
    console.log(`✅ conversaciones_bot eliminadas: ${result2.deletedCount}`);
    
    // 3. Limpiar workflowState del contacto
    const result3 = await db.collection('contactos_empresa').updateOne(
      { telefono: TELEFONO, empresaId: EMPRESA },
      { $unset: { workflowState: "" } }
    );
    console.log(`✅ workflowState limpiado: ${result3.modifiedCount > 0 ? 'SÍ' : 'NO'}`);
    
    // 4. Limpiar flow_states
    const result4 = await db.collection('flow_states').deleteMany({
      telefono: TELEFONO,
      empresaId: EMPRESA
    });
    console.log(`✅ flow_states eliminados: ${result4.deletedCount}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ESTADO LIMPIADO COMPLETAMENTE');
    console.log('\n📝 Ahora puedes probar el flujo desde cero:');
    console.log('   1. Envía "Hola" por WhatsApp');
    console.log('   2. Selecciona opción 1 (Reservar viaje)');
    console.log('   3. El bot pedirá: Fecha y Pasajeros');
    console.log('   4. Confirma y listo!\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

limpiarEstado();
