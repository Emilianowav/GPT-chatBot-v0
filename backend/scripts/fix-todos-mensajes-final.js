import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixMensajes() {
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

    console.log('📋 CORRIGIENDO TODOS LOS MENSAJES DEL WORKFLOW\n');

    // MENSAJE INICIAL
    workflow.mensajeInicial = `¡Hola!
Bienvenido a *Club Juventus*

Te ayudo a reservar tu cancha.`;

    // PASO 0: Deporte
    workflow.steps[0].pregunta = `🎾 ¿Qué deporte querés jugar?

1️⃣ Paddle
2️⃣ Fútbol

Escribí el número`;

    // PASO 1: Fecha
    workflow.steps[1].pregunta = `📅 ¿Para qué fecha querés reservar?

Escribí la fecha en formato DD/MM/AAAA o escribí "hoy" o "mañana"`;

    // PASO 2: Duración
    workflow.steps[2].pregunta = `¿Cuánto tiempo querés jugar?

1️⃣ 60 minutos (1 hora)
2️⃣ 90 minutos (1 hora y media)
3️⃣ 120 minutos (2 horas)

Escribí el número`;

    // PASO 3: Hora
    workflow.steps[3].pregunta = `⏰ ¿A qué hora preferís jugar?

Horarios disponibles: 08:00 a 23:00
Escribí la hora en formato HH:MM (ej: 19:00)`;

    // PASO 4: Consultar disponibilidad (este paso es automático, no muestra mensaje)
    // El mensaje se genera en el código cuando encuentra disponibilidad

    // PASO 5: Nombre
    workflow.steps[5].pregunta = `¿A nombre de quién hacemos la reserva?`;

    // PASO 6: Teléfono
    workflow.steps[6].pregunta = `📱 ¿Cuál es tu número de teléfono?

Escribí el número con código de área (ej: 5493794123456)`;

    // PASO 7: Confirmación
    workflow.steps[7].pregunta = `📋 Resumen de tu reserva:

🎾 Deporte: {{deporte}}
📅 Fecha: {{fecha}}
⏰ Hora: {{hora_preferida}}
⏱️ Duración: {{duracion}} minutos
🏟️ Cancha: {{cancha_nombre}}
👤 Nombre: {{cliente_nombre}}
📱 Teléfono: {{cliente_telefono}}

¿Confirmás la reserva?
Escribí SI para confirmar o NO para cancelar

Se enviará un link de pago equivalente al 50% de la reserva. Una vez abonada, confirmaremos la reserva y te notificaremos por este medio.`;

    // Limpiar validación del paso 7 para que no muestre opciones
    workflow.steps[7].validacion = {
      tipo: 'opcion',
      opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
    };

    // Guardar
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: api.workflows } }
    );

    console.log('✅ Todos los mensajes corregidos:\n');
    console.log('  ✅ Mensaje inicial');
    console.log('  ✅ Paso 0: Deporte');
    console.log('  ✅ Paso 1: Fecha');
    console.log('  ✅ Paso 2: Duración');
    console.log('  ✅ Paso 3: Hora');
    console.log('  ✅ Paso 5: Nombre');
    console.log('  ✅ Paso 6: Teléfono');
    console.log('  ✅ Paso 7: Confirmación');

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMensajes();
