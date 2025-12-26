import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarPaymentLinks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Buscar empresa Juventus
    const empresa = await db.collection('empresas').findOne({ nombre: /juventus/i });
    const empresaId = empresa._id.toString();
    console.log('🏢 EMPRESA JUVENTUS:');
    console.log('   ID:', empresaId);
    console.log('   Nombre:', empresa.nombre);
    console.log('');

    // 2. Buscar seller
    const seller = await db.collection('mpsellers').findOne({ 
      internalId: empresa.nombre 
    });
    console.log('💼 SELLER:');
    console.log('   UserId:', seller.userId);
    console.log('   InternalId:', seller.internalId);
    console.log('');

    // 3. Buscar TODOS los PaymentLinks (ordenados por fecha)
    const paymentLinks = await db.collection('mppaymentlinks').find({
      sellerId: seller.userId
    }).sort({ createdAt: -1 }).toArray();

    console.log('🔗 PAYMENT LINKS TOTALES:', paymentLinks.length);
    console.log('');

    if (paymentLinks.length > 0) {
      console.log('📋 ÚLTIMOS 5 PAYMENT LINKS:');
      paymentLinks.slice(0, 5).forEach((link, index) => {
        console.log(`\n   Link ${index + 1}:`);
        console.log('      ID:', link._id);
        console.log('      Slug:', link.slug);
        console.log('      Title:', link.title);
        console.log('      Active:', link.active);
        console.log('      Unit Price:', link.unitPrice);
        console.log('      MP Preference ID:', link.mpPreferenceId || 'NO');
        console.log('      Pending Booking:', link.pendingBooking ? 'SÍ' : 'NO');
        console.log('      Created:', link.createdAt);
        
        if (link.pendingBooking) {
          console.log('      📋 Booking Data:');
          console.log('         Cliente Phone:', link.pendingBooking.clientePhone);
          console.log('         Contacto ID:', link.pendingBooking.contactoId);
          console.log('         API Config ID:', link.pendingBooking.apiConfigId);
          console.log('         Endpoint ID:', link.pendingBooking.endpointId);
          if (link.pendingBooking.bookingData) {
            console.log('         Cancha ID:', link.pendingBooking.bookingData.cancha_id);
            console.log('         Fecha:', link.pendingBooking.bookingData.fecha);
            console.log('         Hora:', link.pendingBooking.bookingData.hora_inicio);
          }
        }
      });
    } else {
      console.log('   ❌ NO HAY PAYMENT LINKS');
    }

    // 4. Buscar pagos recientes y verificar external_reference
    console.log('\n\n💰 ÚLTIMOS 5 PAGOS:');
    const pagos = await db.collection('mppayments').find({
      sellerId: seller.userId
    }).sort({ createdAt: -1 }).limit(5).toArray();

    pagos.forEach((pago, index) => {
      console.log(`\n   Pago ${index + 1}:`);
      console.log('      ID:', pago._id);
      console.log('      MP Payment ID:', pago.mpPaymentId);
      console.log('      Amount:', pago.amount);
      console.log('      Status:', pago.status);
      console.log('      External Reference:', pago.externalReference);
      console.log('      Created:', pago.createdAt);
      
      // Verificar formato
      if (pago.externalReference) {
        if (pago.externalReference.startsWith('link_')) {
          const linkId = pago.externalReference.replace('link_', '').split('|')[0];
          console.log('      ✅ Formato correcto: link_XXX');
          console.log('      PaymentLink ID:', linkId);
        } else {
          console.log('      ❌ Formato antiguo:', pago.externalReference);
        }
      }
    });

    // 5. Verificar contactos con workflow activo
    console.log('\n\n👥 CONTACTOS CON WORKFLOW ACTIVO:');
    const contactos = await db.collection('contactosempresas').find({
      empresaId: empresaId,
      'workflowState.workflowActivo': true
    }).toArray();

    console.log('   Total:', contactos.length);
    
    if (contactos.length > 0) {
      contactos.forEach((contacto, index) => {
        console.log(`\n   Contacto ${index + 1}:`);
        console.log('      ID:', contacto._id);
        console.log('      Teléfono:', contacto.telefono);
        console.log('      Nombre:', contacto.nombre);
        console.log('      Workflow:', contacto.workflowState?.workflowNombre);
        console.log('      Paso actual:', contacto.workflowState?.pasoActual);
        
        if (contacto.workflowState?.datosRecopilados) {
          const datos = contacto.workflowState.datosRecopilados;
          console.log('      Datos recopilados:');
          console.log('         Deporte:', datos.deporte);
          console.log('         Fecha:', datos.fecha);
          console.log('         Hora:', datos.hora_preferida);
          console.log('         Cliente:', datos.cliente_nombre);
        }
      });
    }

    await mongoose.disconnect();
    console.log('\n\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarPaymentLinks();
