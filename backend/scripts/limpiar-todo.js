import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function limpiarTodo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log('📋 COLECCIONES EN LA BASE DE DATOS:\n');
    collections.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name}`);
    });
    console.log('\n');
    
    // Eliminar TODOS los flujos
    console.log('🗑️  ELIMINANDO FLUJOS...\n');
    const flowsResult = await db.collection('flows').deleteMany({});
    console.log(`✅ Eliminados ${flowsResult.deletedCount} flujos\n`);
    
    // Eliminar TODOS los nodos
    console.log('🗑️  ELIMINANDO NODOS...\n');
    const nodesResult = await db.collection('flownodes').deleteMany({});
    console.log(`✅ Eliminados ${nodesResult.deletedCount} nodos\n`);
    
    // Mostrar conteo de documentos en cada colección
    console.log('📊 CONTEO DE DOCUMENTOS POR COLECCIÓN:\n');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`${col.name}: ${count} documentos`);
    }
    console.log('\n');
    
    // Mostrar estructura de algunas colecciones importantes
    console.log('🔍 ESTRUCTURA DE COLECCIONES IMPORTANTES:\n');
    
    const colsToInspect = ['contactos', 'empresas', 'conversaciones', 'workflow_states', 'conversation_states'];
    
    for (const colName of colsToInspect) {
      const sample = await db.collection(colName).findOne({});
      if (sample) {
        console.log(`\n📦 ${colName.toUpperCase()}:`);
        console.log(JSON.stringify(sample, null, 2).substring(0, 500) + '...\n');
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Proceso completado');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

limpiarTodo();
