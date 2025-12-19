// 📋 Script para listar todos los sellers
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Seller } from '../src/modules/mercadopago/models/Seller.js';

dotenv.config();

let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está configurada en .env');
  process.exit(1);
}

if (!MONGODB_URI.includes('mongodb.net/') || MONGODB_URI.includes('mongodb.net/?')) {
  MONGODB_URI = MONGODB_URI.replace('mongodb.net/?', 'mongodb.net/neural_chatbot?');
  MONGODB_URI = MONGODB_URI.replace('mongodb.net?', 'mongodb.net/neural_chatbot?');
}

async function listarSellers() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    const sellers = await Seller.find({});
    
    console.log('\n📋 SELLERS ENCONTRADOS:', sellers.length);
    console.log('─────────────────────────────────────');
    
    if (sellers.length === 0) {
      console.log('⚠️  No hay sellers en la base de datos');
    } else {
      sellers.forEach((seller, index) => {
        console.log(`\n${index + 1}. Seller:`);
        console.log('   Internal ID:', seller.internalId);
        console.log('   User ID:', seller.userId);
        console.log('   Email:', seller.email);
        console.log('   Activo:', seller.active);
        console.log('   Access Token:', seller.accessToken ? '✅ Configurado' : '❌ No configurado');
        console.log('   Refresh Token:', seller.refreshToken ? '✅ Configurado' : '❌ No configurado');
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

listarSellers();
