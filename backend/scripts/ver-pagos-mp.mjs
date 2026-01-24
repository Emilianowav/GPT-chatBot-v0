import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verPagos() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    // Ver todas las empresas
    const empresasCollection = db.collection('empresas');
    const empresas = await empresasCollection.find({}).toArray();
    console.log('═'.repeat(80));
    console.log('EMPRESAS EN LA BD');
    console.log('═'.repeat(80));
    empresas.forEach(e => {
      console.log(`- ${e.nombre} (${e._id})`);
    });
    
    // Ver todos los sellers
    const sellersCollection = db.collection('sellers');
    const sellers = await sellersCollection.find({}).toArray();
    console.log('\n' + '═'.repeat(80));
    console.log('SELLERS EN LA BD');
    console.log('═'.repeat(80));
    sellers.forEach(s => {
      console.log(`- internalId: ${s.internalId}, userId: ${s.userId}, active: ${s.active}`);
    });
    
    // Ver todos los pagos
    const paymentsCollection = db.collection('payments');
    const payments = await paymentsCollection.find({}).toArray();
    console.log('\n' + '═'.repeat(80));
    console.log(`PAGOS EN LA BD (${payments.length})`);
    console.log('═'.repeat(80));
    
    if (payments.length === 0) {
      console.log('No hay pagos registrados');
    } else {
      payments.forEach((p, i) => {
        console.log(`\n${i + 1}. Pago ${p.mpPaymentId}`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Amount: $${p.amount} ${p.currency}`);
        console.log(`   Seller ID: ${p.sellerId}`);
        console.log(`   Empresa ID: ${p.empresaId}`);
        console.log(`   External Ref: ${p.externalReference}`);
        console.log(`   Fecha: ${p.createdAt}`);
      });
    }
    
    // Verificar qué empresaId se está usando en el frontend
    console.log('\n' + '═'.repeat(80));
    console.log('DIAGNÓSTICO');
    console.log('═'.repeat(80));
    console.log('\nEl frontend está usando empresaId: "default"');
    console.log('\nPara que funcione, necesitas:');
    console.log('1. Una empresa con nombre "default" o _id "default"');
    console.log('2. Un seller con internalId igual al nombre de esa empresa');
    console.log('3. Pagos con empresaId igual al _id de esa empresa');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verPagos();
