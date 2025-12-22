/**
 * Script para eliminar el índice único de teléfono
 * Esto permite que múltiples clientes tengan el mismo teléfono
 * (ej: hermanos usando el teléfono del padre)
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
    console.log('🔧 Eliminando índice único de teléfono');
    console.log('========================================\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('contactos_empresa');

    // Listar índices actuales
    const indexes = await collection.indexes();
    console.log('📋 Índices actuales:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
      if (idx.unique) {
        console.log(`     (ÚNICO)`);
      }
    });
    console.log('');

    // Buscar el índice de teléfono único
    const telefonoIndex = indexes.find(idx => 
      idx.key.empresaId === 1 && 
      idx.key.telefono === 1 && 
      idx.unique === true
    );

    if (telefonoIndex) {
      console.log(`🗑️  Eliminando índice único: ${telefonoIndex.name}`);
      await collection.dropIndex(telefonoIndex.name);
      console.log('✅ Índice único eliminado\n');

      // Crear índice no único
      console.log('📝 Creando índice no único para teléfono...');
      await collection.createIndex({ empresaId: 1, telefono: 1 });
      console.log('✅ Índice no único creado\n');
    } else {
      console.log('ℹ️  No se encontró índice único de teléfono\n');
    }

    // Listar índices finales
    const finalIndexes = await collection.indexes();
    console.log('📋 Índices finales:');
    finalIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
      if (idx.unique) {
        console.log(`     (ÚNICO)`);
      }
    });

    console.log('\n========================================');
    console.log('🎉 Proceso completado');
    console.log('Ahora puedes tener múltiples clientes con el mismo teléfono');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

main();
