import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verEstructura() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];

    console.log('📋 ESTRUCTURA DETALLADA DEL WORKFLOW\n');
    console.log('='.repeat(80));

    workflow.steps.forEach((step, index) => {
      console.log(`\nPASO ${step.orden} (índice ${index}): ${step.nombre}`);
      console.log(`  tipo: ${step.tipo}`);
      console.log(`  nombreVariable: ${step.nombreVariable}`);
      console.log(`  endpointId: ${step.endpointId || '(ninguno)'}`);
      console.log(`  validacion.tipo: ${step.validacion?.tipo || '(ninguno)'}`);
      if (step.validacion?.opciones) {
        console.log(`  validacion.opciones: ${step.validacion.opciones.join(', ')}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 ANÁLISIS DEL FLUJO:\n');
    
    // Verificar orden de pasos
    const pasoNombre = workflow.steps.find(s => s.nombreVariable === 'cliente_nombre');
    const pasoTelefono = workflow.steps.find(s => s.nombreVariable === 'cliente_telefono');
    const pasoConfirmacion = workflow.steps.find(s => s.nombreVariable === 'confirmacion');
    
    console.log('Paso de nombre:', pasoNombre ? `orden ${pasoNombre.orden}` : 'NO ENCONTRADO');
    console.log('Paso de teléfono:', pasoTelefono ? `orden ${pasoTelefono.orden}` : 'NO ENCONTRADO');
    console.log('Paso de confirmación:', pasoConfirmacion ? `orden ${pasoConfirmacion.orden}` : 'NO ENCONTRADO');

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verEstructura();
