import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixEmpresaId() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    if (!empresa) {
      console.log('❌ No se encontró empresa Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Empresa encontrada:');
    console.log('   ID:', empresa._id);
    console.log('   Nombre:', empresa.nombre);

    // Obtener API
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('\n📡 API encontrada:');
    console.log('   ID:', api._id);
    console.log('   empresaId actual:', api.empresaId);

    // El problema: empresaId debe ser el ObjectId de la empresa, no un string
    const empresaIdCorrecto = empresa._id.toString();

    // Actualizar API con el empresaId correcto
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          empresaId: empresaIdCorrecto,
          phoneNumberId: empresa.phoneNumberId,
          updatedAt: new Date()
        } 
      }
    );

    console.log('\n✅ API actualizada:');
    console.log('   empresaId:', empresaIdCorrecto);
    console.log('   phoneNumberId:', empresa.phoneNumberId);

    // Verificar que el workflow esté activo
    const apiActualizada = await db.collection('api_configurations').findOne({
      _id: api._id
    });

    console.log('\n🔄 Workflow:');
    console.log('   Nombre:', apiActualizada.workflows[0].nombre);
    console.log('   Activo:', apiActualizada.workflows[0].activo);
    console.log('   Trigger keywords:', apiActualizada.workflows[0].trigger.keywords.join(', '));

    console.log('\n' + '='.repeat(60));
    console.log('✅ CONFIGURACIÓN CORREGIDA');
    console.log('='.repeat(60));
    console.log('\n🧪 TESTEAR:');
    console.log('   Envía "libro" al número:', empresa.telefono);
    console.log('   Debe activar el workflow de Veo Veo');

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEmpresaId();
