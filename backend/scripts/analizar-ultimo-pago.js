import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function analizarUltimoPago() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Buscar el último pago
    const ultimoPago = await db.collection('mppayments').findOne(
      { mpPaymentId: '139559180240' }
    );

    console.log('💰 ÚLTIMO PAGO (139559180240):');
    console.log('   ID:', ultimoPago._id);
    console.log('   MP Payment ID:', ultimoPago.mpPaymentId);
    console.log('   Status:', ultimoPago.status);
    console.log('   Amount:', ultimoPago.amount);
    console.log('   External Reference:', ultimoPago.externalReference);
    console.log('   Payer Email:', ultimoPago.payerEmail);
    console.log('   Payer Phone:', ultimoPago.payerPhone);
    console.log('   EmpresaId:', ultimoPago.empresaId);
    console.log('   SellerId:', ultimoPago.sellerId);
    console.log('   Created:', ultimoPago.createdAt);
    console.log('');

    // 2. Verificar si hay PaymentLink asociado
    if (ultimoPago.externalReference) {
      console.log('🔗 EXTERNAL REFERENCE:', ultimoPago.externalReference);
      
      // Extraer PaymentLink ID si existe
      if (ultimoPago.externalReference.startsWith('link_')) {
        const linkId = ultimoPago.externalReference.replace('link_', '').split('|')[0];
        console.log('   PaymentLink ID extraído:', linkId);
        
        // Buscar el PaymentLink
        const paymentLink = await db.collection('mppaymentlinks').findOne({
          _id: new mongoose.Types.ObjectId(linkId)
        });
        
        if (paymentLink) {
          console.log('\n✅ PAYMENT LINK ENCONTRADO:');
          console.log('   ID:', paymentLink._id);
          console.log('   Title:', paymentLink.title);
          console.log('   Slug:', paymentLink.slug);
          console.log('   Active:', paymentLink.active);
          console.log('   MP Preference ID:', paymentLink.mpPreferenceId);
          console.log('   Pending Booking:', paymentLink.pendingBooking ? 'SÍ' : 'NO');
          
          if (paymentLink.pendingBooking) {
            console.log('\n📋 DATOS DE RESERVA PENDIENTE:');
            console.log('   Contacto ID:', paymentLink.pendingBooking.contactoId);
            console.log('   Cliente Phone:', paymentLink.pendingBooking.clientePhone);
            console.log('   API Config ID:', paymentLink.pendingBooking.apiConfigId);
            console.log('   Endpoint ID:', paymentLink.pendingBooking.endpointId);
            console.log('   Booking Data:', JSON.stringify(paymentLink.pendingBooking.bookingData, null, 2));
          }
        } else {
          console.log('\n❌ PAYMENT LINK NO ENCONTRADO');
        }
      } else {
        console.log('   ⚠️  External reference NO tiene formato link_XXX');
        console.log('   Formato:', ultimoPago.externalReference);
      }
    } else {
      console.log('❌ No hay external reference');
    }

    // 3. Buscar contacto asociado
    if (ultimoPago.payerPhone) {
      console.log('\n👤 BUSCANDO CONTACTO POR TELÉFONO:', ultimoPago.payerPhone);
      const contacto = await db.collection('contactosempresas').findOne({
        telefono: ultimoPago.payerPhone,
        empresaId: ultimoPago.empresaId
      });
      
      if (contacto) {
        console.log('   ✅ Contacto encontrado:', contacto._id);
        console.log('   Nombre:', contacto.nombre);
        console.log('   Workflow State:', contacto.workflowState ? 'SÍ' : 'NO');
        
        if (contacto.workflowState?.datosRecopilados) {
          console.log('\n📊 DATOS RECOPILADOS EN WORKFLOW:');
          console.log(JSON.stringify(contacto.workflowState.datosRecopilados, null, 2));
        }
      } else {
        console.log('   ❌ Contacto NO encontrado');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Análisis completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analizarUltimoPago();
