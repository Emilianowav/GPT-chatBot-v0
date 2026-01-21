// Script para obtener las credenciales de WhatsApp de Intercapital
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function obtenerCredenciales() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const empresasCollection = db.collection('empresas');

    // Buscar Intercapital
    const intercapital = await empresasCollection.findOne({ nombre: 'Intercapital' });

    if (!intercapital) {
      console.log('❌ No se encontró la empresa Intercapital');
      await mongoose.connection.close();
      return;
    }

    console.log('📊 CREDENCIALES DE INTERCAPITAL\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🏢 Empresa:', intercapital.nombre);
    console.log('📧 Email:', intercapital.email);
    console.log('📱 Teléfono:', intercapital.telefono || 'No configurado');
    console.log('');
    
    if (intercapital.metaConfig) {
      console.log('📱 CONFIGURACIÓN DE WHATSAPP (META):');
      console.log('─────────────────────────────────────────────────────────');
      console.log('📱 Phone Number ID:', intercapital.metaConfig.phoneNumberId || 'No configurado');
      console.log('🔑 Access Token:', intercapital.metaConfig.accessToken ? `${intercapital.metaConfig.accessToken.substring(0, 20)}...` : 'No configurado');
      console.log('🏢 WABA ID:', intercapital.metaConfig.businessAccountId || 'No configurado');
      console.log('📲 App ID:', intercapital.metaConfig.appId || 'No configurado');
      console.log('🔐 App Secret:', intercapital.metaConfig.appSecret ? `${intercapital.metaConfig.appSecret.substring(0, 10)}...` : 'No configurado');
      console.log('');
      
      console.log('📋 DATOS COMPLETOS PARA COPIAR:');
      console.log('─────────────────────────────────────────────────────────');
      console.log('Webhook Name: Intercapital WhatsApp Webhook');
      console.log('Teléfono:', intercapital.telefono || 'No configurado');
      console.log('Phone Number ID:', intercapital.metaConfig.phoneNumberId || 'No configurado');
      console.log('Access Token:', intercapital.metaConfig.accessToken || 'No configurado');
      console.log('WABA ID:', intercapital.metaConfig.businessAccountId || 'No configurado');
      console.log('App ID:', intercapital.metaConfig.appId || 'No configurado');
      console.log('App Secret:', intercapital.metaConfig.appSecret || 'No configurado');
    } else {
      console.log('⚠️ No hay configuración de WhatsApp (metaConfig) para Intercapital');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

obtenerCredenciales();
