import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarUltimoPago() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('payments');
    
    // Buscar los últimos 5 pagos
    const ultimosPagos = await paymentsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`\n📊 Últimos 5 pagos en la BD:\n`);
    
    ultimosPagos.forEach((pago, index) => {
      console.log(`${index + 1}. Payment ID: ${pago.mpPaymentId}`);
      console.log(`   Status: ${pago.status}`);
      console.log(`   Amount: $${pago.amount}`);
      console.log(`   EmpresaId: ${pago.empresaId}`);
      console.log(`   Payer Phone: ${pago.payerPhone}`);
      console.log(`   Items: ${pago.items ? pago.items.length : 0} productos`);
      if (pago.items && pago.items.length > 0) {
        pago.items.forEach(item => {
          console.log(`      - ${item.nombre} x${item.cantidad} = $${item.precio}`);
        });
      }
      console.log(`   Created: ${pago.createdAt}`);
      console.log('');
    });
    
    // Buscar pagos de Veo Veo específicamente
    console.log('\n🔍 Buscando pagos de Veo Veo...\n');
    
    const empresaIds = ['Veo Veo', '5493794057297', '+5493794057297'];
    
    for (const empresaId of empresaIds) {
      const count = await paymentsCollection.countDocuments({ empresaId });
      console.log(`   EmpresaId "${empresaId}": ${count} pagos`);
      
      if (count > 0) {
        const ultimoPago = await paymentsCollection.findOne(
          { empresaId },
          { sort: { createdAt: -1 } }
        );
        console.log(`   Último pago: ${ultimoPago.mpPaymentId} - ${ultimoPago.status} - $${ultimoPago.amount}`);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarUltimoPago();
