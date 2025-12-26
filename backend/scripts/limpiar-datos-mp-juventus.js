import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function limpiarDatosMPJuventus() {
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
    console.log('   Nombre:', empresaNombre);
    console.log('   ID:', empresaId);
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
    console.log('   InternalId:', seller.internalId);
    console.log('');

    // 3. ANÁLISIS DE PAYMENT LINKS
    console.log('🔍 ANÁLISIS DE PAYMENT LINKS:\n');
    
    // Links del seller SIN empresaId (datos huérfanos de pruebas)
    const linksHuerfanos = await db.collection('mppaymentlinks').find({ 
      sellerId: sellerId,
      empresaId: { $exists: false }
    }).toArray();

    console.log(`   Links huérfanos (sin empresaId): ${linksHuerfanos.length}`);
    
    // Links del seller CON empresaId de Juventus (datos legítimos)
    const linksJuventus = await db.collection('mppaymentlinks').find({ 
      sellerId: sellerId,
      empresaId: empresaId
    }).toArray();

    console.log(`   Links de Juventus (con empresaId correcto): ${linksJuventus.length}`);
    
    // Links con empresaId pero no el de Juventus
    const linksOtrasEmpresas = await db.collection('mppaymentlinks').find({ 
      sellerId: sellerId,
      empresaId: { $exists: true, $ne: empresaId }
    }).toArray();

    console.log(`   Links de otras empresas: ${linksOtrasEmpresas.length}`);
    console.log('');

    // 4. ANÁLISIS DE PAGOS
    console.log('🔍 ANÁLISIS DE PAGOS:\n');
    
    // Pagos del seller SIN empresaId (datos huérfanos)
    const pagosHuerfanos = await db.collection('mppayments').find({ 
      sellerId: sellerId,
      empresaId: { $exists: false }
    }).toArray();

    console.log(`   Pagos huérfanos (sin empresaId): ${pagosHuerfanos.length}`);
    
    // Pagos del seller CON empresaId de Juventus
    const pagosJuventus = await db.collection('mppayments').find({ 
      sellerId: sellerId,
      empresaId: empresaId
    }).toArray();

    console.log(`   Pagos de Juventus (con empresaId correcto): ${pagosJuventus.length}`);
    
    // Pagos con empresaId pero no el de Juventus
    const pagosOtrasEmpresas = await db.collection('mppayments').find({ 
      sellerId: sellerId,
      empresaId: { $exists: true, $ne: empresaId }
    }).toArray();

    console.log(`   Pagos de otras empresas: ${pagosOtrasEmpresas.length}`);
    console.log('');

    // 5. LIMPIEZA (opcional - comentado por seguridad)
    console.log('🧹 OPCIONES DE LIMPIEZA:\n');
    console.log('   Para limpiar datos huérfanos, descomenta las siguientes líneas:\n');
    
    if (linksHuerfanos.length > 0) {
      console.log(`   ⚠️  ${linksHuerfanos.length} links huérfanos encontrados`);
      console.log('   Estos links NO tienen empresaId y son de pruebas anteriores');
      console.log('   🗑️  Eliminando...');
      
      const resultLinks = await db.collection('mppaymentlinks').deleteMany({ 
        sellerId: sellerId,
        empresaId: { $exists: false }
      });
      console.log(`   ✅ ${resultLinks.deletedCount} links huérfanos eliminados\n`);
    }

    if (pagosHuerfanos.length > 0) {
      console.log(`   ⚠️  ${pagosHuerfanos.length} pagos huérfanos encontrados`);
      console.log('   Estos pagos NO tienen empresaId y son de pruebas anteriores');
      console.log('   🗑️  Eliminando...');
      
      const resultPagos = await db.collection('mppayments').deleteMany({ 
        sellerId: sellerId,
        empresaId: { $exists: false }
      });
      console.log(`   ✅ ${resultPagos.deletedCount} pagos huérfanos eliminados\n`);
    }

    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`   Juventus debería tener: ${linksJuventus.length} links y ${pagosJuventus.length} pagos`);
    console.log(`   Datos huérfanos a limpiar: ${linksHuerfanos.length} links y ${pagosHuerfanos.length} pagos`);

    await mongoose.disconnect();
    console.log('\n✅ Análisis completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

limpiarDatosMPJuventus();
