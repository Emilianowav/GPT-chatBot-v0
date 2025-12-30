import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixEmpresaId() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener empresa Veo Veo
    const empresa = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    console.log('🏢 Empresa Veo Veo:');
    console.log('   _id:', empresa._id);
    console.log('   _id tipo:', typeof empresa._id);

    // Obtener API de Veo Veo
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('\n📡 API Veo Veo:');
    console.log('   empresaId actual:', api.empresaId);
    console.log('   empresaId tipo:', typeof api.empresaId);

    // Convertir empresaId de string a ObjectId (como Juventus)
    const empresaIdObjectId = empresa._id;

    console.log('\n🔄 Actualizando empresaId a ObjectId...');
    
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          empresaId: empresaIdObjectId,
          updatedAt: new Date()
        } 
      }
    );

    console.log('✅ empresaId actualizado a ObjectId');

    // Verificar
    const apiActualizada = await db.collection('api_configurations').findOne({
      _id: api._id
    });

    console.log('\n📋 Verificación:');
    console.log('   empresaId nuevo:', apiActualizada.empresaId);
    console.log('   empresaId tipo:', typeof apiActualizada.empresaId);

    // Probar consulta del router
    console.log('\n🔍 Probando consulta del router:');
    const result = await db.collection('api_configurations').find({
      empresaId: empresaIdObjectId,
      'workflows.0': { $exists: true }
    }).toArray();

    console.log('   Resultados:', result.length);
    if (result.length > 0) {
      console.log('   ✅ API encontrada correctamente');
    } else {
      console.log('   ❌ API NO encontrada');
    }

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEmpresaId();
