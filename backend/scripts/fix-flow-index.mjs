// Script para eliminar el índice único problemático empresaId_1_id_1
// y crear uno parcial que solo aplique cuando id no es null

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixFlowIndex() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Listar índices actuales
    console.log('\n📋 Índices actuales:');
    const indexes = await flowsCollection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${index.name}:`, index.key);
    });
    
    // Eliminar el índice problemático
    console.log('\n🗑️  Eliminando índice único empresaId_1_id_1...');
    try {
      await flowsCollection.dropIndex('empresaId_1_id_1');
      console.log('✅ Índice eliminado exitosamente');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('⚠️  Índice no encontrado (ya fue eliminado)');
      } else {
        throw error;
      }
    }
    
    // Crear índice parcial que solo aplique cuando id no es null
    console.log('\n📝 Creando índice parcial (solo cuando id != null)...');
    await flowsCollection.createIndex(
      { empresaId: 1, id: 1 },
      { 
        unique: true,
        partialFilterExpression: { id: { $type: 'string' } },
        name: 'empresaId_1_id_1_partial'
      }
    );
    console.log('✅ Índice parcial creado exitosamente');
    
    // Listar índices finales
    console.log('\n📋 Índices finales:');
    const finalIndexes = await flowsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`   - ${index.name}:`, index.key);
      if (index.partialFilterExpression) {
        console.log('     Filtro parcial:', index.partialFilterExpression);
      }
    });
    
    console.log('\n✅ Fix completado exitosamente');
    console.log('💡 Ahora puedes tener múltiples flujos con id=null para la misma empresa');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

fixFlowIndex();
