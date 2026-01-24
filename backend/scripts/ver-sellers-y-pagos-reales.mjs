import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verDatosReales() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas (PRODUCCIÓN)\n');
    
    const db = client.db('neural_chatbot');
    
    // Ver sellers
    console.log('═'.repeat(80));
    console.log('SELLERS (mpsellers)');
    console.log('═'.repeat(80));
    const sellersCollection = db.collection('mpsellers');
    const sellers = await sellersCollection.find({}).toArray();
    console.log(`Total: ${sellers.length}\n`);
    sellers.forEach(s => {
      console.log(JSON.stringify(s, null, 2));
    });
    
    // Ver pagos
    console.log('\n' + '═'.repeat(80));
    console.log('PAGOS (mppayments)');
    console.log('═'.repeat(80));
    const paymentsCollection = db.collection('mppayments');
    const allPayments = await paymentsCollection.find({}).toArray();
    console.log(`Total: ${allPayments.length}\n`);
    
    // Agrupar por empresaId
    const byEmpresa = {};
    allPayments.forEach(p => {
      const emp = p.empresaId || 'sin_empresa';
      if (!byEmpresa[emp]) byEmpresa[emp] = [];
      byEmpresa[emp].push(p);
    });
    
    console.log('Pagos por empresa:');
    Object.keys(byEmpresa).forEach(emp => {
      console.log(`\n📊 Empresa ${emp}: ${byEmpresa[emp].length} pagos`);
      byEmpresa[emp].slice(0, 3).forEach(p => {
        console.log(`   - ${p.mpPaymentId}: ${p.status} - $${p.amount} ${p.currency}`);
      });
    });
    
    // Ver empresa Veo Veo
    console.log('\n' + '═'.repeat(80));
    console.log('EMPRESA VEO VEO');
    console.log('═'.repeat(80));
    const empresasCollection = db.collection('empresas');
    const veoVeo = await empresasCollection.findOne({ nombre: 'Veo Veo' });
    
    if (veoVeo) {
      console.log(`ID: ${veoVeo._id}`);
      console.log(`Nombre: ${veoVeo.nombre}`);
      
      // Buscar pagos de Veo Veo
      const veoVeoId = veoVeo._id.toString();
      const pagosVeoVeo = await paymentsCollection.find({ empresaId: veoVeoId }).toArray();
      console.log(`\nPagos de Veo Veo (empresaId: ${veoVeoId}): ${pagosVeoVeo.length}`);
      
      if (pagosVeoVeo.length > 0) {
        pagosVeoVeo.forEach(p => {
          console.log(`   - ${p.mpPaymentId}: ${p.status} - $${p.amount}`);
        });
      }
      
      // Buscar seller de Veo Veo
      const sellerVeoVeo = await sellersCollection.findOne({ internalId: 'Veo Veo' });
      if (sellerVeoVeo) {
        console.log(`\nSeller de Veo Veo:`);
        console.log(`   userId: ${sellerVeoVeo.userId}`);
        console.log(`   internalId: ${sellerVeoVeo.internalId}`);
        
        // Buscar pagos por sellerId
        const pagosPorSeller = await paymentsCollection.find({ sellerId: sellerVeoVeo.userId }).toArray();
        console.log(`\nPagos por sellerId (${sellerVeoVeo.userId}): ${pagosPorSeller.length}`);
      } else {
        console.log('\n❌ No hay seller para Veo Veo');
      }
    }
    
    // Diagnóstico
    console.log('\n' + '═'.repeat(80));
    console.log('DIAGNÓSTICO');
    console.log('═'.repeat(80));
    console.log('\nEl endpoint busca pagos con esta query:');
    console.log('{ sellerId: seller.userId, empresaId: empresaObjectId }');
    console.log('\nPara que funcione necesitas:');
    console.log('1. Seller con internalId igual al nombre de la empresa');
    console.log('2. Pagos con sellerId igual al userId del seller');
    console.log('3. Pagos con empresaId igual al _id de la empresa');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verDatosReales();
