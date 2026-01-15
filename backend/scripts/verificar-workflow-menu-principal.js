import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('VERIFICACIÓN COMPLETA DEL MENÚ PRINCIPAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 1. Empresa
    const empresa = await db.collection('empresas').findOne({ nombre: /veo veo/i });
    console.log('1️⃣ EMPRESA:');
    console.log(`   Nombre: ${empresa?.nombre}`);
    console.log(`   Activa: ${empresa?.activo ? '✅' : '❌'}`);
    console.log(`   Mensaje Bienvenida: ${empresa?.mensajeBienvenida ? '✅ CONFIGURADO' : '❌ NO'}\n`);
    
    // 2. API Configuration
    const api = await db.collection('api_configurations').findOne({ nombre: /veo veo/i });
    console.log('2️⃣ API CONFIGURATION:');
    console.log(`   Nombre: ${api?.nombre}`);
    console.log(`   Estado: ${api?.estado}`);
    console.log(`   Workflows: ${api?.workflows?.length || 0}\n`);
    
    // 3. Workflow Menú Principal
    const menuWorkflow = api?.workflows?.find(wf => wf.nombre === 'Veo Veo - Menú Principal');
    console.log('3️⃣ WORKFLOW MENÚ PRINCIPAL:');
    if (menuWorkflow) {
      console.log(`   ✅ Encontrado`);
      console.log(`   ID: ${menuWorkflow.id}`);
      console.log(`   Activo: ${menuWorkflow.activo ? '✅' : '❌'}`);
      console.log(`   Prioridad: ${menuWorkflow.prioridad || 0}`);
      console.log(`   Trigger:`);
      console.log(`      Tipo: ${menuWorkflow.trigger?.tipo}`);
      console.log(`      Primera Respuesta: ${menuWorkflow.trigger?.primeraRespuesta ? '✅ SÍ' : '❌ NO'}`);
      console.log(`      Keywords: ${menuWorkflow.trigger?.keywords?.join(', ') || 'ninguna'}`);
      console.log(`   Steps: ${menuWorkflow.steps?.length || 0}`);
      
      if (menuWorkflow.steps && menuWorkflow.steps.length > 0) {
        const primerPaso = menuWorkflow.steps[0];
        console.log(`\n   PRIMER PASO:`);
        console.log(`      Orden: ${primerPaso.orden}`);
        console.log(`      Tipo: ${primerPaso.tipo}`);
        console.log(`      Variable: ${primerPaso.nombreVariable}`);
        console.log(`      Pregunta: ${primerPaso.pregunta?.substring(0, 100)}...`);
        console.log(`      Validación: ${primerPaso.validacion ? JSON.stringify(primerPaso.validacion) : 'NO'}`);
      }
      
      console.log(`\n   WORKFLOWS SIGUIENTES:`);
      if (menuWorkflow.workflowsSiguientes) {
        console.log(`      ✅ CONFIGURADO`);
        console.log(`      Total opciones: ${menuWorkflow.workflowsSiguientes.workflows?.length || 0}`);
        menuWorkflow.workflowsSiguientes.workflows?.forEach(wf => {
          console.log(`         ${wf.opcion} → ${wf.workflowId}`);
        });
      } else {
        console.log(`      ❌ NO CONFIGURADO`);
      }
    } else {
      console.log(`   ❌ No encontrado\n`);
    }
    
    // 4. Verificar workflow "Consultar Libros"
    console.log('\n4️⃣ WORKFLOW CONSULTAR LIBROS:');
    const consultarLibros = api?.workflows?.find(wf => wf.id === 'consultar-libros');
    if (consultarLibros) {
      console.log(`   ✅ Encontrado`);
      console.log(`   Nombre: ${consultarLibros.nombre}`);
      console.log(`   Activo: ${consultarLibros.activo ? '✅' : '❌'}`);
      console.log(`   Steps: ${consultarLibros.steps?.length || 0}`);
      
      if (consultarLibros.steps && consultarLibros.steps.length > 0) {
        const primerPaso = consultarLibros.steps[0];
        console.log(`\n   PRIMER PASO:`);
        console.log(`      Orden: ${primerPaso.orden}`);
        console.log(`      Tipo: ${primerPaso.tipo}`);
        console.log(`      Variable: ${primerPaso.nombreVariable}`);
        console.log(`      Pregunta: ${primerPaso.pregunta?.substring(0, 150)}...`);
      }
    } else {
      console.log(`   ❌ No encontrado`);
    }
    
    // 5. Diagnóstico
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DIAGNÓSTICO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const problemas = [];
    
    if (!empresa?.activo) problemas.push('❌ Empresa inactiva');
    if (!empresa?.mensajeBienvenida) problemas.push('❌ Sin mensaje de bienvenida');
    if (!menuWorkflow) problemas.push('❌ Workflow Menú Principal no encontrado');
    if (menuWorkflow && !menuWorkflow.activo) problemas.push('❌ Menú Principal inactivo');
    if (menuWorkflow && !menuWorkflow.trigger?.primeraRespuesta) problemas.push('❌ Menú Principal sin primeraRespuesta');
    if (menuWorkflow && !menuWorkflow.workflowsSiguientes) problemas.push('❌ Sin workflowsSiguientes configurado');
    if (!consultarLibros) problemas.push('❌ Workflow Consultar Libros no encontrado');
    if (consultarLibros && !consultarLibros.activo) problemas.push('❌ Consultar Libros inactivo');
    
    if (problemas.length > 0) {
      console.log('⚠️  PROBLEMAS DETECTADOS:');
      problemas.forEach(p => console.log(`   ${p}`));
    } else {
      console.log('✅ TODO CONFIGURADO CORRECTAMENTE');
      console.log('\n📝 COMPORTAMIENTO ESPERADO:');
      console.log('   1. Usuario envía "Hola"');
      console.log('   2. Bot activa workflow "Menú Principal" (primeraRespuesta=true)');
      console.log('   3. Bot muestra pregunta del paso 1');
      console.log('   4. Usuario responde "1"');
      console.log('   5. Bot guarda en variable y finaliza workflow');
      console.log('   6. Bot busca en workflowsSiguientes la opción "1"');
      console.log('   7. Bot encuentra workflowId "consultar-libros"');
      console.log('   8. Bot inicia workflow "Consultar Libros"');
      console.log('   9. Bot muestra primer paso de "Consultar Libros"');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificar();
