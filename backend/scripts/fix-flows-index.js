// Script para eliminar índice problemático de flows
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function main() {
  try {
    console.log('🔧 Eliminando índice problemático de flows...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Listar índices actuales
    const indexes = await flowsCollection.indexes();
    console.log('📋 Índices actuales:', indexes.map(i => i.name));
    
    // Eliminar índice problemático si existe
    try {
      await flowsCollection.dropIndex('empresaId_1_id_1');
      console.log('✅ Índice empresaId_1_id_1 eliminado');
    } catch (error) {
      console.log('ℹ️ Índice empresaId_1_id_1 no existe o ya fue eliminado');
    }
    
    // Listar índices finales
    const finalIndexes = await flowsCollection.indexes();
    console.log('📋 Índices finales:', finalIndexes.map(i => i.name));
    
    console.log('✅ Índices corregidos');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

main();
