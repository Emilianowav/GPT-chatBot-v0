import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const apiConfigSchema = new mongoose.Schema({}, { strict: false });
const ApiConfiguration = mongoose.model('ApiConfiguration', apiConfigSchema, 'api_configurations');

async function updateMisCanchasConfig() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar la API de Mis Canchas
    const api = await ApiConfiguration.findOne({ 
      nombre: /Mis Canchas/i 
    });

    if (!api) {
      console.error('❌ No se encontró la API de Mis Canchas');
      process.exit(1);
    }

    console.log('📋 API encontrada:', api.nombre);
    console.log('🆔 ID:', api._id);

    // Actualizar autenticación a API Key
    api.autenticacion = {
      tipo: 'api_key',
      configuracion: {
        apiKey: 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a',
        apiKeyName: 'X-API-Key',
        apiKeyLocation: 'header'
      }
    };

    // Buscar y actualizar el endpoint de crear reserva
    const endpointIndex = api.endpoints.findIndex(ep => 
      ep.nombre.toLowerCase().includes('crear') && 
      ep.nombre.toLowerCase().includes('reserva')
    );

    if (endpointIndex !== -1) {
      const endpoint = api.endpoints[endpointIndex];
      console.log('📍 Endpoint encontrado:', endpoint.nombre);
      
      // Actualizar path
      endpoint.path = '/bookings';
      
      // Actualizar body de prueba
      endpoint.bodyPrueba = JSON.stringify({
        "cancha_id": "9bd901b5-d922-43b8-ba8e-12e0fb983a49",
        "fecha": "2025-12-23",
        "hora_inicio": "19:00",
        "duracion": 60,
        "cliente": {
          "nombre": "Juan Pérez",
          "telefono": "5493794123456",
          "email": "juan@email.com"
        },
        "origen": "whatsapp"
      }, null, 2);

      api.endpoints[endpointIndex] = endpoint;
      console.log('✅ Endpoint actualizado');
    } else {
      console.log('⚠️ No se encontró el endpoint de crear reserva');
    }

    // Guardar cambios
    await api.save();
    console.log('✅ Configuración actualizada exitosamente');

    console.log('\n📝 Resumen de cambios:');
    console.log('   ✅ Autenticación: API Key en header X-API-Key');
    console.log('   ✅ Endpoint path: /bookings');
    console.log('   ✅ Body de prueba actualizado con cancha_id real');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

updateMisCanchasConfig();
