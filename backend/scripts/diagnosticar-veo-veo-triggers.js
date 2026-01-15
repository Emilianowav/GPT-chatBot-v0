import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function diagnosticar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // 1. Verificar empresa Veo Veo
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. EMPRESA VEO VEO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const empresa = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });
    
    if (!empresa) {
      console.log('❌ Empresa no encontrada');
      return;
    }
    
    console.log(`✅ Empresa: ${empresa.nombre}`);
    console.log(`   ID: ${empresa._id}`);
    console.log(`   Activa: ${empresa.activo ? '✅' : '❌'}`);
    console.log(`   Mensaje Bienvenida: ${empresa.mensajeBienvenida ? '✅ SÍ' : '❌ NO'}`);
    
    if (empresa.mensajeBienvenida) {
      console.log(`\n   📝 Mensaje:\n${empresa.mensajeBienvenida}`);
    }
    
    // 2. Verificar API Configuration
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. API CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });
    
    if (!api) {
      console.log('❌ API no encontrada');
      return;
    }
    
    console.log(`✅ API: ${api.nombre}`);
    console.log(`   Estado: ${api.estado}`);
    console.log(`   Workflows: ${api.workflows?.length || 0}`);
    
    // 3. Analizar cada workflow y sus triggers
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. WORKFLOWS Y TRIGGERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (api.workflows) {
      api.workflows.forEach((wf, idx) => {
        console.log(`\n${idx + 1}. ${wf.nombre}`);
        console.log(`   ID: ${wf.id}`);
        console.log(`   Activo: ${wf.activo ? '✅' : '❌'}`);
        console.log(`   Prioridad: ${wf.prioridad || 0}`);
        
        if (wf.trigger) {
          console.log(`   Trigger:`);
          console.log(`      Tipo: ${wf.trigger.tipo}`);
          console.log(`      Keywords: ${wf.trigger.keywords?.join(', ') || 'ninguna'}`);
          console.log(`      Primera Respuesta: ${wf.trigger.primeraRespuesta ? '✅ SÍ' : '❌ NO'}`);
        } else {
          console.log(`   ⚠️  Sin trigger configurado`);
        }
        
        if (wf.mensajeInicial) {
          console.log(`   📝 Mensaje Inicial: ${wf.mensajeInicial.substring(0, 50)}...`);
        }
      });
    }
    
    // 4. Verificar flows en nuevo sistema
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4. FLOWS EN NUEVO SISTEMA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const flows = await db.collection('flows').find({
      empresaId: empresa.nombre
    }).toArray();
    
    console.log(`📋 Flows encontrados: ${flows.length}\n`);
    
    flows.forEach((flow, idx) => {
      console.log(`${idx + 1}. ${flow.nombre}`);
      console.log(`   ID: ${flow.id}`);
      console.log(`   Activo: ${flow.activo ? '✅' : '❌'}`);
      console.log(`   Tipo: ${flow.botType || 'N/A'}`);
      console.log(`   Prioridad: ${flow.triggers?.priority || 0}`);
      console.log(`   Keywords: ${flow.triggers?.keywords?.join(', ') || 'ninguna'}`);
      console.log(`   Primera Respuesta: ${flow.triggers?.primeraRespuesta ? '✅ SÍ' : '❌ NO'}`);
    });
    
    // 5. Diagnóstico
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5. DIAGNÓSTICO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Buscar workflow con primeraRespuesta = true
    const workflowBienvenida = api.workflows?.find(wf => 
      wf.trigger?.primeraRespuesta === true && wf.activo !== false
    );
    
    if (workflowBienvenida) {
      console.log(`⚠️  PROBLEMA DETECTADO:`);
      console.log(`   El workflow "${workflowBienvenida.nombre}" tiene primeraRespuesta=true`);
      console.log(`   Esto hace que se active automáticamente al primer mensaje`);
      console.log(`   y NO muestra el mensaje de bienvenida de la empresa.\n`);
    }
    
    if (!empresa.mensajeBienvenida) {
      console.log(`⚠️  PROBLEMA: Empresa sin mensaje de bienvenida configurado\n`);
    }
    
    // Buscar workflows con keywords vacías
    const workflowsSinKeywords = api.workflows?.filter(wf => 
      wf.activo !== false && (!wf.trigger?.keywords || wf.trigger.keywords.length === 0)
    );
    
    if (workflowsSinKeywords && workflowsSinKeywords.length > 0) {
      console.log(`⚠️  Workflows sin keywords (pueden activarse incorrectamente):`);
      workflowsSinKeywords.forEach(wf => {
        console.log(`   - ${wf.nombre}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnosticar();
