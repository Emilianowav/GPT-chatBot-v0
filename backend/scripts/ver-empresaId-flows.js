// Script para ver qué empresaId tienen los flows en la BD
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function verEmpresaIdFlows() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flows = await flowsCollection.find({}).toArray();

    console.log(`📊 Total de flows en la BD: ${flows.length}\n`);

    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre}`);
      console.log(`   _id: ${flow._id}`);
      console.log(`   empresaId: "${flow.empresaId}" (tipo: ${typeof flow.empresaId})`);
      console.log(`   activo: ${flow.activo}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verEmpresaIdFlows();
