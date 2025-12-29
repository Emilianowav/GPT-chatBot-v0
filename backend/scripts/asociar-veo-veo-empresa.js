import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function asociarVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener la empresa Veo Veo existente
    const empresa = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    if (!empresa) {
      console.log('❌ No se encontró empresa Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Empresa Veo Veo encontrada:');
    console.log('   ID:', empresa._id);
    console.log('   Nombre:', empresa.nombre);
    console.log('   Teléfono:', empresa.telefono);
    console.log('   PhoneNumberId:', empresa.phoneNumberId);

    // Obtener la API de Veo Veo
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    // Actualizar la API para asociarla con la empresa
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          empresaId: empresa._id.toString(),
          phoneNumberId: empresa.phoneNumberId,
          updatedAt: new Date()
        } 
      }
    );

    console.log('\n✅ API de Veo Veo actualizada:');
    console.log('   API ID:', api._id);
    console.log('   Asociada a empresa:', empresa._id);
    console.log('   PhoneNumberId:', empresa.phoneNumberId);

    // Verificar si existe configuracionbots para veo-veo y eliminarla
    // (ya que la empresa ya existe en la colección empresas)
    const configBot = await db.collection('configuracionbots').findOne({
      empresaId: 'veo-veo'
    });

    if (configBot) {
      await db.collection('configuracionbots').deleteOne({ _id: configBot._id });
      console.log('\n✅ Configuración duplicada eliminada (ya existe en empresas)');
    }

    // Actualizar la empresa para habilitar workflows
    await db.collection('empresas').updateOne(
      { _id: empresa._id },
      { 
        $set: { 
          'modulos': ['workflows', 'mercadopago'],
          updatedAt: new Date()
        } 
      }
    );

    console.log('\n✅ Empresa actualizada con módulos:');
    console.log('   - workflows');
    console.log('   - mercadopago');

    console.log('\n' + '='.repeat(60));
    console.log('✅ VEO VEO CONFIGURADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📱 Número de WhatsApp:', empresa.telefono);
    console.log('📋 API configurada con', api.endpoints.length, 'endpoints');
    console.log('🔄 Workflow configurado con', api.workflows[0].steps.length, 'pasos');
    console.log('\n🚀 El bot está listo para recibir mensajes en WhatsApp');
    console.log('   Trigger keywords:', api.workflows[0].trigger.keywords.join(', '));

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

asociarVeoVeo();
