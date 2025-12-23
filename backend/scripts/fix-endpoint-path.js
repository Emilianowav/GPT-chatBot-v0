import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const apiConfigSchema = new mongoose.Schema({}, { strict: false });
const ApiConfiguration = mongoose.model('ApiConfiguration', apiConfigSchema, 'api_configurations');

async function fixEndpointPath() {
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
    console.log('📍 Endpoints actuales:');
    api.endpoints.forEach(ep => {
      console.log(`   - ${ep.nombre}: ${ep.path}`);
    });

    // Buscar y actualizar el endpoint
    const endpointIndex = api.endpoints.findIndex(ep => 
      ep.nombre.toLowerCase().includes('crear') && 
      ep.nombre.toLowerCase().includes('reserva')
    );

    if (endpointIndex !== -1) {
      console.log('\n🔧 Actualizando endpoint...');
      api.endpoints[endpointIndex].path = '/bookings';
      api.endpoints[endpointIndex].nombre = 'Crear Reserva';
      
      // Marcar como modificado
      api.markModified('endpoints');
      
      await api.save();
      console.log('✅ Endpoint actualizado correctamente');
      
      // Verificar
      const apiVerificacion = await ApiConfiguration.findById(api._id);
      const endpointVerificado = apiVerificacion.endpoints[endpointIndex];
      console.log('\n✅ Verificación:');
      console.log(`   Nombre: ${endpointVerificado.nombre}`);
      console.log(`   Path: ${endpointVerificado.path}`);
    } else {
      console.log('❌ No se encontró el endpoint');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

fixEndpointPath();
