/**
 * Script para listar colecciones en la base de datos
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
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📋 Colecciones en la base de datos:');
    console.log('=====================================');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log(`\nTotal: ${collections.length} colecciones`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
