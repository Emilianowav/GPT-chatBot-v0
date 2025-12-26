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

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 WORKFLOW:', workflow.nombre);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Total de pasos:', workflow.steps.length);
    console.log('');

    workflow.steps.forEach((paso, index) => {
      console.log(`\n${'═'.repeat(55)}`);
      console.log(`PASO ${index}: ${paso.pregunta || 'Sin pregunta'}`);
      console.log('═'.repeat(55));
      console.log('Tipo:', paso.tipo);
      console.log('Nombre Variable:', paso.nombreVariable || 'N/A');
      
      if (paso.endpointId) {
        console.log('EndpointId:', paso.endpointId);
      }
      
      if (paso.mapeoParametros) {
        console.log('Mapeo Parámetros:', JSON.stringify(paso.mapeoParametros, null, 2));
      }
      
      if (paso.validacion) {
        console.log('Validación:', JSON.stringify(paso.validacion, null, 2));
      }
      
      if (paso.endpointResponseConfig) {
        console.log('Response Config:', JSON.stringify(paso.endpointResponseConfig, null, 2));
      }
    });

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📊 ANÁLISIS');
    console.log('═══════════════════════════════════════════════════════\n');

    const pasoDisponibilidad = workflow.steps.findIndex(s => s.endpointId === 'consultar-disponibilidad');
    const pasoConfirmacion = workflow.steps.findIndex(s => s.tipo === 'confirmacion');
    const pasoPayment = workflow.steps.findIndex(s => 
      s.pregunta?.toLowerCase().includes('pago') ||
      s.pregunta?.toLowerCase().includes('link') ||
      s.endpointId === 'generar-link-pago'
    );

    console.log('Paso Disponibilidad:', pasoDisponibilidad !== -1 ? pasoDisponibilidad : '❌ NO ENCONTRADO');
    console.log('Paso Confirmación:', pasoConfirmacion !== -1 ? pasoConfirmacion : '❌ NO ENCONTRADO');
    console.log('Paso Payment Link:', pasoPayment !== -1 ? pasoPayment : '❌ NO ENCONTRADO');
    console.log('');

    if (pasoPayment === -1) {
      console.log('⚠️  FALTA PASO DE GENERACIÓN DE PAYMENT LINK\n');
      console.log('Este paso debe:');
      console.log('  1. Tipo: consulta_filtrada');
      console.log('  2. EndpointId: generar-link-pago');
      console.log('  3. Crear PaymentLink con pendingBooking');
      console.log('  4. pendingBooking debe contener:');
      console.log('     - apiConfigId');
      console.log('     - endpointId: "pre-crear-reserva"');
      console.log('     - bookingData: { cancha_id, fecha, hora_inicio, duracion, cliente }');
    }

    await mongoose.disconnect();
    console.log('\n✅ Análisis completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verWorkflow();
