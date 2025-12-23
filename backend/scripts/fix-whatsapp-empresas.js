/**
 * Script para corregir los datos de WhatsApp de Mis Canchas y Juventus
 * 
 * Uso: node scripts/fix-whatsapp-empresas.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: No se encontró MONGODB_URI en las variables de entorno');
  process.exit(1);
}

async function main() {
  console.log('🔧 Script para corregir datos de WhatsApp');
  console.log('==========================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const empresasCollection = db.collection('empresas');

    // Primero, listar todas las empresas para ver los nombres exactos
    console.log('📋 Empresas actuales en la base de datos:');
    console.log('-'.repeat(50));
    
    const todasEmpresas = await empresasCollection.find({}, { 
      projection: { nombre: 1, telefono: 1, phoneNumberId: 1, businessAccountId: 1 } 
    }).toArray();
    
    todasEmpresas.forEach(emp => {
      console.log(`  - ${emp.nombre}`);
      console.log(`    Teléfono: ${emp.telefono || 'N/A'}`);
      console.log(`    Phone Number ID: ${emp.phoneNumberId || 'N/A'}`);
      console.log(`    WABA ID: ${emp.businessAccountId || 'N/A'}`);
      console.log('');
    });

    // Datos correctos para cada empresa
    const actualizaciones = [
      {
        // Buscar por nombre que contenga "Mis Canchas" (case insensitive)
        filtro: { nombre: { $regex: /mis\s*canchas/i } },
        datos: {
          telefono: '+543794057395',
          phoneNumberId: '966219919902670',
          businessAccountId: '772636765924023'
        },
        nombreEsperado: 'Mis Canchas'
      },
      {
        // Buscar por nombre que contenga "Juventus" (case insensitive)
        filtro: { nombre: { $regex: /juventus/i } },
        datos: {
          telefono: '+5493794056955',
          phoneNumberId: '883582234843734',
          businessAccountId: '772636765924023'
        },
        nombreEsperado: 'Juventus'
      }
    ];

    console.log('\n🔄 Aplicando actualizaciones:');
    console.log('-'.repeat(50));

    for (const act of actualizaciones) {
      const empresa = await empresasCollection.findOne(act.filtro);
      
      if (!empresa) {
        console.log(`\n⚠️  No se encontró empresa con nombre similar a "${act.nombreEsperado}"`);
        continue;
      }

      console.log(`\n📝 Actualizando: ${empresa.nombre}`);
      console.log(`   Antes:`);
      console.log(`     Teléfono: ${empresa.telefono || 'N/A'}`);
      console.log(`     Phone Number ID: ${empresa.phoneNumberId || 'N/A'}`);
      console.log(`     WABA ID: ${empresa.businessAccountId || 'N/A'}`);

      const resultado = await empresasCollection.updateOne(
        { _id: empresa._id },
        { 
          $set: {
            telefono: act.datos.telefono,
            phoneNumberId: act.datos.phoneNumberId,
            businessAccountId: act.datos.businessAccountId,
            updatedAt: new Date()
          }
        }
      );

      if (resultado.modifiedCount > 0) {
        console.log(`   Después:`);
        console.log(`     Teléfono: ${act.datos.telefono}`);
        console.log(`     Phone Number ID: ${act.datos.phoneNumberId}`);
        console.log(`     WABA ID: ${act.datos.businessAccountId}`);
        console.log(`   ✅ Actualizado correctamente`);
      } else {
        console.log(`   ⚠️  No se realizaron cambios (ya tenía los datos correctos)`);
      }
    }

    console.log('\n==========================================');
    console.log('🎉 Proceso completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

main();
