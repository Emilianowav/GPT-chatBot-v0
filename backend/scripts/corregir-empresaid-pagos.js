import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function corregirEmpresaIdPagos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Buscar empresa Juventus
    const empresa = await db.collection('empresas').findOne({ nombre: /juventus/i });
    
    if (!empresa) {
      console.log('❌ Empresa Juventus no encontrada');
      process.exit(1);
    }

    const empresaId = empresa._id.toString();
    const empresaNombre = empresa.nombre;

    console.log('📋 EMPRESA JUVENTUS:');
    console.log('   ID (ObjectId):', empresaId);
    console.log('   Nombre:', empresaNombre);
    console.log('');

    // 2. Buscar seller de Juventus
    const seller = await db.collection('mpsellers').findOne({ 
      internalId: empresaNombre 
    });

    if (!seller) {
      console.log('❌ Seller de Juventus no encontrado');
      process.exit(1);
    }

    const sellerId = seller.userId;
    console.log('💼 SELLER DE JUVENTUS:');
    console.log('   UserId:', sellerId);
    console.log('');

    // 3. Buscar pagos con empresaId incorrecto (nombre en lugar de ObjectId)
    const pagosIncorrectos = await db.collection('mppayments').find({ 
      sellerId: sellerId,
      empresaId: empresaNombre  // Buscar por nombre
    }).toArray();

    console.log(`🔍 Pagos con empresaId incorrecto (nombre): ${pagosIncorrectos.length}\n`);

    if (pagosIncorrectos.length > 0) {
      console.log('🔧 Corrigiendo empresaId de nombre a ObjectId...\n');
      
      for (const pago of pagosIncorrectos) {
        console.log(`   Pago ID: ${pago._id}`);
        console.log(`      Antes: empresaId = "${pago.empresaId}"`);
        
        const result = await db.collection('mppayments').updateOne(
          { _id: pago._id },
          { $set: { empresaId: empresaId } }
        );
        
        console.log(`      Después: empresaId = "${empresaId}"`);
        console.log(`      ✅ Actualizado\n`);
      }
      
      console.log(`✅ ${pagosIncorrectos.length} pagos corregidos\n`);
    } else {
      console.log('   ℹ️  No hay pagos con empresaId incorrecto\n');
    }

    // 4. Verificar resultado
    const pagosCorrectos = await db.collection('mppayments').find({ 
      sellerId: sellerId,
      empresaId: empresaId  // Buscar por ObjectId
    }).toArray();

    console.log('📊 RESULTADO FINAL:');
    console.log(`   Pagos con empresaId correcto (ObjectId): ${pagosCorrectos.length}`);
    
    if (pagosCorrectos.length > 0) {
      console.log('   ✅ Ahora el historial debería aparecer en el CRM');
    }

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirEmpresaIdPagos();
