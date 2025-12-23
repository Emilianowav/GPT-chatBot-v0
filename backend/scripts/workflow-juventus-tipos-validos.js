import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowTiposValidos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    const apiJuventus = await db.collection('api_configurations').findOne({ 
      nombre: /mis canchas/i 
    });

    if (!apiJuventus) {
      console.error('❌ No se encontró API de Juventus');
      process.exit(1);
    }

    // IDs de endpoints según la BD
    const ENDPOINT_IDS = {
      deportes: 'obtener-deportes',
      disponibilidad: 'consultar-disponibilidad',
      preCrear: 'pre-crear-reserva',
      confirmar: 'confirmar-reserva',
      cancelar: 'cancelar-reserva',
      precios: 'obtener-precios'
    };

    console.log('\n📋 Endpoints configurados:');
    Object.entries(ENDPOINT_IDS).forEach(([key, id]) => {
      console.log(`   - ${key}: ${id}`);
    });

    // Workflow con tipos VÁLIDOS según schema
    const workflow = {
      _id: new mongoose.Types.ObjectId(),
      id: new mongoose.Types.ObjectId().toString(),
      nombre: 'Juventus - Reserva de Canchas',
      descripcion: 'Flujo de reserva: deporte -> fecha -> duración/hora -> consultar disponibilidad -> confirmar -> pago',
      activo: true,
      prioridad: 25,
      trigger: {
        tipo: 'keyword',
        keywords: ['reservar', 'turno', 'cancha', 'reserva', 'quiero reservar', 'hola', 'menu']
      },
      mensajeInicial: '¡Hola! 👋\nBienvenido a Club Juventus 🎾\n\nTe ayudo a reservar tu cancha.',
      steps: [
        // PASO 1: Consultar deportes disponibles (API)
        {
          orden: 1,
          tipo: 'consulta_filtrada',
          nombreVariable: 'deporte',
          endpointId: ENDPOINT_IDS.deportes,
          pregunta: '🎾 ¿Qué deporte querés jugar?\n\n{{opciones}}\n\nEscribí el número',
          endpointResponseConfig: {
            arrayPath: 'deportes',
            idField: 'id',
            displayField: 'nombre'
          },
          nombre: 'Elegir deporte'
        },
        // PASO 2: Elegir fecha
        {
          orden: 2,
          tipo: 'recopilar',
          nombreVariable: 'fecha',
          pregunta: '📅 ¿Para qué fecha querés reservar?\n\nEscribí la fecha en formato DD/MM/AAAA o escribí "hoy" o "mañana"',
          validacion: {
            tipo: 'texto'
          },
          nombre: 'Elegir fecha'
        },
        // PASO 3: Duración del partido
        {
          orden: 3,
          tipo: 'recopilar',
          nombreVariable: 'duracion',
          pregunta: '⏱️ ¿Cuánto tiempo querés jugar?\n\n1️⃣ 60 minutos (1 hora)\n2️⃣ 90 minutos (1 hora y media)\n3️⃣ 120 minutos (2 horas)\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '60', '90', '120']
          },
          nombre: 'Duración del partido'
        },
        // PASO 4: Hora preferida
        {
          orden: 4,
          tipo: 'recopilar',
          nombreVariable: 'hora_preferida',
          pregunta: '⏰ ¿A qué hora preferís jugar?\n\nHorarios disponibles: 08:00 a 23:00\nEscribí la hora en formato HH:MM (ej: 19:00)',
          validacion: {
            tipo: 'texto'
          },
          nombre: 'Hora preferida'
        },
        // PASO 5: Consultar disponibilidad (API)
        {
          orden: 5,
          tipo: 'consulta_filtrada',
          nombreVariable: 'turno_seleccionado',
          endpointId: ENDPOINT_IDS.disponibilidad,
          mapeoParametros: {
            fecha: 'fecha',
            deporte: 'deporte',
            hora: 'hora_preferida',
            duracion: 'duracion'
          },
          pregunta: '🏟️ *Turnos disponibles:*\n\n{{opciones}}\n\n¿Cuál turno querés reservar?\nEscribí el número',
          endpointResponseConfig: {
            arrayPath: 'data',
            idField: 'id',
            displayField: 'descripcion'
          },
          nombre: 'Consultar disponibilidad'
        },
        // PASO 6: Solicitar nombre
        {
          orden: 6,
          tipo: 'recopilar',
          nombreVariable: 'cliente_nombre',
          pregunta: '👤 ¿A nombre de quién hacemos la reserva?',
          validacion: {
            tipo: 'texto'
          },
          nombre: 'Solicitar nombre'
        },
        // PASO 7: Solicitar teléfono
        {
          orden: 7,
          tipo: 'recopilar',
          nombreVariable: 'cliente_telefono',
          pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
          validacion: {
            tipo: 'texto'
          },
          nombre: 'Solicitar teléfono'
        },
        // PASO 8: Confirmar reserva
        {
          orden: 8,
          tipo: 'confirmacion',
          nombreVariable: 'confirmacion',
          pregunta: '📋 *Resumen de tu reserva:*\n\n🎾 Deporte: {{deporte}}\n📅 Fecha: {{fecha}}\n⏰ Hora: {{hora_preferida}}\n⏱️ Duración: {{duracion}} minutos\n🏟️ Turno: {{turno_seleccionado}}\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n\n¿Confirmás la reserva?\nEscribí *SI* para confirmar o *NO* para cancelar',
          nombre: 'Confirmar reserva'
        },
        // PASO 9: Pre-crear reserva (API) - solo si confirma
        {
          orden: 9,
          tipo: 'consulta_filtrada',
          nombreVariable: 'reserva',
          endpointId: ENDPOINT_IDS.preCrear,
          mapeoParametros: {
            turno_id: 'turno_seleccionado',
            fecha: 'fecha',
            hora_inicio: 'hora_preferida',
            duracion: 'duracion',
            deporte: 'deporte',
            'cliente.nombre': 'cliente_nombre',
            'cliente.telefono': 'cliente_telefono',
            origen: 'whatsapp'
          },
          plantillaRespuesta: '⏳ Procesando tu reserva...',
          nombre: 'Pre-crear reserva'
        },
        // PASO 10: Generar link de pago (API)
        {
          orden: 10,
          tipo: 'consulta_filtrada',
          nombreVariable: 'pago',
          endpointId: ENDPOINT_IDS.precios,
          mapeoParametros: {
            reservaId: 'reserva.id',
            monto: 'reserva.precio'
          },
          plantillaRespuesta: '💳 Generando link de pago...',
          nombre: 'Generar link de pago'
        }
      ],
      mensajeFinal: '✅ *¡Reserva confirmada!*\n\n🎾 {{deporte}}\n🏟️ {{turno_seleccionado}}\n📅 {{fecha}} a las {{hora_preferida}}\n💰 Seña: ${{reserva.precio}}\n\n💳 *Pagá la seña con este link:*\n{{pago.link}}\n\n⚠️ Tenés 15 minutos para completar el pago.\n\n¡Gracias por elegir Club Juventus! 🎾',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('\n📋 WORKFLOW CREADO - TIPOS VÁLIDOS:');
    console.log('   Nombre:', workflow.nombre);
    console.log('   Steps:', workflow.steps.length);
    console.log('\n📋 PASOS:');
    workflow.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step.nombre} (${step.tipo})`);
    });

    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: apiJuventus._id },
      { 
        $set: { 
          workflows: [workflow]
        } 
      }
    );

    console.log('\n✅ Workflow guardado en BD');

    // Verificar
    const verificar = await db.collection('api_configurations').findOne({ 
      _id: apiJuventus._id 
    });

    console.log('\n📋 VERIFICACIÓN:');
    console.log('   Workflows:', verificar.workflows?.length || 0);
    console.log('   Steps:', verificar.workflows?.[0]?.steps?.length || 0);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

crearWorkflowTiposValidos();
