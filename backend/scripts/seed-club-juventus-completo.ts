/**
 * 🏟️ Script COMPLETO para configurar Club Juventus
 * - Crea 4 canchas de padel (agentes)
 * - Configura el módulo de calendario
 * - Activa el bot de pasos
 * 
 * Ejecutar con: node --loader ts-node/esm scripts/seed-club-juventus-completo.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const EMPRESA_ID = 'Club Juventus';

// ============================================================================
// 1. CANCHAS (Agentes) - 4 canchas de padel
// ============================================================================
const canchas = [
  {
    empresaId: EMPRESA_ID,
    nombre: 'Cancha',
    apellido: 'Central',
    email: 'central@clubjuventus.com',
    telefono: '',
    especialidad: 'Padel',
    descripcion: 'Cancha central de padel - Techada',
    modoAtencion: 'turnos_programados',
    disponibilidad: [
      // Lunes a Domingo, 8:00 a 23:00
      { diaSemana: 0, horaInicio: '08:00', horaFin: '23:00', activo: true }, // Domingo
      { diaSemana: 1, horaInicio: '08:00', horaFin: '23:00', activo: true }, // Lunes
      { diaSemana: 2, horaInicio: '08:00', horaFin: '23:00', activo: true }, // Martes
      { diaSemana: 3, horaInicio: '08:00', horaFin: '23:00', activo: true }, // Miércoles
      { diaSemana: 4, horaInicio: '08:00', horaFin: '23:00', activo: true }, // Jueves
      { diaSemana: 5, horaInicio: '08:00', horaFin: '23:00', activo: true }, // Viernes
      { diaSemana: 6, horaInicio: '08:00', horaFin: '23:00', activo: true }, // Sábado
    ],
    duracionTurnoPorDefecto: 60,
    bufferEntreturnos: 0,
    activo: true
  },
  {
    empresaId: EMPRESA_ID,
    nombre: 'Cancha',
    apellido: 'Este',
    email: 'este@clubjuventus.com',
    telefono: '',
    especialidad: 'Padel',
    descripcion: 'Cancha este de padel - Al aire libre',
    modoAtencion: 'turnos_programados',
    disponibilidad: [
      { diaSemana: 0, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 1, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 2, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 3, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 4, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 5, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 6, horaInicio: '08:00', horaFin: '23:00', activo: true },
    ],
    duracionTurnoPorDefecto: 60,
    bufferEntreturnos: 0,
    activo: true
  },
  {
    empresaId: EMPRESA_ID,
    nombre: 'Cancha',
    apellido: 'Norte',
    email: 'norte@clubjuventus.com',
    telefono: '',
    especialidad: 'Padel',
    descripcion: 'Cancha norte de padel - Techada',
    modoAtencion: 'turnos_programados',
    disponibilidad: [
      { diaSemana: 0, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 1, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 2, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 3, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 4, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 5, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 6, horaInicio: '08:00', horaFin: '23:00', activo: true },
    ],
    duracionTurnoPorDefecto: 60,
    bufferEntreturnos: 0,
    activo: true
  },
  {
    empresaId: EMPRESA_ID,
    nombre: 'Cancha',
    apellido: 'Sur',
    email: 'sur@clubjuventus.com',
    telefono: '',
    especialidad: 'Padel',
    descripcion: 'Cancha sur de padel - Al aire libre',
    modoAtencion: 'turnos_programados',
    disponibilidad: [
      { diaSemana: 0, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 1, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 2, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 3, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 4, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 5, horaInicio: '08:00', horaFin: '23:00', activo: true },
      { diaSemana: 6, horaInicio: '08:00', horaFin: '23:00', activo: true },
    ],
    duracionTurnoPorDefecto: 60,
    bufferEntreturnos: 0,
    activo: true
  }
];

// ============================================================================
// 2. CONFIGURACIÓN DEL MÓDULO (configuraciones_modulo)
// ============================================================================
const configuracionModulo = {
  empresaId: EMPRESA_ID,
  tipoNegocio: 'canchas',
  activo: true,
  
  nomenclatura: {
    turno: 'Reserva',
    turnos: 'Reservas',
    agente: 'Cancha',
    agentes: 'Canchas',
    cliente: 'Jugador',
    clientes: 'Jugadores',
    recurso: 'Cancha',
    recursos: 'Canchas'
  },
  
  camposPersonalizados: [
    {
      clave: 'tipo_cancha',
      etiqueta: 'Tipo de cancha',
      tipo: 'select',
      requerido: false,
      opciones: ['Padel', 'Fútbol 5', 'Tenis'],
      orden: 1,
      mostrarEnLista: true,
      mostrarEnCalendario: true,
      usarEnNotificacion: true
    }
  ],
  
  usaAgentes: true,
  agenteRequerido: true,
  usaRecursos: false,
  recursoRequerido: false,
  usaHorariosDisponibilidad: true,
  duracionPorDefecto: 60,
  permiteDuracionVariable: true,
  
  chatbotActivo: true,
  chatbotPuedeCrear: true,
  chatbotPuedeModificar: true,
  chatbotPuedeCancelar: true,
  
  requiereConfirmacion: false,
  notificaciones: [],
  estadosPersonalizados: [],
  
  mensajesFlujo: {
    reserva_canchas: {
      bienvenida: {
        mensaje: '¡Hola! 👋\nBienvenido a *Club Juventus* 🎾\nTe ayudo a reservar tu cancha en pocos pasos.'
      },
      solicitar_fecha: {
        mensaje: '📅 ¿Para qué fecha querés reservar?\n\nEscribí la fecha en formato:\nDD/MM/AAAA'
      },
      fecha_confirmada: {
        mensaje: 'Perfecto 👍\nFecha seleccionada: *{fecha}*'
      },
      solicitar_hora: {
        mensaje: '⏰ ¿A qué hora te gustaría comenzar?\n\nEscribí la hora en formato 24 hs:\nHH:MM\n\nHorario: 08:00 a 23:00'
      },
      solicitar_duracion: {
        mensaje: '⏳ ¿Cuánto tiempo querés reservar?\n\n1️⃣ 1 hora\n2️⃣ 1 hora 30 minutos\n3️⃣ 2 horas',
        opciones: [
          { id: '60', texto: '1 hora', descripcion: '60 minutos' },
          { id: '90', texto: '1 hora 30 min', descripcion: '90 minutos' },
          { id: '120', texto: '2 horas', descripcion: '120 minutos' }
        ]
      },
      sin_disponibilidad: {
        mensaje: '⚠️ No hay disponibilidad para ese horario.\n\n¿Qué querés hacer?\n\n1️⃣ Cambiar fecha\n2️⃣ Cambiar hora\n3️⃣ Cancelar'
      },
      mostrar_canchas: {
        mensaje: '🏟️ Canchas disponibles:\n\nEscribí el número de la cancha.',
        opciones: []
      },
      cancha_seleccionada: {
        mensaje: 'Excelente 🎾\nSeleccionaste: *{cancha}*'
      },
      solicitar_nombre: {
        mensaje: '👤 Para finalizar, necesito tus datos.\n\n✍️ Escribí tu nombre y apellido:'
      },
      solicitar_telefono: {
        mensaje: '📞 Escribí tu número de teléfono:'
      },
      resumen_reserva: {
        mensaje: '✅ Revisá tu reserva:\n\n📅 Fecha: {fecha}\n🕒 Horario: {hora_inicio} a {hora_fin}\n⏳ Duración: {duracion}\n🏟️ Cancha: {cancha}\n👤 Cliente: {nombre_cliente}\n📞 Teléfono: {telefono}\n\n¿Confirmamos?',
        opciones: [
          { id: 'confirmar', texto: 'Sí, confirmar', descripcion: 'Confirmar reserva' },
          { id: 'modificar', texto: 'Modificar', descripcion: 'Cambiar algo' },
          { id: 'cancelar', texto: 'Cancelar', descripcion: 'Cancelar' }
        ]
      },
      reserva_confirmada: {
        mensaje: '🎉 ¡Reserva confirmada!\n\nTe esperamos el *{fecha}* a las *{hora_inicio}*\nen *{cancha}* 🎾\n\n¡Gracias por reservar!'
      },
      reserva_cancelada: {
        mensaje: 'Reserva cancelada. Si querés hacer otra, escribí "reservar".'
      },
      error: {
        mensaje: 'Hubo un problema. Por favor, intentá de nuevo.'
      }
    },
    confirmacion_turnos: {
      esperando_confirmacion: {
        mensaje: '¿Qué deseas hacer con tu reserva?',
        botones: [
          { id: 'confirmar', texto: 'Confirmar' },
          { id: 'modificar', texto: 'Modificar' },
          { id: 'cancelar', texto: 'Cancelar' }
        ]
      },
      confirmado: {
        mensaje: '✅ Tu reserva ha sido confirmada para el {fecha} a las {hora}. ¡Te esperamos!'
      },
      cancelado: {
        mensaje: 'Tu reserva del {fecha} a las {hora} ha sido cancelada.'
      },
      modificado: {
        mensaje: 'Para modificar tu reserva, indicame:\n1. Nueva fecha\n2. Nueva hora'
      },
      error: {
        mensaje: 'Hubo un problema. Por favor, intentá de nuevo.'
      }
    },
    menu_principal: {
      bienvenida: {
        mensaje: '¡Hola! Soy el asistente de Club Juventus. ¿En qué puedo ayudarte?',
        opciones: [
          { id: 'reservar', texto: 'Reservar cancha', descripcion: 'Nueva reserva' },
          { id: 'consultar', texto: 'Mis reservas', descripcion: 'Ver reservas' },
          { id: 'cancelar', texto: 'Cancelar reserva', descripcion: 'Cancelar' },
          { id: 'otro', texto: 'Otra consulta', descripcion: 'Hablar con alguien' }
        ]
      },
      opcion_invalida: {
        mensaje: 'No entendí. Por favor, elegí una opción del menú.'
      }
    }
  },
  
  variablesDinamicas: {
    nombre_empresa: 'Club Juventus',
    nomenclatura_turno: 'Reserva',
    nomenclatura_turnos: 'Reservas',
    nomenclatura_agente: 'Cancha',
    nomenclatura_agentes: 'Canchas',
    zona_horaria: 'America/Argentina/Buenos_Aires',
    moneda: 'ARS',
    idioma: 'es'
  }
};

// ============================================================================
// 3. CONFIGURACIÓN DEL BOT (configuraciones_bot) - Activa el bot de pasos
// ============================================================================
const configuracionBot = {
  empresaId: EMPRESA_ID,
  activo: true,  // ⚠️ IMPORTANTE: Esto activa el bot de pasos
  
  mensajeBienvenida: `¡Hola! 👋
Bienvenido a *Club Juventus* 🎾

Te ayudo a reservar tu cancha en pocos pasos.

📅 *¿Para qué fecha querés reservar?*

Escribí la fecha en formato DD/MM/AAAA
o escribí "hoy" o "mañana"`,
  
  mensajeDespedida: '¡Hasta pronto! 👋 Si necesitás algo más, escribime.',
  mensajeError: '❌ No entendí tu respuesta. Por favor, elegí una opción válida.',
  timeoutMinutos: 15,
  
  horariosAtencion: {
    activo: false,  // Bot disponible 24/7
    inicio: '08:00',
    fin: '23:00',
    diasSemana: [0, 1, 2, 3, 4, 5, 6],
    mensajeFueraHorario: '⏰ Nuestro horario de atención es de 08:00 a 23:00.'
  },
  
  requiereConfirmacion: true,
  permiteCancelacion: true,
  notificarAdmin: false,
  
  flujos: {
    crearTurno: {
      nombre: 'Reservar Cancha',
      descripcion: 'Flujo para reservar una cancha',
      pasoInicial: 'seleccionar_fecha',
      pasos: []
    },
    consultarTurnos: {
      nombre: 'Consultar Reservas',
      descripcion: 'Ver reservas agendadas',
      pasoInicial: 'mostrar_turnos',
      pasos: []
    },
    cancelarTurno: {
      nombre: 'Cancelar Reserva',
      descripcion: 'Cancelar una reserva',
      pasoInicial: 'listar_turnos',
      pasos: []
    }
  }
};

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================
async function seedClubJuventus() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // 1. Crear/Actualizar Canchas (Agentes)
    console.log('🏟️ ========== CREANDO CANCHAS ==========');
    const agentesCollection = mongoose.connection.collection('agentes');
    
    for (const cancha of canchas) {
      const nombreCompleto = `${cancha.nombre} ${cancha.apellido}`;
      const existing = await agentesCollection.findOne({ 
        empresaId: EMPRESA_ID, 
        email: cancha.email 
      });
      
      if (existing) {
        await agentesCollection.updateOne(
          { _id: existing._id },
          { $set: { ...cancha, actualizadoEn: new Date() } }
        );
        console.log(`   ✅ Actualizada: ${nombreCompleto}`);
      } else {
        await agentesCollection.insertOne({
          ...cancha,
          creadoEn: new Date(),
          actualizadoEn: new Date()
        });
        console.log(`   ✅ Creada: ${nombreCompleto}`);
      }
    }
    
    // Verificar canchas creadas
    const canchasCreadas = await agentesCollection.find({ empresaId: EMPRESA_ID }).toArray();
    console.log(`\n📊 Total canchas para ${EMPRESA_ID}: ${canchasCreadas.length}`);
    canchasCreadas.forEach(c => {
      console.log(`   - ${c.nombre} ${c.apellido} (${c.especialidad})`);
    });
    
    // 2. Crear/Actualizar Configuración del Módulo
    console.log('\n⚙️ ========== CONFIGURACIÓN DEL MÓDULO ==========');
    const configModuloCollection = mongoose.connection.collection('configuraciones_modulo');
    
    const existingConfig = await configModuloCollection.findOne({ empresaId: EMPRESA_ID });
    if (existingConfig) {
      await configModuloCollection.updateOne(
        { empresaId: EMPRESA_ID },
        { $set: { ...configuracionModulo, actualizadoEn: new Date() } }
      );
      console.log('   ✅ Configuración del módulo actualizada');
    } else {
      await configModuloCollection.insertOne({
        ...configuracionModulo,
        creadoEn: new Date(),
        actualizadoEn: new Date()
      });
      console.log('   ✅ Configuración del módulo creada');
    }
    
    // 3. Crear/Actualizar Configuración del Bot
    console.log('\n🤖 ========== CONFIGURACIÓN DEL BOT ==========');
    const configBotCollection = mongoose.connection.collection('configuracionbots');
    
    const existingBot = await configBotCollection.findOne({ empresaId: EMPRESA_ID });
    if (existingBot) {
      await configBotCollection.updateOne(
        { empresaId: EMPRESA_ID },
        { $set: { ...configuracionBot, updatedAt: new Date() } }
      );
      console.log('   ✅ Configuración del bot actualizada');
    } else {
      await configBotCollection.insertOne({
        ...configuracionBot,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('   ✅ Configuración del bot creada');
    }
    
    console.log(`   ⚠️ Bot de pasos ACTIVO: ${configuracionBot.activo}`);
    
    // 4. Verificar empresa existe
    console.log('\n🏢 ========== VERIFICANDO EMPRESA ==========');
    const empresasCollection = mongoose.connection.collection('empresas');
    const empresa = await empresasCollection.findOne({ nombre: EMPRESA_ID });
    
    if (empresa) {
      console.log(`   ✅ Empresa encontrada: ${empresa.nombre}`);
      console.log(`   📞 Teléfono: ${empresa.telefono}`);
      console.log(`   📧 Email: ${empresa.email}`);
      
      // Verificar si tiene phoneNumberId (necesario para WhatsApp)
      if (!empresa.phoneNumberId) {
        console.log(`   ⚠️ ADVERTENCIA: No tiene phoneNumberId configurado`);
        console.log(`   ℹ️ El phoneNumberId se obtiene del webhook de WhatsApp`);
      } else {
        console.log(`   📱 PhoneNumberId: ${empresa.phoneNumberId}`);
      }
    } else {
      console.log(`   ❌ EMPRESA NO ENCONTRADA: ${EMPRESA_ID}`);
      console.log(`   ℹ️ Debes crear la empresa primero desde el panel de admin`);
    }
    
    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('🎉 CONFIGURACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log(`
📋 Resumen:
   - Empresa: ${EMPRESA_ID}
   - Tipo: Canchas deportivas (Padel)
   - Canchas creadas: ${canchasCreadas.length}
   - Horario: 08:00 a 23:00 (todos los días)
   - Bot de pasos: ACTIVO
   - Flujo: reserva_canchas

🧪 Para testear:
   1. Envía "hola" o "reservar" al WhatsApp del bot
   2. Sigue el flujo de reserva
   
⚠️ Requisitos:
   - La empresa debe tener un chatbot configurado con phoneNumberId
   - El backend debe estar corriendo
`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

seedClubJuventus();
