import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function actualizarMenu() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔄 Actualizando menú principal con todas las opciones...\n');

    // Actualizar solo el paso 1 para incluir todas las opciones
    const result = await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          'workflows.0.steps.0.pregunta': '👉 Por favor, elegí una opción:\n\n1️⃣ Consultar por libros escolares u otros títulos\n2️⃣ Libros de Inglés\n3️⃣ Atención post venta\n4️⃣ Información del local\n5️⃣ Promociones vigentes\n6️⃣ Atención personalizada\n\nEscribí el número',
          'workflows.0.steps.0.validacion.opciones': ['1', '2', '3', '4', '5', '6'],
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Menú actualizado con 6 opciones');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarMenu();
