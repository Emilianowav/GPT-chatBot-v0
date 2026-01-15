import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function arreglarFlujos() {
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

    let workflows = api.workflows || [];

    console.log('📋 Estado inicial:', workflows.length, 'workflows\n');

    // 1. ACTIVAR Y CONFIGURAR FLUJO 1: Consultar Libros
    const flujo1Index = workflows.findIndex(w => w.nombre === 'Veo Veo - Consultar Libros');
    if (flujo1Index !== -1) {
      workflows[flujo1Index].activo = true;
      workflows[flujo1Index].trigger = {
        tipo: 'menu',
        valor: '1'
      };
      console.log('✅ FLUJO 1: Consultar Libros - ACTIVADO con trigger menu:1');
    }

    // 2. ELIMINAR workflows viejos/duplicados
    const workflowsAEliminar = [
      'Veo Veo - Libros de Inglés',  // Viejo, sin pasos
      'Veo Veo - Post Venta',         // Viejo
      'Veo Veo - Información del Local', // Viejo, sin pasos
      'Veo Veo - Promociones',        // Viejo, sin pasos
      'Veo Veo - Atención Personalizada' // Viejo, sin pasos
    ];

    const workflowsLimpios = workflows.filter(w => !workflowsAEliminar.includes(w.nombre));
    
    console.log(`\n🧹 Eliminados ${workflows.length - workflowsLimpios.length} workflows viejos/duplicados:`);
    workflowsAEliminar.forEach(nombre => {
      const existe = workflows.find(w => w.nombre === nombre);
      if (existe) {
        console.log(`   ❌ ${nombre}`);
      }
    });

    workflows = workflowsLimpios;

    // 3. CREAR FLUJO 2: Libros de Inglés (nuevo, completo)
    const flujo2Existe = workflows.find(w => w.nombre === 'Veo Veo - Libros de Inglés (Nuevo)');
    if (!flujo2Existe) {
      const flujo2 = {
        nombre: 'Veo Veo - Libros de Inglés',
        descripcion: 'Información sobre pedidos de libros de inglés',
        activo: true,
        trigger: {
          tipo: 'menu',
          valor: '2'
        },
        steps: [
          {
            orden: 1,
            nombre: 'Información libros de inglés',
            tipo: 'recopilar',
            pregunta: `Los libros de inglés se realizan únicamente a pedido con seña.

Para realizar su pedido, comunicarse con un asesor de venta directo:

👉 https://wa.me/5493794732177?text=Hola,%20estoy%20interesado%20en%20un%20libro%20de%20inglés%20a%20pedido

Escribí *1* para volver al menú principal`,
            nombreVariable: 'volver_menu',
            validacion: {
              tipo: 'opcion',
              opciones: ['1']
            }
          }
        ]
      };
      workflows.push(flujo2);
      console.log('\n✅ FLUJO 2: Libros de Inglés - CREADO con trigger menu:2');
    }

    // 4. CREAR FLUJO 4: Información del Local (nuevo, completo)
    const flujo4Existe = workflows.find(w => w.nombre === 'Veo Veo - Información del Local (Nuevo)');
    if (!flujo4Existe) {
      const flujo4 = {
        nombre: 'Veo Veo - Información del Local',
        descripcion: 'Dirección y horarios del local',
        activo: true,
        trigger: {
          tipo: 'menu',
          valor: '4'
        },
        steps: [
          {
            orden: 1,
            nombre: 'Información del local',
            tipo: 'recopilar',
            pregunta: `Estamos en 📍*San Juan 1037 - Corrientes Capital.*

🕗 *Horarios de atención:*
De Lunes a Viernes de 8:30 a 12:00hs y de 17:00 a 21:00hs
Sábados de 9:00 a 13:00hs y de 17:00 a 21:00hs

Te esperamos! 🤗

Escribí *1* para volver al menú principal`,
            nombreVariable: 'volver_menu',
            validacion: {
              tipo: 'opcion',
              opciones: ['1']
            }
          }
        ]
      };
      workflows.push(flujo4);
      console.log('✅ FLUJO 4: Información del Local - CREADO con trigger menu:4');
    }

    // 5. Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: workflows } }
    );

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ WORKFLOWS ACTUALIZADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    workflows.forEach((wf, i) => {
      const trigger = wf.trigger?.tipo === 'menu' ? `menu:${wf.trigger.valor}` : wf.trigger?.tipo || 'NO';
      console.log(`${i + 1}. ${wf.nombre}`);
      console.log(`   Activo: ${wf.activo ? '✅' : '❌'} | Trigger: ${trigger} | Pasos: ${wf.steps?.length || 0}`);
    });

    console.log(`\n📊 Total workflows: ${workflows.length}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

arreglarFlujos();
