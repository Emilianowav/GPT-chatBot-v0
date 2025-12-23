import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function reemplazarWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('api_configurations');

    // Buscar la API
    const api = await collection.findOne({ nombre: /Mis Canchas/i });
    
    if (!api) {
      console.error('❌ No se encontró la API');
      process.exit(1);
    }

    console.log('📋 API encontrada:', api.nombre);
    console.log('🔍 Workflows actuales:', api.workflows?.length || 0);

    // Buscar endpoints
    const endpointDeportes = api.endpoints.find(ep => 
      ep.nombre.toLowerCase().includes('deporte')
    );
    const endpointDisponibilidad = api.endpoints.find(ep => 
      ep.nombre.toLowerCase().includes('disponibilidad')
    );
    const endpointCrearReserva = api.endpoints.find(ep => 
      ep.path && (ep.path.includes('booking') || ep.path === '/bookings')
    );

    // Crear workflow nuevo
    const workflowNuevo = {
      id: "workflow-juventus-reservas-v2",
      nombre: "Juventus - Reserva de Canchas",
      descripcion: "Flujo completo para reservar canchas",
      activo: true,
      trigger: {
        tipo: "keyword",
        keywords: ["reservar", "turno", "cancha", "reserva", "quiero reservar"],
        primeraRespuesta: false
      },
      prioridad: 25,
      mensajeInicial: "¡Hola! 👋\nBienvenido a Club Juventus 🎾\n\nTe ayudo a reservar tu cancha en pocos pasos.",
      mensajeFinal: "✅ ¡Reserva completada!",
      mensajeAbandonar: "🚫 Reserva cancelada.",
      permitirAbandonar: true,
      timeoutMinutos: 15,
      steps: [
        {
          orden: 1,
          tipo: "recopilar",
          nombre: "Seleccionar Deporte",
          pregunta: "⚽ ¿Qué deporte querés jugar?",
          nombreVariable: "deporte_id",
          validacion: { tipo: "opcion", opciones: [], mensajeError: "Selecciona un deporte válido" },
          endpointId: endpointDeportes?.id,
          endpointResponseConfig: { arrayPath: "deportes", idField: "id", displayField: "nombre" },
          intentosMaximos: 3
        },
        {
          orden: 2,
          tipo: "recopilar",
          nombre: "Ingresar Fecha",
          pregunta: "📅 ¿Para qué fecha querés reservar?\n\nEscribí DD/MM/AAAA o \"hoy\"/\"mañana\"",
          nombreVariable: "fecha",
          validacion: { tipo: "fecha", opciones: [], mensajeError: "Ingresa una fecha válida" },
          intentosMaximos: 3
        },
        {
          orden: 3,
          tipo: "recopilar",
          nombre: "Seleccionar Duración",
          pregunta: "⏱️ ¿Cuánto tiempo querés jugar?",
          nombreVariable: "duracion",
          validacion: {
            tipo: "opcion",
            opciones: ["60: 1 hora", "90: 1.5 horas", "120: 2 horas"],
            mensajeError: "Selecciona una duración válida"
          },
          intentosMaximos: 3
        },
        {
          orden: 4,
          tipo: "recopilar",
          nombre: "Ingresar Hora",
          pregunta: "🕐 ¿A qué hora? (formato 24hs, ej: 19:00)",
          nombreVariable: "hora_inicio",
          validacion: { tipo: "texto", opciones: [], mensajeError: "Ingresa una hora válida" },
          intentosMaximos: 3
        },
        {
          orden: 5,
          tipo: "consulta_filtrada",
          nombre: "Consultar Disponibilidad",
          nombreVariable: "canchas_disponibles",
          endpointId: endpointDisponibilidad?.id,
          mapeoParametros: {
            fecha: "fecha",
            deporte: "deporte_id",
            duracion: "duracion",
            hora_inicio: "hora_inicio"
          },
          intentosMaximos: 3
        },
        {
          orden: 6,
          tipo: "recopilar",
          nombre: "Seleccionar Cancha",
          pregunta: "🎾 Canchas disponibles:\n\n¿Cuál querés?",
          nombreVariable: "cancha_id",
          validacion: { tipo: "opcion", opciones: [], mensajeError: "Selecciona una cancha" },
          endpointResponseConfig: { arrayPath: "canchas_disponibles", idField: "id", displayField: "nombre" },
          intentosMaximos: 3
        },
        {
          orden: 7,
          tipo: "recopilar",
          nombre: "Nombre",
          pregunta: "👤 ¿Tu nombre completo?",
          nombreVariable: "cliente_nombre",
          validacion: { tipo: "texto", opciones: [], mensajeError: "Ingresa tu nombre" },
          intentosMaximos: 3
        },
        {
          orden: 8,
          tipo: "recopilar",
          nombre: "Teléfono",
          pregunta: "📱 ¿Tu teléfono? (con código de área)",
          nombreVariable: "cliente_telefono",
          validacion: { tipo: "texto", opciones: [], mensajeError: "Ingresa un teléfono válido" },
          intentosMaximos: 3
        },
        {
          orden: 9,
          tipo: "recopilar",
          nombre: "Email",
          pregunta: "📧 ¿Tu email?",
          nombreVariable: "cliente_email",
          validacion: { tipo: "email", opciones: [], mensajeError: "Ingresa un email válido" },
          intentosMaximos: 3
        },
        {
          orden: 10,
          tipo: "confirmacion",
          nombre: "Confirmar",
          pregunta: "📋 *CONFIRMA*\n\n🎾 {{deporte_id_nombre}}\n📅 {{fecha}} {{hora_inicio}}\n👤 {{cliente_nombre}}\n\n¿Confirmas?",
          nombreVariable: "confirmacion",
          validacion: { tipo: "opcion", opciones: ["1: Sí", "2: No"], mensajeError: "Selecciona 1 o 2" },
          intentosMaximos: 3
        },
        {
          orden: 11,
          tipo: "consulta_filtrada",
          nombre: "Crear Reserva",
          nombreVariable: "reserva_creada",
          endpointId: endpointCrearReserva?.id,
          mapeoParametros: {
            cancha_id: "cancha_id",
            fecha: "fecha",
            hora_inicio: "hora_inicio",
            duracion: "duracion",
            "cliente.nombre": "cliente_nombre",
            "cliente.telefono": "cliente_telefono",
            "cliente.email": "cliente_email"
          },
          intentosMaximos: 3
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Actualizar directamente con $set
    const resultado = await collection.updateOne(
      { _id: api._id },
      { $set: { workflows: [workflowNuevo] } }
    );

    console.log('\n✅ ACTUALIZACIÓN DIRECTA COMPLETADA');
    console.log('   Documentos modificados:', resultado.modifiedCount);

    // Verificar
    const apiVerificacion = await collection.findOne({ _id: api._id });
    console.log('\n🔍 VERIFICACIÓN:');
    console.log('   Workflows:', apiVerificacion.workflows?.length || 0);
    if (apiVerificacion.workflows && apiVerificacion.workflows.length > 0) {
      apiVerificacion.workflows.forEach(wf => {
        console.log(`   - ${wf.nombre}`);
        console.log(`     ID: ${wf.id}`);
        console.log(`     Prioridad: ${wf.prioridad}`);
        console.log(`     Pasos: ${wf.steps?.length || 0}`);
      });
    }

    console.log('\n✅ LISTO - Reinicia el backend');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

reemplazarWorkflow();
