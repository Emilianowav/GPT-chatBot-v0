import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowMenuPrincipal() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔄 Creando workflow de menú principal con derivaciones...\n');

    // Workflow principal: solo muestra el menú y deriva a otros workflows o mensajes
    const workflowMenuPrincipal = {
      id: 'veo-veo-menu-principal',
      nombre: 'Veo Veo - Menú Principal',
      activo: true,
      trigger: {
        tipo: 'keyword',
        keywords: ['hola', 'menu', 'inicio', 'ayuda', 'consulta', 'libro', 'libros']
      },
      mensajeInicial: 'Hola 👋\n¡Bienvenido/a a Librería Veo Veo! 📚✏️\nEstamos para ayudarte.',
      steps: [
        {
          orden: 1,
          nombre: 'Menú principal',
          tipo: 'recopilar',
          nombreVariable: 'opcion_menu',
          pregunta: '👉 Por favor, elegí una opción:\n\n1️⃣ Consultar por libros escolares u otros títulos\n2️⃣ Libros de Inglés\n3️⃣ Atención post venta\n4️⃣ Información del local\n5️⃣ Promociones vigentes\n6️⃣ Atención personalizada\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4', '5', '6']
          }
        },
        {
          orden: 2,
          nombre: 'Respuesta según opción',
          tipo: 'mensaje',
          mensaje: '{{respuesta_opcion}}'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Actualizar workflow
    const result = await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          workflows: [workflowMenuPrincipal],
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Workflow de menú principal creado:');
    console.log('   Total pasos:', workflowMenuPrincipal.steps.length);
    console.log('   Paso 1: Mostrar menú con 6 opciones');
    console.log('   Paso 2: Responder según opción elegida');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearWorkflowMenuPrincipal();
