import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarJuventusMP() {
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

    console.log('📋 EMPRESA JUVENTUS:');
    console.log('   Nombre:', empresa.nombre);
    console.log('   ID (ObjectId):', empresa._id.toString());
    console.log('');

    // 2. Buscar seller de Juventus
    console.log('🔍 BUSCANDO SELLER DE JUVENTUS:\n');
    
    // Buscar por internalId como ObjectId
    let seller = await db.collection('mpsellers').findOne({ 
      internalId: empresa._id.toString() 
    });
    
    if (seller) {
      console.log('✅ Seller encontrado (por ObjectId):');
    } else {
      // Buscar por internalId como nombre
      seller = await db.collection('mpsellers').findOne({ 
        internalId: empresa.nombre 
      });
      
      if (seller) {
        console.log('✅ Seller encontrado (por nombre):');
      }
    }

    if (seller) {
      console.log('   InternalId:', seller.internalId);
      console.log('   UserId:', seller.userId);
      console.log('   Email:', seller.email);
      console.log('   Active:', seller.active);
      console.log('   AccessToken:', seller.accessToken ? 'Configurado ✅' : 'NO configurado ❌');
      console.log('');

      // 3. Buscar payment links del seller
      console.log('💳 PAYMENT LINKS DEL SELLER:\n');
      const links = await db.collection('mppaymentlinks').find({ 
        sellerId: seller.userId 
      }).toArray();

      console.log(`   Total: ${links.length} links`);
      if (links.length > 0) {
        links.forEach(link => {
          console.log(`   - ${link.title} ($${link.unitPrice}) - ${link.active ? 'Activo' : 'Inactivo'}`);
        });
      }
      console.log('');

      // 4. Buscar pagos del seller
      console.log('💰 PAGOS DEL SELLER:\n');
      
      // Por sellerId
      let pagos = await db.collection('mppayments').find({ 
        sellerId: seller.userId 
      }).toArray();
      
      console.log(`   Por sellerId: ${pagos.length} pagos`);
      
      // Por empresaId (ObjectId)
      const pagosPorEmpresaId = await db.collection('mppayments').find({ 
        empresaId: empresa._id.toString() 
      }).toArray();
      
      console.log(`   Por empresaId (ObjectId): ${pagosPorEmpresaId.length} pagos`);
      
      // Por empresaId (nombre)
      const pagosPorNombre = await db.collection('mppayments').find({ 
        empresaId: empresa.nombre 
      }).toArray();
      
      console.log(`   Por empresaId (nombre): ${pagosPorNombre.length} pagos`);
      
      if (pagos.length > 0) {
        console.log('\n   Últimos 3 pagos:');
        pagos.slice(0, 3).forEach(pago => {
          console.log(`   - $${pago.amount} - ${pago.status} - ${pago.payerEmail || 'Sin email'}`);
        });
      }
      console.log('');

    } else {
      console.log('❌ NO SE ENCONTRÓ SELLER PARA JUVENTUS');
      console.log('   Esto significa que Juventus no ha conectado su cuenta de Mercado Pago');
      console.log('');
    }

    // 5. Buscar todos los sellers para comparar
    console.log('📊 TODOS LOS SELLERS EN LA BD:\n');
    const todosLosSellers = await db.collection('mpsellers').find({}).toArray();
    
    todosLosSellers.forEach(s => {
      console.log(`   - InternalId: "${s.internalId}" | UserId: ${s.userId} | Email: ${s.email}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarJuventusMP();
