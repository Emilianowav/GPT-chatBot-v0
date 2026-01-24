import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarConexion() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    
    console.log('\n🔍 Verificando conexión a MongoDB...\n');
    console.log(`MONGODB_URI (primeros 50 chars): ${mongoUri.substring(0, 50)}...`);
    console.log(`Longitud total: ${mongoUri.length} caracteres`);
    
    await mongoose.connect(mongoUri);
    console.log('\n✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    
    // Verificar nombre de la BD
    console.log(`\n📊 Base de datos actual: ${db.databaseName}`);
    
    // Listar colecciones
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Colecciones (${collections.length}):`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Contar documentos en payments
    const paymentsCollection = db.collection('payments');
    const paymentsCount = await paymentsCollection.countDocuments();
    console.log(`\n💳 Total de pagos en la colección: ${paymentsCount}`);
    
    // Contar documentos en empresas
    const empresasCollection = db.collection('empresas');
    const empresasCount = await empresasCollection.countDocuments();
    console.log(`🏢 Total de empresas en la colección: ${empresasCount}`);
    
    // Contar documentos en carritos
    const carritosCollection = db.collection('carritos');
    const carritosCount = await carritosCollection.countDocuments();
    console.log(`🛒 Total de carritos en la colección: ${carritosCount}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarConexion();
