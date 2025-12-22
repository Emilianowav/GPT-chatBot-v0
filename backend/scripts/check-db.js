/**
 * Script para verificar la conexión y listar bases de datos y colecciones
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
    console.log('🔍 Verificando conexión a MongoDB');
    console.log('URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    console.log('');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const adminDb = mongoose.connection.db.admin();
    
    // Listar todas las bases de datos
    const { databases } = await adminDb.listDatabases();
    
    console.log('📊 Bases de datos disponibles:');
    console.log('=====================================');
    databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('');

    // Mostrar base de datos actual
    const currentDb = mongoose.connection.db.databaseName;
    console.log(`📍 Base de datos actual: ${currentDb}`);
    console.log('');

    // Listar colecciones en la base de datos actual
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length > 0) {
      console.log(`📋 Colecciones en '${currentDb}':');
      console.log('=====================================');
      
      for (const col of collections) {
        const collection = mongoose.connection.db.collection(col.name);
        const count = await collection.countDocuments();
        console.log(`   - ${col.name} (${count} documentos)`);
      }
    } else {
      console.log(`⚠️  La base de datos '${currentDb}' no tiene colecciones`);
      console.log('');
      console.log('💡 Sugerencia: Verifica que estés conectándote a la base de datos correcta.');
      console.log('   Puedes especificar la base de datos en la URI:');
      console.log('   mongodb+srv://user:pass@cluster.mongodb.net/NOMBRE_BASE_DATOS');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

main();
