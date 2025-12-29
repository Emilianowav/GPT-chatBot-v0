import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearEmpresaVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Verificar si ya existe la empresa
    const empresaExistente = await db.collection('configuracionbots').findOne({
      empresaId: 'veo-veo'
    });

    if (empresaExistente) {
      console.log('⚠️  Ya existe configuración para Veo Veo');
      console.log('   ID:', empresaExistente._id);
      await mongoose.disconnect();
      return;
    }

    // Crear configuración de bot para Veo Veo
    const configBot = {
      empresaId: 'veo-veo',
      nombre: 'Veo Veo Libros',
      activo: true,
      mensajeBienvenida: '¡Hola! 📚\nBienvenido a *Veo Veo*\n\nSomos tu librería de confianza.\n¿En qué puedo ayudarte?',
      mensajeDespedida: '¡Gracias por tu compra! 📚\nTe esperamos pronto en Veo Veo',
      mensajeError: '❌ No entendí tu respuesta. Por favor, intenta de nuevo.',
      timeoutMinutos: 15,
      configuracion: {
        usarWorkflows: true,
        usarMenuPrincipal: true,
        usarHistorial: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('configuracionbots').insertOne(configBot);

    console.log('✅ Empresa Veo Veo creada exitosamente!');
    console.log('   ID:', result.insertedId);
    console.log('   Empresa ID:', configBot.empresaId);
    console.log('   Nombre:', configBot.nombre);

    // Obtener la API de Veo Veo
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (api) {
      console.log('\n📋 API de Veo Veo configurada:');
      console.log('   API ID:', api._id);
      console.log('   Endpoints:', api.endpoints.length);
      console.log('   Workflow:', api.workflows[0].nombre);
      console.log('   Pasos:', api.workflows[0].steps.length);
    }

    console.log('\n📱 PRÓXIMO PASO:');
    console.log('   Necesitas configurar el número de WhatsApp de Veo Veo');
    console.log('   ¿Cuál es el número de WhatsApp de Veo Veo?');

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearEmpresaVeoVeo();
