import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function diagnosticar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DIAGNÓSTICO WORKFLOW INTERCAPITAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Buscar empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: 'Intercapital'
    });

    console.log('1️⃣ EMPRESA:');
    if (empresa) {
      console.log(`   ✅ Encontrada`);
      console.log(`   - _id: ${empresa._id}`);
      console.log(`   - nombre: ${empresa.nombre}`);
      console.log(`   - telefono: ${empresa.telefono}`);
    } else {
      console.log('   ❌ NO encontrada');
      await mongoose.disconnect();
      return;
    }

    // 2. Buscar API Configuration por empresaId
    console.log('\n2️⃣ API CONFIGURATION (búsqueda por empresaId):');
    const apiPorEmpresaId = await db.collection('api_configurations').findOne({
      empresaId: empresa._id
    });

    if (apiPorEmpresaId) {
      console.log(`   ✅ Encontrada por empresaId`);
      console.log(`   - _id: ${apiPorEmpresaId._id}`);
      console.log(`   - nombre: ${apiPorEmpresaId.nombre}`);
      console.log(`   - activa: ${apiPorEmpresaId.activa}`);
      console.log(`   - workflows: ${apiPorEmpresaId.workflows?.length || 0}`);
    } else {
      console.log('   ❌ NO encontrada por empresaId');
    }

    // 3. Buscar API Configuration por nombre
    console.log('\n3️⃣ API CONFIGURATION (búsqueda por nombre):');
    const apiPorNombre = await db.collection('api_configurations').findOne({
      nombre: /intercapital/i
    });

    if (apiPorNombre) {
      console.log(`   ✅ Encontrada por nombre`);
      console.log(`   - _id: ${apiPorNombre._id}`);
      console.log(`   - nombre: ${apiPorNombre.nombre}`);
      console.log(`   - empresaId: ${apiPorNombre.empresaId}`);
      console.log(`   - activa: ${apiPorNombre.activa}`);
    } else {
      console.log('   ❌ NO encontrada por nombre');
    }

    // 4. Verificar workflows con trigger keyword
    if (apiPorEmpresaId || apiPorNombre) {
      const api = apiPorEmpresaId || apiPorNombre;
      
      console.log('\n4️⃣ WORKFLOWS CON TRIGGER KEYWORD:');
      const workflowsConKeyword = api.workflows?.filter(wf => 
        wf.trigger?.tipo === 'keyword' && wf.activo
      );

      if (workflowsConKeyword && workflowsConKeyword.length > 0) {
        console.log(`   ✅ ${workflowsConKeyword.length} workflow(s) encontrado(s)`);
        workflowsConKeyword.forEach((wf, i) => {
          console.log(`\n   ${i + 1}. ${wf.nombre}`);
          console.log(`      - id: ${wf.id}`);
          console.log(`      - activo: ${wf.activo}`);
          console.log(`      - keywords: ${wf.trigger.keywords?.join(', ')}`);
          console.log(`      - pasos: ${wf.steps?.length || 0}`);
        });
      } else {
        console.log('   ❌ No hay workflows con trigger keyword activos');
      }
    }

    // 5. Verificar si "hola" matchea
    if (apiPorEmpresaId || apiPorNombre) {
      const api = apiPorEmpresaId || apiPorNombre;
      const mensaje = 'hola';
      
      console.log('\n5️⃣ TEST DE MATCH CON "hola":');
      const match = api.workflows?.find(wf => 
        wf.trigger?.tipo === 'keyword' && 
        wf.activo &&
        wf.trigger.keywords?.some(kw => 
          mensaje.toLowerCase().includes(kw.toLowerCase())
        )
      );

      if (match) {
        console.log(`   ✅ Match encontrado: ${match.nombre}`);
      } else {
        console.log('   ❌ No hay match con "hola"');
      }
    }

    // 6. Verificar colección chatbots (puede estar interfiriendo)
    console.log('\n6️⃣ CONFIGURACIÓN BOT (configuracionbots):');
    const configBot = await db.collection('configuracionbots').findOne({
      empresaId: empresa.nombre
    });

    if (configBot) {
      console.log(`   ⚠️  Configuración encontrada`);
      console.log(`   - activo: ${configBot.activo}`);
      console.log(`   - empresaId: ${configBot.empresaId}`);
      if (configBot.activo) {
        console.log('   ⚠️  PROBLEMA: Bot de pasos activo, puede estar bloqueando workflows');
      }
    } else {
      console.log('   ✅ No hay configuración de bot de pasos');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DIAGNÓSTICO COMPLETADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnosticar();
