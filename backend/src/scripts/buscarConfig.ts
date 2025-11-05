// 📋 Buscar configuración
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function buscar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    
    const db = mongoose.connection.db;
    const collection = db?.collection('configuracion_modulos');

    // Buscar por empresaId
    const doc1 = await collection?.findOne({ empresaId: 'San Jose' });
    console.log('Búsqueda por empresaId:', doc1 ? '✅ Encontrado' : '❌ No encontrado');
    
    if (doc1) {
      console.log('_id:', doc1._id);
      console.log('empresaId:', doc1.empresaId);
      console.log('¿Tiene notificacionDiariaAgentes?', !!doc1.notificacionDiariaAgentes);
    }

    // Listar todos
    const all = await collection?.find({}).project({ empresaId: 1, _id: 1 }).toArray();
    console.log('\nTodas las empresas:');
    all?.forEach(d => console.log(`  - ${d.empresaId} (${d._id})`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

buscar();
