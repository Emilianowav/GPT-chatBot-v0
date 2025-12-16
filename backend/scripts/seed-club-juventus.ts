/**
 * 🏟️ Script COMPLETO para configurar Club Juventus
 * - Crea 4 canchas de padel (agentes)
 * - Configura el módulo de calendario
 * - Activa el bot de pasos
 * 
 * Ejecutar con: node --loader ts-node/esm scripts/seed-club-juventus.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const EMPRESA_ID = 'Club Juventus';

const configuracionClubJuventus = {
  empresaId: "Club Juventus",
  tipoNegocio: "canchas",
  activo: true,
  
  // Nomenclatura personalizada para canchas
  nomenclatura: {
    turno: "Reserva",
    turnos: "Reservas",
    agente: "Cancha",
    agentes: "Canchas",
    cliente: "Jugador",
    clientes: "Jugadores",
    recurso: "Cancha",
    recursos: "Canchas"
  },
  
  // Campos personalizados para reservas de canchas
  camposPersonalizados: [
    {
      clave: "tipo_cancha",
      etiqueta: "Tipo de cancha",
      tipo: "select",
      requerido: true,
      opciones: ["Fútbol 5", "Fútbol 7", "Fútbol 11", "Tenis", "Paddle", "Básquet"],
      orden: 1,
      mostrarEnLista: true,
      mostrarEnCalendario: true,
      usarEnNotificacion: true
    },
    {
      clave: "superficie",
      etiqueta: "Superficie",
      tipo: "select",
      requerido: false,
      opciones: ["Césped sintético", "Césped natural", "Techada", "Cemento"],
      orden: 2,
      mostrarEnLista: true,
      mostrarEnCalendario: false,
      usarEnNotificacion: false
    },
    {
      clave: "cantidad_jugadores",
      etiqueta: "Cantidad de jugadores",
      tipo: "numero",
      requerido: false,
      valorPorDefecto: 10,
      orden: 3,
      mostrarEnLista: false,
      mostrarEnCalendario: false,
      usarEnNotificacion: false,
      validacion: {
        min: 2,
        max: 22,
        mensaje: "Debe ser entre 2 y 22 jugadores"
      }
    }
  ],
  
  // Configuración de turnos
  usaAgentes: true,           // Las canchas son los "agentes"
  agenteRequerido: true,
  usaRecursos: false,
  recursoRequerido: false,
  usaHorariosDisponibilidad: true,
  duracionPorDefecto: 60,     // 1 hora por defecto
  permiteDuracionVariable: true,
  
  // Configuración del chatbot
  chatbotActivo: true,
  chatbotPuedeCrear: true,
  chatbotPuedeModificar: true,
  chatbotPuedeCancelar: true,
  
  requiereConfirmacion: false,
  notificaciones: [],
  estadosPersonalizados: [],
  
  // 💬 MENSAJES DEL FLUJO DE RESERVA DE CANCHAS
  mensajesFlujo: {
    reserva_canchas: {
      bienvenida: {
        mensaje: "¡Hola! 👋\nBienvenido a *{nombre_empresa}* ⚽🎾\nTe ayudo a reservar tu cancha en pocos pasos."
      },
      solicitar_fecha: {
        mensaje: "📅 ¿Para qué fecha querés reservar?\n\nEscribí la fecha en formato:\nDD/MM/AAAA"
      },
      fecha_confirmada: {
        mensaje: "Perfecto 👍\nFecha seleccionada: *{fecha}*"
      },
      solicitar_hora: {
        mensaje: "⏰ ¿A qué hora te gustaría comenzar?\n\nEscribí la hora en formato 24 hs:\nHH:MM"
      },
      solicitar_duracion: {
        mensaje: "⏳ ¿Cuánto tiempo querés reservar?\n\nEscribí el número de la opción.",
        opciones: [
          { id: "60", texto: "1 hora", descripcion: "60 minutos" },
          { id: "90", texto: "1 hora 30 minutos", descripcion: "90 minutos" },
          { id: "120", texto: "2 horas", descripcion: "120 minutos" }
        ]
      },
      sin_disponibilidad: {
        mensaje: "⚠️ No tenemos disponibilidad de *{duracion}* comenzando a las *{hora}* el *{fecha}*.\n\nPero puedo ofrecerte estas alternativas 👇\n\nEscribí el número de la opción que prefieras.",
        opciones: [
          { id: "alternativa_1", texto: "Horario alternativo 1", descripcion: "Ver primera alternativa disponible" },
          { id: "alternativa_2", texto: "Horario alternativo 2", descripcion: "Ver segunda alternativa disponible" },
          { id: "cambiar_duracion", texto: "Cambiar duración", descripcion: "Elegir otra duración" },
          { id: "cambiar_fecha", texto: "Cambiar fecha", descripcion: "Elegir otra fecha" }
        ]
      },
      horario_alternativo_confirmado: {
        mensaje: "Perfecto 🙌\nHorario seleccionado: *{hora_inicio} a {hora_fin}*"
      },
      mostrar_canchas: {
        mensaje: "🏟️ Estas son las canchas disponibles el *{fecha}*\n🕒 de *{hora_inicio} a {hora_fin}*:\n\nEscribí el número de la cancha que quieras reservar.",
        opciones: []  // Se llenan dinámicamente
      },
      cancha_seleccionada: {
        mensaje: "Excelente ⚽\nSeleccionaste: *{cancha}*"
      },
      solicitar_nombre: {
        mensaje: "👤 Para finalizar, necesito tus datos.\n\n✍️ Escribí tu nombre y apellido:"
      },
      solicitar_telefono: {
        mensaje: "📞 Escribí tu número de teléfono:"
      },
      resumen_reserva: {
        mensaje: "✅ Revisá tu reserva:\n\n📅 Fecha: {fecha}\n🕒 Horario: {hora_inicio} a {hora_fin}\n⏳ Duración: {duracion}\n🏟️ Cancha: {cancha}\n👤 Cliente: {nombre_cliente}\n📞 Teléfono: {telefono}\n\n¿Confirmamos la reserva?",
        opciones: [
          { id: "confirmar", texto: "Sí, confirmar", descripcion: "Confirmar la reserva" },
          { id: "modificar", texto: "Modificar algo", descripcion: "Cambiar algún dato" },
          { id: "cancelar", texto: "Cancelar", descripcion: "Cancelar la reserva" }
        ]
      },
      reserva_confirmada: {
        mensaje: "🎉 ¡Reserva confirmada!\n\nTe esperamos el *{fecha}* a las *{hora_inicio}*\nen *{cancha}* ⚽\n\n¡Gracias por reservar con nosotros!"
      },
      reserva_cancelada: {
        mensaje: "Tu reserva ha sido cancelada.\nSi necesitas hacer otra reserva, escribinos cuando quieras."
      },
      error: {
        mensaje: "Hubo un problema procesando tu solicitud. Por favor, intentá nuevamente o contactanos directamente."
      }
    },
    // Flujo de confirmación de turnos (para notificaciones)
    confirmacion_turnos: {
      esperando_confirmacion: {
        mensaje: "¿Qué deseas hacer con tu {turno}?",
        botones: [
          { id: "confirmar", texto: "Confirmar" },
          { id: "modificar", texto: "Modificar" },
          { id: "cancelar", texto: "Cancelar" }
        ]
      },
      confirmado: {
        mensaje: "✅ ¡Perfecto! Tu {turno} ha sido confirmada para el {fecha} a las {hora}. ¡Te esperamos!"
      },
      cancelado: {
        mensaje: "Tu {turno} del {fecha} a las {hora} ha sido cancelada. Si necesitas reprogramar, escribinos."
      },
      modificado: {
        mensaje: "Para modificar tu {turno}, por favor indicame:\n1. Nueva fecha\n2. Nueva hora\n3. Otro detalle a cambiar"
      },
      error: {
        mensaje: "Hubo un problema procesando tu solicitud. Por favor, intentá nuevamente o contactanos."
      }
    },
    // Menú principal
    menu_principal: {
      bienvenida: {
        mensaje: "¡Hola! Soy el asistente de {nombre_empresa}. ¿En qué puedo ayudarte?",
        opciones: [
          { id: "reservar", texto: "Reservar cancha", descripcion: "Agenda una nueva reserva" },
          { id: "consultar", texto: "Consultar reserva", descripcion: "Ver tus reservas programadas" },
          { id: "cancelar", texto: "Cancelar reserva", descripcion: "Cancelar una reserva existente" },
          { id: "otro", texto: "Otra consulta", descripcion: "Hablar con un asesor" }
        ]
      },
      opcion_invalida: {
        mensaje: "No entendí tu opción. Por favor, seleccioná una de las opciones del menú."
      }
    }
  },
  
  // Variables dinámicas
  variablesDinamicas: {
    nombre_empresa: "Club Juventus",
    nomenclatura_turno: "Reserva",
    nomenclatura_turnos: "Reservas",
    nomenclatura_agente: "Cancha",
    nomenclatura_agentes: "Canchas",
    zona_horaria: "America/Argentina/Buenos_Aires",
    moneda: "ARS",
    idioma: "es"
  },
  
  creadoEn: new Date(),
  actualizadoEn: new Date()
};

async function seedClubJuventus() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const collection = mongoose.connection.collection('configuraciones_modulo');
    
    // Verificar si ya existe
    const existing = await collection.findOne({ empresaId: "Club Juventus" });
    
    if (existing) {
      console.log('⚠️ Ya existe configuración para Club Juventus. Actualizando...');
      await collection.updateOne(
        { empresaId: "Club Juventus" },
        { $set: { ...configuracionClubJuventus, actualizadoEn: new Date() } }
      );
      console.log('✅ Configuración actualizada');
    } else {
      console.log('📝 Insertando nueva configuración...');
      await collection.insertOne(configuracionClubJuventus);
      console.log('✅ Configuración insertada');
    }
    
    // Mostrar resultado
    const result = await collection.findOne({ empresaId: "Club Juventus" });
    console.log('\n📋 Configuración guardada:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

seedClubJuventus();
