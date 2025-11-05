// Script para ver todas las colecciones en MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verColecciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db!.listCollections().toArray();

    console.log(`📋 Total colecciones: ${collections.length}\n`);

    for (const collection of collections) {
      console.log(`📦 ${collection.name}`);
      
      // Contar documentos
      const count = await db!.collection(collection.name).countDocuments();
      console.log(`   Documentos: ${count}`);
      
      // Si tiene documentos, mostrar un ejemplo
      if (count > 0 && count < 100) {
        const sample = await db!.collection(collection.name).findOne();
        console.log(`   Ejemplo de campos: ${Object.keys(sample || {}).join(', ')}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

verColecciones();
