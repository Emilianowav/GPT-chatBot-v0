import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verEstructura() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    // Ver TODOS los sellers
    console.log('═'.repeat(80));
    console.log('SELLERS EN LA BD');
    console.log('═'.repeat(80));
    const sellersCollection = db.collection('sellers');
    const sellers = await sellersCollection.find({}).toArray();
    console.log(`Total: ${sellers.length}\n`);
    sellers.forEach((s, i) => {
      console.log(`${i + 1}. Seller:`);
      console.log(JSON.stringify(s, null, 2));
      console.log('');
    });
    
    // Ver TODOS los pagos
    console.log('\n' + '═'.repeat(80));
    console.log('PAGOS EN LA BD');
    console.log('═'.repeat(80));
    const paymentsCollection = db.collection('payments');
    const payments = await paymentsCollection.find({}).toArray();
    console.log(`Total: ${payments.length}\n`);
    
    if (payments.length > 0) {
      payments.forEach((p, i) => {
        console.log(`${i + 1}. Pago:`);
        console.log(JSON.stringify(p, null, 2));
        console.log('');
      });
    }
    
    // Ver carritos con pagos
    console.log('\n' + '═'.repeat(80));
    console.log('CARRITOS EN LA BD');
    console.log('═'.repeat(80));
    const carritosCollection = db.collection('carritos');
    const carritos = await carritosCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log(`Total (últimos 5): ${carritos.length}\n`);
    
    carritos.forEach((c, i) => {
      console.log(`${i + 1}. Carrito ${c._id}:`);
      console.log(`   Estado: ${c.estado}`);
      console.log(`   Total: $${c.total}`);
      console.log(`   Pago: ${c.pagado ? 'SÍ' : 'NO'}`);
      console.log(`   MP Payment ID: ${c.mpPaymentId || 'N/A'}`);
      console.log(`   Empresa: ${c.empresaId}`);
      console.log(`   Fecha: ${c.createdAt}`);
      console.log('');
    });
    
    // Análisis
    console.log('\n' + '═'.repeat(80));
    console.log('ANÁLISIS');
    console.log('═'.repeat(80));
    
    if (sellers.length > 0) {
      console.log('\n✅ HAY SELLERS:');
      sellers.forEach(s => {
        console.log(`   - internalId: "${s.internalId}"`);
        console.log(`   - userId: "${s.userId}"`);
      });
    } else {
      console.log('\n❌ NO HAY SELLERS');
    }
    
    if (payments.length > 0) {
      console.log('\n✅ HAY PAGOS:');
      const uniqueEmpresaIds = [...new Set(payments.map(p => p.empresaId))];
      const uniqueSellerIds = [...new Set(payments.map(p => p.sellerId))];
      console.log(`   - Empresas únicas: ${uniqueEmpresaIds.join(', ')}`);
      console.log(`   - Sellers únicos: ${uniqueSellerIds.join(', ')}`);
    } else {
      console.log('\n❌ NO HAY PAGOS en colección "payments"');
    }
    
    if (carritos.some(c => c.pagado)) {
      console.log('\n✅ HAY CARRITOS PAGADOS:');
      const carritosPagados = carritos.filter(c => c.pagado);
      carritosPagados.forEach(c => {
        console.log(`   - Carrito ${c._id}: MP Payment ${c.mpPaymentId}`);
      });
    } else {
      console.log('\n⚠️ NO HAY CARRITOS PAGADOS (pero puede haber pagos en otra colección)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verEstructura();
