import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api) {
      console.log('❌ No se encontró API');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 API CONFIGURATION COMPLETA\n');
    console.log('='.repeat(80));
    console.log('\n🔧 CONFIGURACIÓN GENERAL:');
    console.log('   Nombre:', api.nombre);
    console.log('   Base URL:', api.baseUrl);
    console.log('   Activa:', api.activa);
    
    console.log('\n📡 ENDPOINTS CONFIGURADOS:');
    if (api.endpoints) {
      api.endpoints.forEach((ep, i) => {
        console.log(`   ${i + 1}. ${ep.id} - ${ep.method} ${ep.path}`);
        if (ep.descripcion) console.log(`      Desc: ${ep.descripcion}`);
      });
    }

    if (api.workflows && api.workflows.length > 0) {
      const workflow = api.workflows[0];
      
      console.log('\n' + '='.repeat(80));
      console.log('\n🔄 WORKFLOW:');
      console.log('   Nombre:', workflow.nombre);
      console.log('   Activo:', workflow.activo);
      console.log('   Trigger:', workflow.trigger);
      console.log('   Mensaje Inicial:', workflow.mensajeInicial ? 'Configurado' : 'No configurado');
      console.log('   Mensaje Final:', workflow.mensajeFinal ? 'Configurado' : 'No configurado');
      
      console.log('\n📝 PASOS DEL WORKFLOW:\n');
      
      workflow.steps.forEach((step, index) => {
        console.log('─'.repeat(60));
        console.log(`PASO ${step.orden} (índice ${index}): ${step.nombre}`);
        console.log(`   tipo: ${step.tipo}`);
        console.log(`   nombreVariable: ${step.nombreVariable}`);
        
        if (step.pregunta) {
          console.log(`   pregunta: "${step.pregunta.substring(0, 80)}${step.pregunta.length > 80 ? '...' : ''}"`);
        }
        
        if (step.endpointId) {
          console.log(`   endpointId: ${step.endpointId}`);
        }
        
        if (step.mapeoParametros) {
          console.log(`   mapeoParametros:`, JSON.stringify(step.mapeoParametros));
        }
        
        if (step.validacion) {
          console.log(`   validacion.tipo: ${step.validacion.tipo}`);
          if (step.validacion.opciones) {
            console.log(`   validacion.opciones: [${step.validacion.opciones.join(', ')}]`);
          }
          if (step.validacion.mapeo) {
            console.log(`   validacion.mapeo:`, JSON.stringify(step.validacion.mapeo));
          }
        }
        
        if (step.endpointResponseConfig) {
          console.log(`   endpointResponseConfig:`, JSON.stringify(step.endpointResponseConfig));
        }
        
        console.log('');
      });
    }

    console.log('='.repeat(80));

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verWorkflow();
