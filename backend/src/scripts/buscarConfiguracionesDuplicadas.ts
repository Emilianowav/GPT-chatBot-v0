// Script para buscar TODAS las configuraciones sin filtros
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function buscarDuplicadas() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db!.collection('configuraciones_modulo');

    // Buscar TODAS las configuraciones (sin filtro)
    const todas = await collection.find({}).toArray();
    
    console.log(`📋 Total de documentos en configuraciones_modulo: ${todas.length}\n`);

    for (const config of todas) {
      console.log(`🏢 Empresa: ${config.empresaId}`);
      console.log(`   _id: ${config._id}`);
      console.log(`   activo: ${config.activo}`);
      console.log(`   notificaciones: ${config.notificaciones?.length || 0}`);
      
      if (config.notificaciones && config.notificaciones.length > 0) {
        config.notificaciones.forEach((notif: any, index: number) => {
          console.log(`\n   📧 Notificación ${index + 1}:`);
          console.log(`      tipo: ${notif.tipo}`);
          console.log(`      momento: ${notif.momento}`);
          console.log(`      activa: ${notif.activa}`);
          console.log(`      diasAntes: ${notif.diasAntes}`);
          console.log(`      horasAntesTurno: ${notif.horasAntesTurno}`);
          console.log(`      horaEnvioDiaAntes: ${notif.horaEnvioDiaAntes}`);
        });
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Buscar específicamente por empresaId
    console.log('\n🔍 Buscando por empresaId = "San Jose"...\n');
    const sanJose = await collection.find({ empresaId: 'San Jose' }).toArray();
    console.log(`Encontrados: ${sanJose.length}`);
    
    sanJose.forEach((config, i) => {
      console.log(`\n${i + 1}. _id: ${config._id}`);
      console.log(`   activo: ${config.activo}`);
      console.log(`   notificaciones: ${config.notificaciones?.length || 0}`);
    });

    // Buscar con activo = true
    console.log('\n\n🔍 Buscando con activo = true...\n');
    const activas = await collection.find({ activo: true }).toArray();
    console.log(`Encontradas: ${activas.length}`);
    
    activas.forEach((config, i) => {
      console.log(`\n${i + 1}. empresaId: ${config.empresaId}`);
      console.log(`   _id: ${config._id}`);
      console.log(`   notificaciones: ${config.notificaciones?.length || 0}`);
      
      if (config.notificaciones && config.notificaciones.length > 0) {
        config.notificaciones.forEach((notif: any, index: number) => {
          console.log(`   - Notif ${index + 1}: diasAntes=${notif.diasAntes}, horasAntes=${notif.horasAntesTurno}`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

buscarDuplicadas();
