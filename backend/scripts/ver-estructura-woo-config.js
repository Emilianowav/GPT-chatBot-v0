import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verEstructuraWooConfig() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const apiConfigsCollection = db.collection('apiconfigurations');
    
    const wooConfig = await apiConfigsCollection.findOne({ 
      nombre: /WooCommerce/i 
    });
    
    if (!wooConfig) {
      console.log('❌ No se encontró configuración de WooCommerce');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📋 ESTRUCTURA COMPLETA DE LA CONFIGURACIÓN:\n');
    console.log(JSON.stringify(wooConfig, null, 2));
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

verEstructuraWooConfig();
