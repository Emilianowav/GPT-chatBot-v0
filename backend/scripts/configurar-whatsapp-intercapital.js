import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function configurarWhatsApp() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar empresa Intercapital
    const empresa = await db.collection('empresas').findOne({
      nombre: 'Intercapital'
    });

    if (!empresa) {
      console.log('❌ Empresa Intercapital no encontrada');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Empresa encontrada:', empresa.nombre);

    // Actualizar con datos de WhatsApp
    const result = await db.collection('empresas').updateOne(
      { _id: empresa._id },
      {
        $set: {
          telefono: '+5493794044057',
          phoneNumberId: '976398932217836',
          businessAccountId: '772636765924023',
          comitente: '624850',
          updatedAt: new Date()
        }
      }
    );

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ WHATSAPP CONFIGURADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📱 Datos configurados:');
    console.log(`   - Teléfono: +54 379 4044057`);
    console.log(`   - Comitente: 624850`);
    console.log(`   - Phone Number ID: 976398932217836`);
    console.log(`   - Business Account ID: 772636765924023`);
    console.log(`\n✅ Modificados: ${result.modifiedCount} documento(s)`);

    // Verificar
    const empresaActualizada = await db.collection('empresas').findOne({
      _id: empresa._id
    });

    console.log('\n📋 Empresa actualizada:');
    console.log(`   - Nombre: ${empresaActualizada.nombre}`);
    console.log(`   - Teléfono: ${empresaActualizada.telefono}`);
    console.log(`   - Phone Number ID: ${empresaActualizada.phoneNumberId}`);
    console.log(`   - Business Account ID: ${empresaActualizada.businessAccountId}`);
    console.log(`   - Comitente: ${empresaActualizada.comitente}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

configurarWhatsApp();
