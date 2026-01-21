/**
 * 🧹 LIMPIAR TODO - Conversación completa de Emiliano
 */

import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';
const TELEFONO = '5493794946066';
const EMPRESA = 'San Jose';

async function limpiarTodo() {
  try {
    console.log('\n🧹 LIMPIEZA PROFUNDA DE CONVERSACIÓN\n');
    console.log('='.repeat(80));
    console.log(`📱 Teléfono: ${TELEFONO}`);
    console.log(`🏢 Empresa: ${EMPRESA}\n`);
    
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    // 1. Limpiar conversation_states
    const result1 = await db.collection('conversation_states').deleteMany({
      telefono: TELEFONO
    });
    console.log(`✅ conversation_states eliminados: ${result1.deletedCount}`);
    
    // 2. Limpiar conversaciones_bot (TODAS)
    const result2 = await db.collection('conversaciones_bot').deleteMany({
      clienteTelefono: TELEFONO
    });
    console.log(`✅ conversaciones_bot eliminadas: ${result2.deletedCount}`);
    
    // 3. Limpiar workflowState del contacto
    const result3 = await db.collection('contactos_empresa').updateMany(
      { telefono: TELEFONO },
      { 
        $unset: { 
          workflowState: "",
          'conversaciones.historial': "",
          'conversaciones.ultimaConversacion': "",
          'conversaciones.saludado': "",
          'conversaciones.despedido': ""
        }
      }
    );
    console.log(`✅ contacto limpiado: ${result3.modifiedCount > 0 ? 'SÍ' : 'NO'}`);
    
    // 4. Limpiar flow_states
    const result4 = await db.collection('flow_states').deleteMany({
      telefono: TELEFONO
    });
    console.log(`✅ flow_states eliminados: ${result4.deletedCount}`);
    
    // 5. Limpiar workflow_states
    const result5 = await db.collection('workflow_states').deleteMany({
      telefono: TELEFONO
    });
    console.log(`✅ workflow_states eliminados: ${result5.deletedCount}`);
    
    // 6. Limpiar historial_conversaciones
    const result6 = await db.collection('historial_conversaciones').deleteMany({
      telefono: TELEFONO
    });
    console.log(`✅ historial_conversaciones eliminados: ${result6.deletedCount}`);
    
    // 7. Verificar configuración actual
    console.log('\n📋 VERIFICANDO CONFIGURACIÓN:');
    const config = await db.collection('configuraciones_modulo').findOne({ empresaId: EMPRESA });
    console.log('Campos personalizados:', config?.camposPersonalizados?.map(c => c.clave).join(', '));
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ LIMPIEZA COMPLETA FINALIZADA');
    console.log('\n📝 Ahora envía "Hola" por WhatsApp para empezar desde cero\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

limpiarTodo();
