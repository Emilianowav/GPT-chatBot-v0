import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function comparar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener Juventus
    const empresaJuventus = await db.collection('empresas').findOne({
      nombre: /juventus/i
    });

    // Obtener Veo Veo
    const empresaVeoVeo = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    console.log('🏢 EMPRESAS:');
    console.log('Juventus ID:', empresaJuventus._id.toString());
    console.log('Veo Veo ID:', empresaVeoVeo._id.toString());
    console.log('');

    // Buscar APIs de Juventus
    const apiJuventus = await db.collection('api_configurations').findOne({
      empresaId: empresaJuventus._id.toString()
    });

    // Buscar APIs de Veo Veo
    const apiVeoVeo = await db.collection('api_configurations').findOne({
      empresaId: empresaVeoVeo._id.toString()
    });

    console.log('📡 APIs:');
    console.log('Juventus:', apiJuventus ? apiJuventus.nombre : 'NO ENCONTRADA');
    console.log('Veo Veo:', apiVeoVeo ? apiVeoVeo.nombre : 'NO ENCONTRADA');
    console.log('');

    if (apiJuventus) {
      console.log('🔍 JUVENTUS - Estructura:');
      console.log('   empresaId:', apiJuventus.empresaId);
      console.log('   empresaId tipo:', typeof apiJuventus.empresaId);
      console.log('   workflows:', apiJuventus.workflows?.length || 0);
      if (apiJuventus.workflows && apiJuventus.workflows.length > 0) {
        const wf = apiJuventus.workflows[0];
        console.log('   workflow.activo:', wf.activo);
        console.log('   workflow.trigger:', JSON.stringify(wf.trigger));
      }
      console.log('');
    }

    if (apiVeoVeo) {
      console.log('🔍 VEO VEO - Estructura:');
      console.log('   empresaId:', apiVeoVeo.empresaId);
      console.log('   empresaId tipo:', typeof apiVeoVeo.empresaId);
      console.log('   workflows:', apiVeoVeo.workflows?.length || 0);
      if (apiVeoVeo.workflows && apiVeoVeo.workflows.length > 0) {
        const wf = apiVeoVeo.workflows[0];
        console.log('   workflow.activo:', wf.activo);
        console.log('   workflow.trigger:', JSON.stringify(wf.trigger));
      }
      console.log('');
    }

    // Probar consulta que usa el router
    console.log('🔍 PROBANDO CONSULTA DEL ROUTER:');
    console.log('');

    console.log('Para Juventus:');
    const resultJuventus = await db.collection('api_configurations').find({
      empresaId: empresaJuventus._id.toString(),
      'workflows.0': { $exists: true }
    }).toArray();
    console.log('   Resultados:', resultJuventus.length);

    console.log('');
    console.log('Para Veo Veo:');
    const resultVeoVeo = await db.collection('api_configurations').find({
      empresaId: empresaVeoVeo._id.toString(),
      'workflows.0': { $exists: true }
    }).toArray();
    console.log('   Resultados:', resultVeoVeo.length);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

comparar();
