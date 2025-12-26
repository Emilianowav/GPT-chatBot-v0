import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verEndpoints() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api) {
      console.log('❌ No se encontró API');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 ENDPOINTS DE LA API:\n');
    
    api.endpoints.forEach((ep, i) => {
      console.log(`${i + 1}. ${ep.nombre}`);
      console.log('   _id:', ep._id);
      console.log('   id:', ep.id);
      console.log('   Método:', ep.metodo);
      console.log('   Path:', ep.path);
      console.log('');
    });

    // Ver paso 4
    const paso4 = api.workflows[0].steps[4];
    console.log('📋 PASO 4:');
    console.log('   endpointId:', paso4.endpointId);
    console.log('   Tipo:', typeof paso4.endpointId);
    console.log('');

    // Buscar endpoint que coincida
    const endpointMatch = api.endpoints.find(e => 
      e._id?.toString() === paso4.endpointId ||
      e.id === paso4.endpointId ||
      e.nombre.toLowerCase().includes('disponibilidad')
    );

    if (endpointMatch) {
      console.log('✅ Endpoint encontrado por coincidencia:');
      console.log('   Nombre:', endpointMatch.nombre);
      console.log('   _id:', endpointMatch._id);
      console.log('   id:', endpointMatch.id);
    } else {
      console.log('❌ No se encontró endpoint que coincida');
    }

    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verEndpoints();
