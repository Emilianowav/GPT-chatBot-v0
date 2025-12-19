// 📱 Script para configurar WhatsApp en JFC Techno
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

async function configurarWhatsApp() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    console.log('\n========================================');
    console.log('📱 CONFIGURANDO WHATSAPP - JFC TECHNO');
    console.log('========================================\n');

    // Buscar JFC Techno
    const jfcTechno = await EmpresaModel.findOne({ nombre: 'JFC Techno' });
    
    if (!jfcTechno) {
      console.log('❌ Empresa JFC Techno no encontrada');
      return;
    }

    console.log('✅ Empresa encontrada:', jfcTechno.nombre);

    // Buscar una empresa con WhatsApp configurado para copiar credenciales
    const empresaConWA = await EmpresaModel.findOne({ 
      phoneNumberId: { $exists: true, $ne: '' },
      accessToken: { $exists: true, $ne: '' }
    });

    if (!empresaConWA) {
      console.log('⚠️  No se encontró ninguna empresa con WhatsApp configurado');
      console.log('   Usando credenciales de variables de entorno...');
      
      const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
      const accessToken = process.env.META_WHATSAPP_TOKEN;
      
      if (!phoneNumberId || !accessToken) {
        console.log('❌ ERROR: META_PHONE_NUMBER_ID o META_WHATSAPP_TOKEN no configurados en .env');
        return;
      }

      jfcTechno.phoneNumberId = phoneNumberId;
      jfcTechno.accessToken = accessToken;
      
      console.log('\n✅ Configurando con credenciales de .env:');
      console.log('   PhoneNumberId:', phoneNumberId);
      console.log('   Access Token: ✅ Configurado');
    } else {
      console.log('\n✅ Copiando credenciales de:', empresaConWA.nombre);
      console.log('   PhoneNumberId:', empresaConWA.phoneNumberId);
      
      jfcTechno.phoneNumberId = empresaConWA.phoneNumberId;
      jfcTechno.accessToken = empresaConWA.accessToken;
      
      // Copiar también otros campos de WhatsApp si existen
      if (empresaConWA.businessAccountId) {
        jfcTechno.businessAccountId = empresaConWA.businessAccountId;
      }
      if (empresaConWA.appId) {
        jfcTechno.appId = empresaConWA.appId;
      }
      if (empresaConWA.appSecret) {
        jfcTechno.appSecret = empresaConWA.appSecret;
      }
    }

    await jfcTechno.save();

    console.log('\n✅ WhatsApp configurado exitosamente');
    console.log('📋 Configuración final:');
    console.log('   PhoneNumberId:', jfcTechno.phoneNumberId);
    console.log('   Access Token: ✅ Configurado');
    if (jfcTechno.businessAccountId) {
      console.log('   Business Account ID:', jfcTechno.businessAccountId);
    }

    console.log('\n========================================');
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

configurarWhatsApp();
