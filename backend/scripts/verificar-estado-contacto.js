import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const TELEFONO = '5493794057297';

async function verificar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ESTADO ACTUAL DE ${TELEFONO}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 1. Contacto
    console.log('1️⃣ CONTACTO:');
    const contacto = await db.collection('contactos').findOne({ telefono: TELEFONO });
    
    if (contacto) {
      console.log(`   ✅ Encontrado`);
      console.log(`   Nombre: ${contacto.nombre || 'N/A'}`);
      console.log(`   Empresa: ${contacto.empresaId}`);
      console.log(`   Workflow Activo: ${contacto.currentWorkflowId || 'NINGUNO'}`);
      console.log(`   Workflow State:`);
      if (contacto.workflowState) {
        console.log(`      Paso Actual: ${contacto.workflowState.pasoActual || 'N/A'}`);
        console.log(`      Workflow ID: ${contacto.workflowState.workflowId || 'N/A'}`);
        console.log(`      API Config ID: ${contacto.workflowState.apiConfigId || 'N/A'}`);
        console.log(`      Datos Recopilados:`, JSON.stringify(contacto.workflowState.datosRecopilados || {}, null, 2));
      } else {
        console.log(`      ❌ Sin workflow state`);
      }
    } else {
      console.log(`   ❌ No encontrado`);
    }
    
    // 2. Conversation States
    console.log('\n2️⃣ CONVERSATION STATES:');
    const conversationStates = await db.collection('conversation_states').find({ telefono: TELEFONO }).toArray();
    console.log(`   Total: ${conversationStates.length}`);
    conversationStates.forEach((state, idx) => {
      console.log(`\n   Estado ${idx + 1}:`);
      console.log(`      Workflow: ${state.workflowId || 'N/A'}`);
      console.log(`      Paso: ${state.currentStep || 'N/A'}`);
      console.log(`      Datos:`, JSON.stringify(state.collectedData || {}, null, 2));
    });
    
    // 3. Workflow States
    console.log('\n3️⃣ WORKFLOW STATES:');
    const workflowStates = await db.collection('workflow_states').find({ telefono: TELEFONO }).toArray();
    console.log(`   Total: ${workflowStates.length}`);
    workflowStates.forEach((state, idx) => {
      console.log(`\n   Estado ${idx + 1}:`);
      console.log(`      Workflow: ${state.workflowId || 'N/A'}`);
      console.log(`      Paso: ${state.currentStep || 'N/A'}`);
      console.log(`      Completado: ${state.completed ? 'SÍ' : 'NO'}`);
    });
    
    // 4. Últimos mensajes
    console.log('\n4️⃣ ÚLTIMOS 5 MENSAJES:');
    const mensajes = await db.collection('historial_conversaciones')
      .find({ telefono: TELEFONO })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();
    
    console.log(`   Total en historial: ${mensajes.length}`);
    mensajes.reverse().forEach((msg, idx) => {
      const fecha = new Date(msg.timestamp).toLocaleString('es-AR');
      console.log(`\n   ${idx + 1}. [${fecha}]`);
      console.log(`      De: ${msg.sender}`);
      console.log(`      Mensaje: ${msg.message?.substring(0, 100)}${msg.message?.length > 100 ? '...' : ''}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificar();
