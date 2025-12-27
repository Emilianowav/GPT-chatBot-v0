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

    if (!api) {
      console.log('❌ No se encontró API');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 CORRIGIENDO WORKFLOW COMPLETO\n');

    // ============================================
    // 1. CORREGIR PASOS DEL WORKFLOW
    // ============================================
    
    if (api.workflows && api.workflows.length > 0) {
      const workflow = api.workflows[0];
      
      // PASO 0: Deporte - Limpiar mensaje
      workflow.steps[0].pregunta = `¡Hola!
Bienvenido a *Club Juventus*

Te ayudo a reservar tu cancha.

🎾 ¿Qué deporte querés jugar?

1️⃣ Paddle
2️⃣ Fútbol

Escribí el número`;
      
      // Asegurar que el mapeo esté correcto
      workflow.steps[0].validacion = {
        tipo: 'opcion',
        opciones: ['1', '2', 'paddle', 'futbol', 'fútbol'],
        mapeo: {
          '1': 'paddle',
          '2': 'futbol',
          'paddle': 'paddle',
          'futbol': 'futbol',
          'fútbol': 'futbol'
        }
      };
      console.log('✅ Paso 0 (Deporte) corregido');

      // PASO 1: Fecha - OK

      // PASO 2: Duración - Limpiar mensaje
      workflow.steps[2].pregunta = `¿Cuánto tiempo querés jugar?

1️⃣ 60 minutos (1 hora)
2️⃣ 90 minutos (1 hora y media)
3️⃣ 120 minutos (2 horas)

Escribí el número`;
      console.log('✅ Paso 2 (Duración) corregido');

      // PASO 3: Hora - OK

      // PASO 4: Consulta disponibilidad - Agregar transformación de deporte
      // El mapeo de parámetros debe transformar el deporte
      workflow.steps[4].mapeoParametros = {
        fecha: '{{fecha}}',
        deporte: '{{deporte}}'  // Ya viene mapeado desde paso 0
      };
      console.log('✅ Paso 4 (Disponibilidad) corregido');

      // PASO 5: Nombre - Agregar mensaje de éxito
      workflow.steps[5].pregunta = `¡Perfecto! Encontré disponibilidad.

¿A nombre de quién hacemos la reserva?`;
      console.log('✅ Paso 5 (Nombre) corregido');

      // PASO 6: Teléfono - OK

      // PASO 7: Confirmación - Limpiar y agregar info de pago
      workflow.steps[7].pregunta = `📋 *Resumen de tu reserva:*

🎾 Deporte: {{deporte}}
📅 Fecha: {{fecha}}
⏰ Hora: {{hora_preferida}}
⏱️ Duración: {{duracion}} minutos
🏟️ Cancha: {{cancha_nombre}}
👤 Nombre: {{cliente_nombre}}
📱 Teléfono: {{cliente_telefono}}

¿Confirmás la reserva?
Escribí *SI* para confirmar o *NO* para cancelar

_Se enviará un link de pago equivalente al 50% de la reserva. Una vez abonada, confirmaremos la reserva y te notificaremos por este medio._`;
      
      // Limpiar validación para que no muestre opciones
      workflow.steps[7].validacion = {
        tipo: 'opcion',
        opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
      };
      console.log('✅ Paso 7 (Confirmación) corregido');

      api.workflows[0] = workflow;
    }

    // ============================================
    // 2. GUARDAR CAMBIOS
    // ============================================
    
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: api.workflows } }
    );

    console.log('\n✅ Workflow actualizado en BD');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CORRECCIONES');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('1. Paso 0 (Deporte):');
    console.log('   ✅ Mensaje limpio sin opciones repetidas');
    console.log('   ✅ Mapeo: 1 → paddle, 2 → futbol');
    console.log('');
    console.log('2. Paso 2 (Duración):');
    console.log('   ✅ Mensaje limpio');
    console.log('');
    console.log('3. Paso 5 (Nombre):');
    console.log('   ✅ Mensaje: "¡Perfecto! Encontré disponibilidad."');
    console.log('');
    console.log('4. Paso 7 (Confirmación):');
    console.log('   ✅ Mensaje limpio con info de pago 50%');
    console.log('');
    console.log('⚠️  NOTA: El mapeo de deporte se aplica en el código');
    console.log('   cuando se procesa la validación tipo "opcion"');

    await mongoose.disconnect();
    console.log('\n✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkflow();
