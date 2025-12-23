import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const apiConfigSchema = new mongoose.Schema({}, { strict: false });
const ApiConfiguration = mongoose.model('ApiConfiguration', apiConfigSchema, 'api_configurations');

async function createWorkflowJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const api = await ApiConfiguration.findOne({ 
      nombre: /Mis Canchas/i 
    });

    if (!api) {
      console.error('❌ No se encontró la API de Mis Canchas');
      process.exit(1);
    }

    console.log('📋 API encontrada:', api.nombre);

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

    console.log('📍 Endpoints:');
    console.log('   - Deportes:', endpointDeportes?.id);
    console.log('   - Disponibilidad:', endpointDisponibilidad?.id);
    console.log('   - Crear Reserva:', endpointCrearReserva?.id);

    // Crear workflow con estructura correcta
    const workflow = {
      id: "workflow-juventus-reservas-correcto",
      nombre: "Juventus - Reserva de Canchas",
      descripcion: "Flujo completo para reservar canchas con consulta de disponibilidad",
      activo: true,
      trigger: {
        tipo: "keyword",
        keywords: [
          "reservar",
          "turno",
          "cancha",
          "reserva",
          "quiero reservar"
        ],
        primeraRespuesta: false
      },
      prioridad: 25,
      mensajeInicial: "¡Hola! 👋\nBienvenido a Club Juventus 🎾\n\nTe ayudo a reservar tu cancha en pocos pasos.",
      mensajeFinal: "✅ ¡Reserva completada! Te enviamos el link de pago.",
      mensajeAbandonar: "🚫 Reserva cancelada. Escribí 'reservar' cuando quieras volver a intentar.",
      permitirAbandonar: true,
      timeoutMinutos: 15,
      repetirWorkflow: {
        habilitado: true,
        desdePaso: 1,
        variablesALimpiar: [
          "deporte_id",
          "fecha",
          "duracion",
          "hora_inicio",
          "canchas_disponibles",
          "cancha_id",
          "confirmacion"
        ],
        pregunta: "¿Querés hacer otra reserva?",
        opcionRepetir: "Sí, hacer otra reserva 🎾",
        opcionFinalizar: "No, gracias 👋"
      },
      steps: [
        // PASO 1: Seleccionar Deporte
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

        // PASO 2: Ingresar Fecha
        {
          orden: 2,
          tipo: "recopilar",
          nombre: "Ingresar Fecha",
          descripcion: "Usuario ingresa la fecha deseada",
          pregunta: "📅 ¿Para qué fecha querés reservar?\n\nEscribí la fecha en formato DD/MM/AAAA\no escribí \"hoy\" o \"mañana\"",
          nombreVariable: "fecha",
          validacion: {
            tipo: "fecha",
            opciones: [],
            mensajeError: "Por favor ingresa una fecha válida (hoy o hasta 30 días adelante)"
          },
          intentosMaximos: 3
        },

        // PASO 3: Seleccionar Duración
        {
          orden: 3,
          tipo: "recopilar",
          nombre: "Seleccionar Duración",
          descripcion: "Usuario selecciona duración del partido",
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

        // PASO 4: Ingresar Hora
        {
          orden: 4,
          tipo: "recopilar",
          nombre: "Ingresar Hora",
          descripcion: "Usuario ingresa hora preferida",
          pregunta: "🕐 ¿A qué hora preferís jugar?\n\nEscribí la hora en formato 24hs (ej: 19:00)",
          nombreVariable: "hora_inicio",
          validacion: {
            tipo: "texto",
            opciones: [],
            mensajeError: "Por favor ingresa una hora válida (ej: 19:00)"
          },
          intentosMaximos: 3
        },

        // PASO 5: Consultar Disponibilidad
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

        // PASO 6: Seleccionar Cancha
        {
          orden: 6,
          tipo: "recopilar",
          nombre: "Seleccionar Cancha",
          descripcion: "Usuario selecciona una cancha disponible",
          pregunta: "🎾 *Canchas disponibles:*\n\n{{#canchas_disponibles}}\n{{numero}}. *{{nombre}}* - {{tipo}}\n   💰 ${{precio_hora}}/hora\n   ⏰ Horarios: {{horarios_disponibles}}\n\n{{/canchas_disponibles}}\n\n¿Cuál cancha querés reservar?",
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

        // PASO 7: Ingresar Nombre
        {
          orden: 7,
          tipo: "recopilar",
          nombre: "Nombre del Cliente",
          descripcion: "Usuario ingresa su nombre completo",
          pregunta: "👤 ¿Cuál es tu nombre completo?",
          nombreVariable: "cliente_nombre",
          validacion: {
            tipo: "texto",
            opciones: [],
            mensajeError: "Por favor ingresa tu nombre completo"
          },
          intentosMaximos: 3
        },

        // PASO 8: Ingresar Teléfono
        {
          orden: 8,
          tipo: "recopilar",
          nombre: "Teléfono del Cliente",
          descripcion: "Usuario ingresa su teléfono",
          pregunta: "📱 ¿Cuál es tu número de teléfono?\n\n(Con código de área, ej: 3794123456)",
          nombreVariable: "cliente_telefono",
          validacion: {
            tipo: "texto",
            opciones: [],
            mensajeError: "Por favor ingresa un teléfono válido"
          },
          intentosMaximos: 3
        },

        // PASO 9: Ingresar Email
        {
          orden: 9,
          tipo: "recopilar",
          nombre: "Email del Cliente",
          descripcion: "Usuario ingresa su email",
          pregunta: "📧 ¿Cuál es tu email?",
          nombreVariable: "cliente_email",
          validacion: {
            tipo: "email",
            opciones: [],
            mensajeError: "Por favor ingresa un email válido"
          },
          intentosMaximos: 3
        },

        // PASO 10: Confirmar Datos
        {
          orden: 10,
          tipo: "confirmacion",
          nombre: "Confirmar Reserva",
          descripcion: "Usuario confirma todos los datos",
          pregunta: "📋 *CONFIRMA TU RESERVA*\n\n🎾 *Deporte:* {{deporte_id_nombre}}\n📅 *Fecha:* {{fecha}}\n⏱️ *Duración:* {{duracion}} min\n🕐 *Hora:* {{hora_inicio}}\n🏟️ *Cancha:* {{cancha_id_nombre}}\n\n👤 *Nombre:* {{cliente_nombre}}\n📱 *Teléfono:* {{cliente_telefono}}\n📧 *Email:* {{cliente_email}}\n\n¿Los datos son correctos?\n\n1️⃣ Confirmar y crear reserva\n2️⃣ Cambiar datos\n3️⃣ Cancelar",
          nombreVariable: "confirmacion",
          validacion: {
            tipo: "opcion",
            opciones: [
              "1: Confirmar y crear reserva",
              "2: Cambiar datos",
              "3: Cancelar"
            ],
            mensajeError: "Por favor selecciona una opción válida (1-3)"
          },
          intentosMaximos: 3
        },

        // PASO 11: Crear Reserva
        {
          orden: 11,
          tipo: "consulta_filtrada",
          nombre: "Crear Reserva",
          descripcion: "Crea la reserva en el sistema",
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
      respuestaTemplate: "✅ *¡Reserva creada exitosamente!*\n\n📋 *Resumen:*\n🎾 Cancha: {{cancha_id_nombre}}\n📅 Fecha: {{fecha}}\n⏰ Hora: {{hora_inicio}}\n⏱️ Duración: {{duracion}} min\n\n💰 Total: ${{reserva_creada.precio_total}}\n💵 Seña requerida: ${{reserva_creada.seña}}\n\n🔗 Link de pago:\n{{reserva_creada.link_pago}}\n\n⏰ Tenés 10 minutos para completar el pago.",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Eliminar workflows anteriores de Juventus
    if (!api.workflows) {
      api.workflows = [];
    }

    api.workflows = api.workflows.filter(w => 
      !w.nombre.toLowerCase().includes('juventus') && 
      !w.nombre.toLowerCase().includes('reserva')
    );

    // Agregar nuevo workflow
    api.workflows.push(workflow);
    api.markModified('workflows');
    
    await api.save();

    console.log('\n✅ WORKFLOW CREADO CON ESTRUCTURA CORRECTA!');
    console.log('📋 Nombre:', workflow.nombre);
    console.log('🆔 ID:', workflow.id);
    console.log('📝 Pasos:', workflow.steps.length);
    console.log('🎯 Keywords:', workflow.trigger.keywords.join(', '));
    console.log('\n🔥 PASOS:');
    workflow.steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.tipo.toUpperCase()}: ${step.nombre}`);
    });

    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('   1. Reiniciar el backend');
    console.log('   2. Probar desde WhatsApp con: "quiero reservar"');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

createWorkflowJuventus();
