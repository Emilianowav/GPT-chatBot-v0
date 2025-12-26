import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verEstadoCompleto() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Ver workflow actual
    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    console.log('📋 WORKFLOW ACTUAL EN BD:');
    const workflow = api.workflows[0];
    console.log('   Nombre:', workflow.nombre);
    console.log('   ID:', workflow._id);
    console.log('');

    // Mostrar solo los pasos con endpoint
    console.log('🔧 PASOS CON ENDPOINT:');
    workflow.steps.forEach((step, i) => {
      if (step.endpointId) {
        console.log(`   Paso ${i}: ${step.nombre}`);
        console.log(`      Endpoint: ${step.endpointId}`);
        console.log(`      Tipo: ${step.tipo}`);
      }
    });

    // 2. Ver último workflow state del usuario
    console.log('\n\n👤 ÚLTIMO ESTADO DEL USUARIO:');
    const contacto = await db.collection('contactosempresas').findOne({
      telefono: '5493794946066'
    });

    if (contacto) {
      console.log('   Nombre:', contacto.nombre);
      console.log('   Tiene workflow state:', contacto.workflowState ? 'SÍ' : 'NO');
      
      if (contacto.workflowState) {
        console.log('   Workflow ID:', contacto.workflowState.workflowId);
        console.log('   Paso actual:', contacto.workflowState.pasoActual);
        console.log('   Datos recopilados:', JSON.stringify(contacto.workflowState.datosRecopilados, null, 2));
      }
    }

    // 3. Ver PaymentLinks
    console.log('\n\n🔗 PAYMENT LINKS:');
    const paymentLinks = await db.collection('mppaymentlinks').find({}).sort({ createdAt: -1 }).limit(3).toArray();
    console.log('   Total:', paymentLinks.length);
    
    if (paymentLinks.length > 0) {
      paymentLinks.forEach((link, i) => {
        console.log(`\n   Link ${i + 1}:`);
        console.log('      ID:', link._id);
        console.log('      Created:', link.createdAt);
        console.log('      Pending Booking:', link.pendingBooking ? 'SÍ' : 'NO');
      });
    }

    // 4. Ver últimos pagos
    console.log('\n\n💰 ÚLTIMOS PAGOS:');
    const pagos = await db.collection('mppayments').find({}).sort({ createdAt: -1 }).limit(3).toArray();
    
    pagos.forEach((pago, i) => {
      console.log(`\n   Pago ${i + 1}:`);
      console.log('      MP Payment ID:', pago.mpPaymentId);
      console.log('      External Reference:', pago.externalReference);
      console.log('      Created:', pago.createdAt);
      
      if (pago.externalReference?.startsWith('link_')) {
        console.log('      ✅ Formato nuevo (link_XXX)');
      } else {
        console.log('      ❌ Formato antiguo (reserva-XXX)');
      }
    });

    await mongoose.disconnect();
    console.log('\n\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verEstadoCompleto();
