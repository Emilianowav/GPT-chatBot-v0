import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const TELEFONO = '5493794057297';

async function diagnosticar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DIAGNÓSTICO COMPLETO DEL PROBLEMA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 1. Estado del contacto
    console.log('1️⃣ ESTADO DEL CONTACTO:');
    const contacto = await db.collection('contactos').findOne({ telefono: TELEFONO });
    
    if (contacto) {
      console.log(`   ✅ Contacto encontrado`);
      console.log(`   Empresa: ${contacto.empresaId}`);
      console.log(`   Workflow Activo: ${contacto.currentWorkflowId || 'NINGUNO'}`);
      
      if (contacto.workflowState) {
        console.log(`   Workflow State:`);
        console.log(`      Workflow ID: ${contacto.workflowState.workflowId}`);
        console.log(`      API Config ID: ${contacto.workflowState.apiConfigId}`);
        console.log(`      Paso Actual: ${contacto.workflowState.pasoActual}`);
        console.log(`      Datos Recopilados:`, JSON.stringify(contacto.workflowState.datosRecopilados || {}, null, 2));
      } else {
        console.log(`   ❌ Sin workflow state`);
      }
    } else {
      console.log(`   ❌ Contacto NO encontrado - El bot no está procesando workflows`);
    }
    
    // 2. Últimos mensajes
    console.log('\n2️⃣ ÚLTIMOS MENSAJES:');
    const mensajes = await db.collection('historial_conversaciones')
      .find({ telefono: TELEFONO })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    if (mensajes.length > 0) {
      console.log(`   Total: ${mensajes.length}`);
      mensajes.reverse().forEach((msg, idx) => {
        const fecha = new Date(msg.timestamp).toLocaleTimeString('es-AR');
        console.log(`\n   ${idx + 1}. [${fecha}] ${msg.sender}:`);
        console.log(`      ${msg.message?.substring(0, 150)}${msg.message?.length > 150 ? '...' : ''}`);
      });
    } else {
      console.log(`   ❌ Sin historial - El bot no está guardando mensajes`);
    }
    
    // 3. Workflow Menú Principal
    console.log('\n\n3️⃣ WORKFLOW MENÚ PRINCIPAL:');
    const api = await db.collection('api_configurations').findOne({ nombre: /veo veo/i });
    const menuWorkflow = api?.workflows?.find(wf => wf.nombre === 'Veo Veo - Menú Principal');
    
    if (menuWorkflow) {
      console.log(`   ✅ Encontrado`);
      console.log(`   Activo: ${menuWorkflow.activo ? 'SÍ' : 'NO'}`);
      console.log(`   Primera Respuesta: ${menuWorkflow.trigger?.primeraRespuesta ? 'SÍ' : 'NO'}`);
      console.log(`   Prioridad: ${menuWorkflow.prioridad || 0}`);
      console.log(`   Steps: ${menuWorkflow.steps?.length || 0}`);
      
      if (menuWorkflow.workflowsSiguientes) {
        console.log(`\n   Workflows Siguientes:`);
        menuWorkflow.workflowsSiguientes.workflows?.forEach(wf => {
          console.log(`      ${wf.opcion} → ${wf.workflowId}`);
        });
      } else {
        console.log(`\n   ❌ Sin workflowsSiguientes configurado`);
      }
    } else {
      console.log(`   ❌ No encontrado`);
    }
    
    // 4. Workflow Consultar Libros
    console.log('\n4️⃣ WORKFLOW CONSULTAR LIBROS:');
    const consultarLibros = api?.workflows?.find(wf => wf.id === 'consultar-libros');
    
    if (consultarLibros) {
      console.log(`   ✅ Encontrado`);
      console.log(`   Nombre: ${consultarLibros.nombre}`);
      console.log(`   Activo: ${consultarLibros.activo ? 'SÍ' : 'NO'}`);
      console.log(`   Steps: ${consultarLibros.steps?.length || 0}`);
      
      if (consultarLibros.steps && consultarLibros.steps.length > 0) {
        console.log(`\n   Primer paso:`);
        const paso1 = consultarLibros.steps[0];
        console.log(`      Tipo: ${paso1.tipo}`);
        console.log(`      Variable: ${paso1.nombreVariable}`);
        console.log(`      Pregunta: ${paso1.pregunta?.substring(0, 100)}...`);
      }
    } else {
      console.log(`   ❌ No encontrado`);
    }
    
    // 5. Diagnóstico final
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DIAGNÓSTICO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (!contacto) {
      console.log('❌ PROBLEMA CRÍTICO:');
      console.log('   El contacto no existe en la base de datos.');
      console.log('   Esto significa que el bot NO está usando el workflowConversationalHandler.');
      console.log('   Está respondiendo con GPT conversacional directo.\n');
      console.log('💡 CAUSA PROBABLE:');
      console.log('   1. El backend no se reinició después de los cambios en universalRouter.ts');
      console.log('   2. El código compilado no se está ejecutando');
      console.log('   3. Hay un error en el código que impide activar workflows\n');
      console.log('🔧 SOLUCIÓN:');
      console.log('   1. Reiniciar el backend (pm2 restart backend o npm run dev)');
      console.log('   2. Verificar logs del backend al enviar "Hola"');
      console.log('   3. Verificar que universalRouter.evaluateWorkflowTriggers se ejecute');
    } else if (contacto && contacto.workflowState) {
      console.log('✅ El bot está usando workflows correctamente');
      console.log('   Verificar por qué no está activando el workflow siguiente');
    } else {
      console.log('⚠️ El contacto existe pero sin workflow state');
      console.log('   El bot está procesando mensajes pero no workflows');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnosticar();
