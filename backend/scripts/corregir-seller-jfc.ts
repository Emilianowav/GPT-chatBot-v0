// 🔧 Script para corregir el internalId del seller de JFC Techno
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

async function corregirSeller() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    console.log('\n🔧 Corrigiendo internalId del seller...');
    
    const seller = await Seller.findOne({ internalId: 'JFS Techno' });
    
    if (!seller) {
      console.log('⚠️  Seller con internalId "JFS Techno" no encontrado');
      console.log('   Verificando si ya está corregido...');
      
      const sellerCorrecto = await Seller.findOne({ internalId: 'JFC Techno' });
      if (sellerCorrecto) {
        console.log('✅ El seller ya tiene el internalId correcto: "JFC Techno"');
      } else {
        console.log('❌ No se encontró ningún seller');
      }
    } else {
      console.log('✅ Seller encontrado con internalId incorrecto');
      console.log('   Cambiando "JFS Techno" → "JFC Techno"');
      
      seller.internalId = 'JFC Techno';
      await seller.save();
      
      console.log('✅ Seller corregido exitosamente');
    }

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

corregirSeller();
