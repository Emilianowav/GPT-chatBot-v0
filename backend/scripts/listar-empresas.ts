// 📋 Script para listar todas las empresas
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EmpresaModel } from '../src/models/Empresa.js';

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

async function listarEmpresas() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    const empresas = await EmpresaModel.find({});
    
    console.log('\n📋 EMPRESAS ENCONTRADAS:', empresas.length);
    console.log('─────────────────────────────────────');
    
    empresas.forEach((empresa, index) => {
      console.log(`\n${index + 1}. ${empresa.nombre}`);
      console.log('   ID:', empresa._id);
      console.log('   Teléfono:', empresa.telefono);
      console.log('   Email:', empresa.email);
      console.log('   PhoneNumberId:', empresa.phoneNumberId || 'No configurado');
      console.log('   Módulos:', empresa.modulos?.length || 0);
      
      const moduloMP = empresa.modulos?.find((m: any) => m.id === 'mercadopago');
      if (moduloMP) {
        console.log('   ✅ Mercado Pago: Activo');
      }
    });

    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

listarEmpresas();
