import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const apiConfigSchema = new mongoose.Schema({}, { strict: false });
const ApiConfiguration = mongoose.model('ApiConfiguration', apiConfigSchema, 'api_configurations');

async function updateApiBaseUrl() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const api = await ApiConfiguration.findOne({ 
      nombre: /Mis Canchas/i 
    });

    if (!api) {
      console.error('❌ No se encontró la API');
      process.exit(1);
    }

    console.log('📋 API encontrada:', api.nombre);
    console.log('🌐 Base URL actual:', api.baseUrl);

    // Actualizar a localhost temporalmente hasta que Railway funcione
    // O usar la URL de ngrok si está disponible
    const nuevaUrl = 'http://localhost:8001/api/v1';
    
    api.baseUrl = nuevaUrl;
    api.markModified('baseUrl');
    
    await api.save();
    
    console.log('✅ Base URL actualizada a:', nuevaUrl);
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   La API de Railway no está disponible.');
    console.log('   Opciones:');
    console.log('   1. Usar localhost si tienes el backend de Mis Canchas corriendo localmente');
    console.log('   2. Contactar al equipo de Mis Canchas para verificar el estado de Railway');
    console.log('   3. Obtener una nueva URL de ngrok si está disponible');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

updateApiBaseUrl();
