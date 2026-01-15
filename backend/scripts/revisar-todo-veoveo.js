import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function revisarTodo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 MENÚ PRINCIPAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(api.menuPrincipal?.mensaje || 'NO CONFIGURADO');
    console.log('\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 WORKFLOWS DISPONIBLES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const workflows = api.workflows || [];
    console.log(`Total workflows: ${workflows.length}\n`);

    workflows.forEach((wf, index) => {
      console.log(`${index + 1}. ${wf.nombre}`);
      console.log(`   Activo: ${wf.activo ? '✅' : '❌'}`);
      console.log(`   Trigger: ${wf.trigger?.tipo || 'NO CONFIGURADO'} - ${wf.trigger?.valor || ''}`);
      console.log(`   Pasos: ${wf.steps?.length || 0}`);
      console.log('');
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DETALLE DE CADA FLUJO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    workflows.forEach((wf, index) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`FLUJO ${index + 1}: ${wf.nombre}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Activo: ${wf.activo ? '✅ SÍ' : '❌ NO'}`);
      console.log(`Trigger: ${JSON.stringify(wf.trigger, null, 2)}`);
      console.log(`\nPASOS (${wf.steps?.length || 0}):\n`);

      wf.steps?.forEach((paso, i) => {
        console.log(`  PASO ${paso.orden}: ${paso.nombre || 'Sin nombre'}`);
        console.log(`    Tipo: ${paso.tipo}`);
        console.log(`    Variable: ${paso.nombreVariable}`);
        
        if (paso.pregunta) {
          const preguntaCorta = paso.pregunta.substring(0, 100).replace(/\n/g, ' ');
          console.log(`    Pregunta: ${preguntaCorta}${paso.pregunta.length > 100 ? '...' : ''}`);
        }
        
        if (paso.endpointId) {
          console.log(`    Endpoint: ${paso.endpointId}`);
        }

        if (paso.mensajeSinResultados) {
          console.log(`    ✅ Tiene mensajeSinResultados configurado`);
        }

        if (paso.permitirVolverAlMenu) {
          console.log(`    ✅ Permite volver al menú (opción 0)`);
        }

        console.log('');
      });
    });

    await mongoose.disconnect();
    console.log('\n✅ Revisión completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

revisarTodo();
