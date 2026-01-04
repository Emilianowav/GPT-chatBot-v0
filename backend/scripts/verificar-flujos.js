import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarFlujos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('📋 FLUJOS EN LA BASE DE DATOS:\n');
    
    const flows = await db.collection('flows').find({}).toArray();
    
    if (flows.length === 0) {
      console.log('❌ No hay flujos en la base de datos\n');
    } else {
      flows.forEach((flow, index) => {
        console.log(`${index + 1}. ${flow.nombre}`);
        console.log(`   ID: ${flow.id}`);
        console.log(`   Empresa: ${flow.empresaId}`);
        console.log(`   Activo: ${flow.activo ? '✅' : '❌'}`);
        console.log(`   _id: ${flow._id}\n`);
      });
    }
    
    console.log(`\n📊 Total de flujos: ${flows.length}\n`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarFlujos();
