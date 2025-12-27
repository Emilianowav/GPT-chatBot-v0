import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verUltimoPaymentLink() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar el último PaymentLink creado
    const paymentLinks = await db.collection('mppaymentlinks')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    console.log('📋 ÚLTIMOS 5 PAYMENT LINKS:\n');

    paymentLinks.forEach((pl, index) => {
      console.log(`${index + 1}. PaymentLink ID: ${pl._id}`);
      console.log(`   Creado: ${pl.createdAt}`);
      console.log(`   Título: ${pl.title}`);
      console.log(`   Precio: $${pl.unitPrice}`);
      console.log(`   Activo: ${pl.active}`);
      
      if (pl.pendingBooking) {
        console.log(`   📦 Pending Booking:`);
        console.log(`      endpointId: ${pl.pendingBooking.endpointId}`);
        console.log(`      apiConfigId: ${pl.pendingBooking.apiConfigId}`);
        console.log(`      bookingData:`, JSON.stringify(pl.pendingBooking.bookingData, null, 2).substring(0, 200));
      } else {
        console.log(`   ⚠️  No tiene pendingBooking`);
      }
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verUltimoPaymentLink();
