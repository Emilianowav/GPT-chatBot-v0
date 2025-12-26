import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarPagoJuventus() {
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
    console.log('   ID:', empresaId);
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
    console.log('   InternalId:', seller.internalId);
    console.log('');

    // 3. Buscar TODOS los pagos del seller (sin filtrar por empresaId)
    console.log('🔍 TODOS LOS PAGOS DEL SELLER:\n');
    const todosPagos = await db.collection('mppayments').find({ 
      sellerId: sellerId 
    }).sort({ createdAt: -1 }).limit(5).toArray();

    console.log(`   Total de pagos del seller: ${todosPagos.length}\n`);

    todosPagos.forEach((pago, index) => {
      console.log(`   Pago ${index + 1}:`);
      console.log(`      ID: ${pago._id}`);
      console.log(`      MP Payment ID: ${pago.mpPaymentId}`);
      console.log(`      Status: ${pago.status}`);
      console.log(`      Amount: $${pago.amount}`);
      console.log(`      EmpresaId: ${pago.empresaId || '❌ NO TIENE'}`);
      console.log(`      SellerId: ${pago.sellerId}`);
      console.log(`      Created: ${pago.createdAt}`);
      console.log('');
    });

    // 4. Buscar pagos CON empresaId de Juventus (filtrado dual)
    console.log('🔍 PAGOS CON FILTRADO DUAL (sellerId Y empresaId):\n');
    const pagosFiltrados = await db.collection('mppayments').find({ 
      sellerId: sellerId,
      empresaId: empresaId
    }).toArray();

    console.log(`   Pagos con filtrado dual: ${pagosFiltrados.length}`);
    
    if (pagosFiltrados.length === 0) {
      console.log('   ⚠️  NO HAY PAGOS con empresaId de Juventus');
      console.log('   Esto explica por qué el historial está vacío en el CRM\n');
    } else {
      pagosFiltrados.forEach((pago, index) => {
        console.log(`   Pago ${index + 1}:`);
        console.log(`      Amount: $${pago.amount}`);
        console.log(`      Status: ${pago.status}`);
        console.log(`      EmpresaId: ${pago.empresaId}`);
        console.log('');
      });
    }

    // 5. Buscar el último payment link creado
    console.log('🔗 ÚLTIMO PAYMENT LINK CREADO:\n');
    const ultimoLink = await db.collection('mppaymentlinks').findOne(
      { sellerId: sellerId },
      { sort: { createdAt: -1 } }
    );

    if (ultimoLink) {
      console.log(`   Link ID: ${ultimoLink._id}`);
      console.log(`   Title: ${ultimoLink.title}`);
      console.log(`   EmpresaId: ${ultimoLink.empresaId || '❌ NO TIENE'}`);
      console.log(`   SellerId: ${ultimoLink.sellerId}`);
      console.log(`   Created: ${ultimoLink.createdAt}`);
      console.log('');

      // Buscar pagos asociados a este link
      const pagosDelLink = await db.collection('mppayments').find({
        paymentLinkId: ultimoLink._id.toString()
      }).toArray();

      console.log(`   Pagos asociados a este link: ${pagosDelLink.length}`);
      if (pagosDelLink.length > 0) {
        pagosDelLink.forEach((pago, index) => {
          console.log(`      Pago ${index + 1}: $${pago.amount} - empresaId: ${pago.empresaId || '❌ NO TIENE'}`);
        });
      }
    } else {
      console.log('   ❌ No hay payment links');
    }

    console.log('');
    console.log('📊 DIAGNÓSTICO:');
    console.log(`   - Pagos totales del seller: ${todosPagos.length}`);
    console.log(`   - Pagos con empresaId correcto: ${pagosFiltrados.length}`);
    console.log(`   - Payment links con empresaId: ${ultimoLink?.empresaId ? 'SÍ' : 'NO'}`);

    if (todosPagos.length > 0 && pagosFiltrados.length === 0) {
      console.log('\n⚠️  PROBLEMA DETECTADO:');
      console.log('   Los pagos existen pero NO tienen empresaId de Juventus');
      console.log('   El webhook no está guardando el empresaId correctamente');
    }

    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarPagoJuventus();
