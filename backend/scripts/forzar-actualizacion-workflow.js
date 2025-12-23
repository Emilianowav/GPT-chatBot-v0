import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const apiConfigSchema = new mongoose.Schema({}, { strict: false });
const ApiConfiguration = mongoose.model('ApiConfiguration', apiConfigSchema, 'api_configurations');

async function forzarActualizacion() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const api = await ApiConfiguration.findOne({ 
      nombre: /Mis Canchas/i 
    });

    if (!api) {
      console.error('❌ No se encontró la API');
      process.exit(1);
    }

    console.log('📋 API encontrada:', api.nombre);
    console.log('🔍 Workflows antes de limpiar:', api.workflows?.length || 0);

    // Limpiar TODOS los workflows
    api.workflows = [];
    api.markModified('workflows');
    await api.save();

    console.log('✅ Todos los workflows eliminados');

    // Recargar el documento
    const apiActualizada = await ApiConfiguration.findById(api._id);
    
    console.log('🔍 Workflows después de limpiar:', apiActualizada.workflows?.length || 0);

    // Buscar endpoints
    const endpointDeportes = apiActualizada.endpoints.find(ep => 
      ep.nombre.toLowerCase().includes('deporte')
    );
    const endpointDisponibilidad = apiActualizada.endpoints.find(ep => 
      ep.nombre.toLowerCase().includes('disponibilidad')
    );
    const endpointCrearReserva = apiActualizada.endpoints.find(ep => 
      ep.path && (ep.path.includes('booking') || ep.path === '/bookings')
    );

    console.log('\n📍 Endpoints encontrados:');
    console.log('   - Deportes:', endpointDeportes?.id);
    console.log('   - Disponibilidad:', endpointDisponibilidad?.id);
    console.log('   - Crear Reserva:', endpointCrearReserva?.id);

    // Crear el workflow nuevo
    const workflowNuevo = {
      id: "workflow-juventus-reservas-correcto",
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
          descripcion: "Usuario selecciona el deporte",
          pregunta: "⚽ ¿Qué deporte querés jugar?",
          nombreVariable: "deporte_id",
          validacion: {
            tipo: "opcion",
            opciones: [],
            mensajeError: "Por favor selecciona un deporte válido"
          },
          endpointId: endpointDeportes?.id,
          endpointResponseConfig: {
            arrayPath: "deportes",
            idField: "id",
            displayField: "nombre"
          },
          intentosMaximos: 3
        },
        {
          orden: 2,
          tipo: "recopilar",
          nombre: "Ingresar Fecha",
          descripcion: "Usuario ingresa la fecha",
          pregunta: "📅 ¿Para qué fecha querés reservar?\n\nEscribí la fecha en formato DD/MM/AAAA\no escribí \"hoy\" o \"mañana\"",
          nombreVariable: "fecha",
          validacion: {
            tipo: "fecha",
            opciones: [],
            mensajeError: "Por favor ingresa una fecha válida"
          },
          intentosMaximos: 3
        },
        {
          orden: 3,
          tipo: "recopilar",
          nombre: "Seleccionar Duración",
          descripcion: "Usuario selecciona duración",
          pregunta: "⏱️ ¿Cuánto tiempo querés jugar?",
          nombreVariable: "duracion",
          validacion: {
            tipo: "opcion",
            opciones: [
              "60: 1 hora (60 min)",
              "90: 1 hora y media (90 min)",
              "120: 2 horas (120 min)"
            ],
            mensajeError: "Por favor selecciona una duración válida"
          },
          intentosMaximos: 3
        },
        {
          orden: 4,
          tipo: "recopilar",
          nombre: "Ingresar Hora",
          descripcion: "Usuario ingresa hora",
          pregunta: "🕐 ¿A qué hora preferís jugar?\n\nEscribí la hora en formato 24hs (ej: 19:00)",
          nombreVariable: "hora_inicio",
          validacion: {
            tipo: "texto",
            opciones: [],
            mensajeError: "Por favor ingresa una hora válida"
          },
          intentosMaximos: 3
        },
        {
          orden: 5,
          tipo: "consulta_filtrada",
          nombre: "Consultar Disponibilidad",
          descripcion: "Busca canchas disponibles",
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
          descripcion: "Usuario selecciona cancha",
          pregunta: "🎾 Canchas disponibles:\n\n¿Cuál querés reservar?",
          nombreVariable: "cancha_id",
          validacion: {
            tipo: "opcion",
            opciones: [],
            mensajeError: "Por favor selecciona una cancha válida"
          },
          endpointResponseConfig: {
            arrayPath: "canchas_disponibles",
            idField: "id",
            displayField: "nombre"
          },
          intentosMaximos: 3
        },
        {
          orden: 7,
          tipo: "recopilar",
          nombre: "Nombre del Cliente",
          descripcion: "Usuario ingresa nombre",
          pregunta: "👤 ¿Cuál es tu nombre completo?",
          nombreVariable: "cliente_nombre",
          validacion: {
            tipo: "texto",
            opciones: [],
            mensajeError: "Por favor ingresa tu nombre"
          },
          intentosMaximos: 3
        },
        {
          orden: 8,
          tipo: "recopilar",
          nombre: "Teléfono del Cliente",
          descripcion: "Usuario ingresa teléfono",
          pregunta: "📱 ¿Cuál es tu teléfono? (con código de área)",
          nombreVariable: "cliente_telefono",
          validacion: {
            tipo: "texto",
            opciones: [],
            mensajeError: "Por favor ingresa un teléfono válido"
          },
          intentosMaximos: 3
        },
        {
          orden: 9,
          tipo: "recopilar",
          nombre: "Email del Cliente",
          descripcion: "Usuario ingresa email",
          pregunta: "📧 ¿Cuál es tu email?",
          nombreVariable: "cliente_email",
          validacion: {
            tipo: "email",
            opciones: [],
            mensajeError: "Por favor ingresa un email válido"
          },
          intentosMaximos: 3
        },
        {
          orden: 10,
          tipo: "confirmacion",
          nombre: "Confirmar Reserva",
          descripcion: "Usuario confirma datos",
          pregunta: "📋 *CONFIRMA TU RESERVA*\n\n🎾 Deporte: {{deporte_id_nombre}}\n📅 Fecha: {{fecha}}\n⏱️ Duración: {{duracion}} min\n🕐 Hora: {{hora_inicio}}\n🏟️ Cancha: {{cancha_id_nombre}}\n\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n📧 Email: {{cliente_email}}\n\n¿Confirmas?",
          nombreVariable: "confirmacion",
          validacion: {
            tipo: "opcion",
            opciones: [
              "1: Confirmar",
              "2: Cancelar"
            ],
            mensajeError: "Por favor selecciona 1 o 2"
          },
          intentosMaximos: 3
        },
        {
          orden: 11,
          tipo: "consulta_filtrada",
          nombre: "Crear Reserva",
          descripcion: "Crea la reserva",
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
      respuestaTemplate: "✅ *¡Reserva creada!*\n\n📋 Resumen:\n🎾 {{cancha_id_nombre}}\n📅 {{fecha}} - {{hora_inicio}}\n\n💰 Total: ${{reserva_creada.precio_total}}",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    apiActualizada.workflows = [workflowNuevo];
    apiActualizada.markModified('workflows');
    await apiActualizada.save();

    console.log('\n✅ WORKFLOW NUEVO CREADO');
    console.log('📋 Nombre:', workflowNuevo.nombre);
    console.log('🆔 ID:', workflowNuevo.id);
    console.log('🎯 Prioridad:', workflowNuevo.prioridad);
    console.log('📝 Pasos:', workflowNuevo.steps.length);

    // Verificar
    const apiVerificacion = await ApiConfiguration.findById(api._id);
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    console.log('   Workflows en DB:', apiVerificacion.workflows?.length || 0);
    if (apiVerificacion.workflows && apiVerificacion.workflows.length > 0) {
      apiVerificacion.workflows.forEach(wf => {
        console.log(`   - ${wf.nombre} (ID: ${wf.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

forzarActualizacion();
