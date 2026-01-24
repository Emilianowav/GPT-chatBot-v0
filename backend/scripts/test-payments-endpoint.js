import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testPaymentsEndpoint() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('mppayments');
    
    const empresaId = '6940a9a181b92bfce970fdb5';
    
    // Simular lo que hace el endpoint
    const payments = await paymentsCollection
      .find({ empresaId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`\n📊 Últimos 5 pagos para empresaId ${empresaId}:\n`);
    
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ID: ${payment.mpPaymentId}`);
      console.log(`   Amount: $${payment.amount}`);
      console.log(`   Items en BD: ${payment.items ? payment.items.length : 0}`);
      if (payment.items && payment.items.length > 0) {
        payment.items.forEach(item => {
          console.log(`      - ${item.nombre} x${item.cantidad} = $${item.precio}`);
        });
      } else {
        console.log(`   ⚠️ Sin items guardados`);
      }
      console.log('');
    });
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPaymentsEndpoint();
