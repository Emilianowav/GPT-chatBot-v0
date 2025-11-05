// 📋 Ver configuración completa
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function verConfig() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    
    const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
    
    if (!config) {
      console.log('❌ No se encontró configuración');
      process.exit(1);
    }

    console.log('\n📊 CONFIGURACIÓN COMPLETA:');
    console.log(JSON.stringify(config, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verConfig();
