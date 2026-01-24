import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarMPPayments() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('mppayments');
    
    const count = await paymentsCollection.countDocuments();
    console.log(`\n💳 Total de pagos en mppayments: ${count}\n`);
    
    if (count > 0) {
      // Buscar los últimos 5 pagos
      const ultimosPagos = await paymentsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      console.log(`📊 Últimos 5 pagos:\n`);
      
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
      
      // Buscar pagos de Veo Veo
      console.log('\n🔍 Buscando pagos de Veo Veo...\n');
      
      const empresaIds = ['Veo Veo', '5493794057297', '+5493794057297', null, undefined];
      
      for (const empresaId of empresaIds) {
        const query = empresaId === null || empresaId === undefined 
          ? { empresaId: { $exists: false } }
          : { empresaId };
        const countEmpresa = await paymentsCollection.countDocuments(query);
        const label = empresaId === null ? 'null' : empresaId === undefined ? 'undefined' : `"${empresaId}"`;
        console.log(`   EmpresaId ${label}: ${countEmpresa} pagos`);
        
        if (countEmpresa > 0) {
          const ultimoPago = await paymentsCollection.findOne(
            query,
            { sort: { createdAt: -1 } }
          );
          console.log(`   Último pago: ${ultimoPago.mpPaymentId} - ${ultimoPago.status} - $${ultimoPago.amount}`);
        }
      }
    } else {
      console.log('❌ No hay pagos en la colección mppayments');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarMPPayments();
