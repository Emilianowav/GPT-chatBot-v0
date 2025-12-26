import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];
    console.log('📋 WORKFLOW:', workflow.nombre);
    console.log('');

    // CORRECCIONES:

    // 1. PASO 0: Cambiar mensaje para que NO incluya Tenis
    workflow.steps[0].pregunta = '🎾 ¿Qué deporte querés jugar?\n\n1️⃣ Paddle\n2️⃣ Fútbol\n\nEscribí el número o el nombre del deporte';
    workflow.steps[0].validacion = {
      tipo: 'opcion',
      opciones: ['1', '2', 'paddle', 'futbol', 'fútbol']
    };
    console.log('✅ Paso 0: Mensaje corregido (sin Tenis)');

    // 2. PASO 7: Cambiar validacion.tipo de 'confirmacion' a 'opcion'
    workflow.steps[7].validacion = {
      tipo: 'opcion',
      opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
    };
    console.log('✅ Paso 7: validacion.tipo cambiado a "opcion"');

    // 3. PASO 8: Cambiar tipo de 'ejecutar' a 'consulta_filtrada'
    workflow.steps[8].tipo = 'consulta_filtrada';
    console.log('✅ Paso 8: tipo cambiado a "consulta_filtrada"');

    // 4. PASO 9: Cambiar tipo de 'ejecutar' a 'consulta_filtrada'
    workflow.steps[9].tipo = 'consulta_filtrada';
    console.log('✅ Paso 9: tipo cambiado a "consulta_filtrada"');

    // 5. PASO 10: Agregar nombreVariable y cambiar tipo a 'recopilar'
    workflow.steps[10].nombreVariable = 'mensaje_pago';
    workflow.steps[10].tipo = 'recopilar';
    workflow.steps[10].pregunta = workflow.steps[10].mensaje || '✅ Link de pago enviado';
    delete workflow.steps[10].mensaje;
    console.log('✅ Paso 10: nombreVariable agregado, tipo cambiado a "recopilar"');

    // 6. PASO 11: Agregar nombreVariable y cambiar tipo a 'recopilar'
    workflow.steps[11].nombreVariable = 'despedida';
    workflow.steps[11].tipo = 'recopilar';
    workflow.steps[11].pregunta = workflow.steps[11].mensaje || 'Gracias por tu reserva';
    delete workflow.steps[11].mensaje;
    console.log('✅ Paso 11: nombreVariable agregado, tipo cambiado a "recopilar"');

    console.log('');

    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          'workflows.0.steps': workflow.steps
        } 
      }
    );

    console.log('✅ Workflow actualizado en BD');

    // Verificar
    const verificar = await db.collection('api_configurations').findOne({ 
      _id: api._id 
    });

    console.log('\n📋 VERIFICACIÓN:');
    console.log('   Paso 0 opciones:', verificar.workflows[0].steps[0].validacion.opciones);
    console.log('   Paso 7 validacion.tipo:', verificar.workflows[0].steps[7].validacion.tipo);
    console.log('   Paso 8 tipo:', verificar.workflows[0].steps[8].tipo);
    console.log('   Paso 9 tipo:', verificar.workflows[0].steps[9].tipo);
    console.log('   Paso 10 tipo:', verificar.workflows[0].steps[10].tipo);
    console.log('   Paso 10 nombreVariable:', verificar.workflows[0].steps[10].nombreVariable);
    console.log('   Paso 11 tipo:', verificar.workflows[0].steps[11].tipo);
    console.log('   Paso 11 nombreVariable:', verificar.workflows[0].steps[11].nombreVariable);

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkflow();
