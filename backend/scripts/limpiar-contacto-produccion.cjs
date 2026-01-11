const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const TELEFONO = '5493794946066';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    
    console.log(`🧹 Limpiando estado para: ${TELEFONO}\n`);
    
    // Limpiar contactos_empresa
    const contactosResult = await db.collection('contactos_empresa').updateMany(
      { telefono: TELEFONO },
      { 
        $unset: { workflowState: '' },
        $set: { interacciones: 0 }
      }
    );
    console.log(`✅ Contactos empresa: ${contactosResult.modifiedCount} actualizados`);
    
    // Limpiar conversation_states
    const conversationResult = await db.collection('conversation_states').deleteMany({
      telefono: TELEFONO
    });
    console.log(`✅ Conversation states: ${conversationResult.deletedCount} eliminados`);
    
    // Limpiar historial_conversaciones
    const historialResult = await db.collection('historial_conversaciones').deleteMany({
      telefono: TELEFONO
    });
    console.log(`✅ Historial: ${historialResult.deletedCount} eliminados`);
    
    // Limpiar workflow_states
    const workflowResult = await db.collection('workflow_states').deleteMany({
      telefono: TELEFONO
    });
    console.log(`✅ Workflow states: ${workflowResult.deletedCount} eliminados`);
    
    // Verificar estado final
    const contacto = await db.collection('contactos_empresa').findOne({ telefono: TELEFONO });
    
    console.log('\n📋 ESTADO FINAL:');
    console.log(`   Contacto existe: ${!!contacto}`);
    console.log(`   Tiene workflowState: ${!!contacto?.workflowState}`);
    console.log(`   Nombre: ${contacto?.nombre}`);
    console.log(`   Interacciones: ${contacto?.interacciones}`);
    
    console.log('\n✅ Listo para empezar el flujo desde cero');
    console.log('   Escribí "hola" en WhatsApp\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('👋 Desconectado');
  }
}

main();
