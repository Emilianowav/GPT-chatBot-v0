import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function arreglarFlujo3() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    const workflows = api.workflows || [];
    const flujo3Index = workflows.findIndex(w => w.nombre === 'Veo Veo - Soporte de Ventas');

    if (flujo3Index === -1) {
      console.log('❌ No se encontró FLUJO 3: Soporte de Ventas');
      await mongoose.disconnect();
      return;
    }

    // Reemplazar FLUJO 3 completo con lógica correcta
    workflows[flujo3Index] = {
      nombre: 'Veo Veo - Soporte de Ventas',
      descripcion: 'Atención post venta y consultas sobre compras',
      activo: true,
      trigger: {
        tipo: 'menu',
        valor: '3'
      },
      steps: [
        {
          orden: 1,
          nombre: 'Menú soporte de ventas',
          tipo: 'recopilar',
          pregunta: `👉 *Elegí una opción:*

1️⃣ Compré mi libro y quiero retirarlo
2️⃣ Compré un libro por error
3️⃣ El libro que compré tiene fallas de fábrica
4️⃣ Compré un libro y quiero que me lo envíen

Escribí el número`,
          nombreVariable: 'opcion_soporte',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4']
          }
        },
        {
          orden: 2,
          nombre: 'Mostrar respuesta según opción',
          tipo: 'recopilar',
          pregunta: `{{respuesta_soporte}}

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ],
      // Usar plantilla de respuesta dinámica basada en la opción
      respuestaTemplate: `{{respuesta_soporte}}`
    };

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: workflows } }
    );

    console.log('✅ FLUJO 3: Soporte de Ventas - Simplificado a 2 pasos');
    console.log('   Paso 1: Menú con 4 opciones');
    console.log('   Paso 2: Mostrar respuesta + volver al menú');
    console.log('\n⚠️  NOTA: Necesitamos implementar lógica para mapear opcion_soporte → respuesta_soporte');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

arreglarFlujo3();
