/**
 * Script para actualizar la API Key de Club Juventus
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const API_KEY = 'mc_16eeb4a3570d760196ca32d1bfa4821a9fd8816c18f5a2f54dbd3a7d09995e77';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Actualizar la API Key
  const result = await db.collection('api_configurations').updateOne(
    { nombre: 'Mis Canchas API' },
    { 
      $set: { 
        'autenticacion.configuracion.token': API_KEY,
        updatedAt: new Date()
      } 
    }
  );
  
  console.log('API Key actualizada:', result.modifiedCount > 0 ? '✅' : '⚠️ Sin cambios');
  
  // Verificar
  const config = await db.collection('api_configurations').findOne({ nombre: 'Mis Canchas API' });
  console.log('Token configurado:', config?.autenticacion?.configuracion?.token ? '✅ Sí' : '❌ No');
  
  await mongoose.disconnect();
}

main();
