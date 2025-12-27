import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const TELEFONO = '5493794946066';

async function verEstado() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar contacto
    const contacto = await db.collection('contactos_empresas').findOne({
      telefono: TELEFONO
    });

    if (!contacto) {
      console.log('❌ No se encontró contacto');
      await mongoose.disconnect();
      return;
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 ESTADO DEL CONTACTO');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('Nombre:', contacto.nombre);
    console.log('Teléfono:', contacto.telefono);
    console.log('');

    if (contacto.workflowState) {
      const ws = contacto.workflowState;
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔄 WORKFLOW STATE');
      console.log('═══════════════════════════════════════════════════════\n');
      
      console.log('Workflow ID:', ws.workflowId);
      console.log('Paso Actual:', ws.pasoActual);
      console.log('Completado:', ws.completado);
      console.log('Abandonado:', ws.abandonado);
      console.log('');
      
      console.log('📦 DATOS RECOPILADOS:');
      console.log(JSON.stringify(ws.datosRecopilados, null, 2));
      console.log('');
      
      if (ws.datosEjecutados) {
        console.log('📊 DATOS EJECUTADOS (de APIs):');
        console.log(JSON.stringify(ws.datosEjecutados, null, 2));
        console.log('');
      }
      
      if (ws.intentosFallidos) {
        console.log('⚠️  Intentos fallidos:', ws.intentosFallidos);
      }
    } else {
      console.log('⚠️  No hay workflowState');
    }

    // Buscar workflow
    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (api && api.workflows && api.workflows.length > 0) {
      const workflow = api.workflows[0];
      const pasoActual = contacto.workflowState?.pasoActual || 0;
      
      console.log('\n═══════════════════════════════════════════════════════');
      console.log(`📍 PASO ACTUAL (${pasoActual})`);
      console.log('═══════════════════════════════════════════════════════\n');
      
      if (workflow.steps[pasoActual]) {
        const paso = workflow.steps[pasoActual];
        console.log('Pregunta:', paso.pregunta);
        console.log('Tipo:', paso.tipo);
        console.log('Variable:', paso.nombreVariable);
        
        if (paso.endpointId) {
          console.log('EndpointId:', paso.endpointId);
        }
        
        if (paso.mapeoParametros) {
          console.log('Mapeo Parámetros:', JSON.stringify(paso.mapeoParametros, null, 2));
        }
        
        if (paso.validacion) {
          console.log('Validación:', JSON.stringify(paso.validacion, null, 2));
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Análisis completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verEstado();
