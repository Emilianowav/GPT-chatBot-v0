import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function eliminarDuplicada() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar todas las APIs de Intercapital
    const apis = await db.collection('api_configurations').find({
      nombre: /intercapital/i
    }).sort({ createdAt: -1 }).toArray();

    console.log(`📋 APIs encontradas: ${apis.length}\n`);

    if (apis.length <= 1) {
      console.log('✅ No hay duplicados');
      await mongoose.disconnect();
      return;
    }

    // Mostrar todas las APIs
    apis.forEach((api, i) => {
      console.log(`${i + 1}. API ID: ${api._id}`);
      console.log(`   - Nombre: ${api.nombre}`);
      console.log(`   - Created: ${api.createdAt}`);
      console.log(`   - Endpoints: ${api.endpoints?.length || 0}`);
      console.log(`   - Workflows: ${api.workflows?.length || 0}`);
      console.log(`   - Llamadas: ${api.estadisticas?.totalLlamadas || 0}`);
      console.log('');
    });

    // Mantener la más reciente (primera en el array por el sort)
    const apiAMantener = apis[0];
    const apisAEliminar = apis.slice(1);

    console.log(`✅ Manteniendo: ${apiAMantener._id} (más reciente)`);
    console.log(`❌ Eliminando: ${apisAEliminar.length} API(s) duplicada(s)\n`);

    // Eliminar las duplicadas
    for (const api of apisAEliminar) {
      await db.collection('api_configurations').deleteOne({ _id: api._id });
      console.log(`   ✅ Eliminada: ${api._id}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DUPLICADOS ELIMINADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificar
    const apisRestantes = await db.collection('api_configurations').find({
      nombre: /intercapital/i
    }).toArray();

    console.log(`📋 APIs restantes: ${apisRestantes.length}`);
    if (apisRestantes.length === 1) {
      console.log(`   ✅ ID: ${apisRestantes[0]._id}`);
      console.log(`   ✅ Nombre: ${apisRestantes[0].nombre}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

eliminarDuplicada();
