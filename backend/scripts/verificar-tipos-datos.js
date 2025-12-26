import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarTiposDatos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Buscar empresa Juventus
    const empresa = await db.collection('empresas').findOne({ nombre: /juventus/i });
    const empresaId = empresa._id.toString();

    // 2. Buscar seller
    const seller = await db.collection('mpsellers').findOne({ 
      internalId: empresa.nombre 
    });

    console.log('💼 SELLER:');
    console.log('   userId:', seller.userId);
    console.log('   Tipo de userId:', typeof seller.userId);
    console.log('');

    // 3. Buscar pagos y verificar tipo de sellerId
    const pagos = await db.collection('mppayments').find({ 
      empresaId: empresaId
    }).toArray();

    console.log('💰 PAGOS:');
    pagos.forEach((pago, index) => {
      console.log(`   Pago ${index + 1}:`);
      console.log(`      sellerId: ${pago.sellerId}`);
      console.log(`      Tipo de sellerId: ${typeof pago.sellerId}`);
      console.log(`      empresaId: ${pago.empresaId}`);
      console.log(`      Tipo de empresaId: ${typeof pago.empresaId}`);
      console.log('');
    });

    // 4. Probar query con sellerId como string
    console.log('🔍 PRUEBA DE QUERY:\n');
    
    const queryNumero = { 
      sellerId: seller.userId,  // número
      empresaId: empresaId 
    };
    const resultNumero = await db.collection('mppayments').countDocuments(queryNumero);
    console.log(`   Query con sellerId como número (${seller.userId}): ${resultNumero} pagos`);

    const queryString = { 
      sellerId: seller.userId.toString(),  // string
      empresaId: empresaId 
    };
    const resultString = await db.collection('mppayments').countDocuments(queryString);
    console.log(`   Query con sellerId como string ("${seller.userId}"): ${resultString} pagos`);

    console.log('');
    console.log('📊 DIAGNÓSTICO:');
    if (resultNumero === 0 && resultString > 0) {
      console.log('   ⚠️  PROBLEMA: sellerId está guardado como STRING en pagos');
      console.log('   ⚠️  Pero el seller.userId es NUMBER');
      console.log('   ⚠️  La query debe convertir a string para que coincida');
    } else if (resultNumero > 0 && resultString === 0) {
      console.log('   ⚠️  PROBLEMA: sellerId está guardado como NUMBER en pagos');
      console.log('   ⚠️  Pero se está buscando como STRING');
    } else if (resultNumero > 0 && resultString > 0) {
      console.log('   ✅ Ambas queries funcionan (tipos mixtos en BD)');
    }

    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarTiposDatos();
