import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarEmpresa() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    // Buscar empresa Veo Veo
    const empresasCollection = db.collection('empresas');
    const veoVeo = await empresasCollection.findOne({ nombre: 'Veo Veo' });
    
    if (!veoVeo) {
      console.log('❌ No se encontró empresa "Veo Veo"');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('EMPRESA VEO VEO');
    console.log('═'.repeat(80));
    console.log(JSON.stringify(veoVeo, null, 2));
    
    const empresaId = veoVeo._id.toString();
    console.log(`\n📋 ID de empresa: ${empresaId}`);
    
    // Buscar seller asociado
    const sellersCollection = db.collection('sellers');
    const seller = await sellersCollection.findOne({ internalId: 'Veo Veo' });
    
    console.log('\n' + '═'.repeat(80));
    console.log('SELLER DE VEO VEO');
    console.log('═'.repeat(80));
    if (seller) {
      console.log(JSON.stringify(seller, null, 2));
    } else {
      console.log('❌ No hay seller para Veo Veo');
      console.log('\n💡 Necesitas conectar MercadoPago para esta empresa');
    }
    
    // Buscar pagos
    const paymentsCollection = db.collection('payments');
    const payments = await paymentsCollection.find({ empresaId }).toArray();
    
    console.log('\n' + '═'.repeat(80));
    console.log(`PAGOS DE VEO VEO (${payments.length})`);
    console.log('═'.repeat(80));
    if (payments.length > 0) {
      payments.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.mpPaymentId} - ${p.status} - $${p.amount}`);
      });
    } else {
      console.log('No hay pagos registrados para esta empresa');
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('SOLUCIÓN');
    console.log('═'.repeat(80));
    console.log('\nEn el frontend, debes configurar:');
    console.log(`localStorage.setItem('empresa_id', '${empresaId}');`);
    console.log('\nO cambiar el código para que use el nombre de la empresa:');
    console.log(`localStorage.setItem('empresa_id', 'Veo Veo');`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarEmpresa();
