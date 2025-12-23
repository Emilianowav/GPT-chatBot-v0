import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Corregir teléfono de Mis Canchas (quitar el +)
  const resultado = await db.collection('empresas').updateOne(
    { nombre: { $regex: /mis\s*canchas/i } },
    { $set: { telefono: '5493794057395', updatedAt: new Date() } }
  );
  
  console.log('Mis Canchas actualizado:', resultado.modifiedCount > 0 ? '✅' : 'Sin cambios');
  
  // También corregir Club Juventus por si acaso
  const resultado2 = await db.collection('empresas').updateOne(
    { nombre: { $regex: /juventus/i } },
    { $set: { telefono: '5493794056955', updatedAt: new Date() } }
  );
  
  console.log('Club Juventus actualizado:', resultado2.modifiedCount > 0 ? '✅' : 'Sin cambios');
  
  await mongoose.disconnect();
}

main();
