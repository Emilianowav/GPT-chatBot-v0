/**
 * Setup Instituto Universitario Del Ibera
 * Bot de pasos para consultas educativas (sin API externa)
 */
import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';
const EMPRESA_ID = 'Instituto Universitario Del Ibera';

async function setup() {
  await mongoose.connect(uri);
  console.log('DB:', mongoose.connection.db?.databaseName);
  
  // 1. Crear o actualizar empresa
  console.log('\n=== CREANDO/ACTUALIZANDO EMPRESA ===');
  
  const empresaData = {
    nombre: EMPRESA_ID,
    categoria: 'educacion',
    telefono: '+5493794044101',
    email: 'info@institutoibera.edu.ar',
    derivarA: [],
    prompt: `Sos el asistente virtual del Instituto Universitario Del Ibera. Tu objetivo es ayudar a estudiantes y aspirantes con información sobre carreras, inscripciones, horarios y consultas generales.

Información del Instituto:
- Nombre: Instituto Universitario Del Ibera
- Ubicación: Corrientes, Argentina
- Modalidades: Presencial y Virtual

Carreras disponibles:
1. Tecnicatura en Administración de Empresas (2 años)
2. Tecnicatura en Marketing Digital (2 años)
3. Tecnicatura en Desarrollo de Software (2.5 años)
4. Tecnicatura en Recursos Humanos (2 años)
5. Licenciatura en Administración (4 años)

Horarios de atención:
- Lunes a Viernes: 8:00 a 20:00
- Sábados: 9:00 a 13:00

Períodos de inscripción:
- Primer cuatrimestre: Diciembre a Marzo
- Segundo cuatrimestre: Junio a Julio

Sé amable, profesional y orientado a ayudar. Si no tenés información específica, ofrecé contactar a la secretaría académica.`,
    saludos: [],
    catalogoPath: '',
    modelo: 'gpt-3.5-turbo',
    plan: 'basico',
    modulos: ['calendario', 'clientes'],
    limites: {
      mensajesMensuales: 1000,
      usuariosActivos: 100,
      almacenamiento: 250,
      integraciones: 1,
      exportacionesMensuales: 0,
      agentesSimultaneos: 0,
      maxUsuarios: 5,
      maxAdmins: 1
    },
    uso: {
      mensajesEsteMes: 0,
      usuariosActivos: 0,
      almacenamientoUsado: 0,
      exportacionesEsteMes: 0,
      ultimaActualizacion: new Date()
    },
    facturacion: {
      ultimoPago: new Date(),
      proximoPago: new Date(Date.now() + 30*24*60*60*1000),
      estado: 'activo'
    },
    ubicaciones: [{
      nombre: 'Sede Principal',
      direccion: 'Corrientes, Argentina',
      telefono: '+5493794044101'
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await mongoose.connection.collection('empresas').updateOne(
    { nombre: EMPRESA_ID },
    { $set: empresaData },
    { upsert: true }
  );
  console.log('✅ Empresa creada/actualizada');

  // 2. Crear configuración del módulo
  console.log('\n=== CONFIGURANDO MÓDULO ===');
  
  const moduloConfig = {
    empresaId: EMPRESA_ID,
    tipoNegocio: 'educacion',
    activo: true,
    
    nomenclatura: {
      turno: 'Cita',
      turnos: 'Citas',
      agente: 'Asesor',
      agentes: 'Asesores',
      cliente: 'Estudiante',
      clientes: 'Estudiantes',
      recurso: 'Oficina',
      recursos: 'Oficinas'
    },
    
    usaAgentes: false,
    agenteRequerido: false,
    usaRecursos: false,
    recursoRequerido: false,
    usaHorariosDisponibilidad: false,
    duracionPorDefecto: 30,
    permiteDuracionVariable: false,
    
    chatbotActivo: true,
    chatbotPuedeCrear: false,
    chatbotPuedeModificar: false,
    chatbotPuedeCancelar: false,
    
    requiereConfirmacion: false,
    notificaciones: [],
    estadosPersonalizados: [],
    camposPersonalizados: [],
    
    variablesDinamicas: {
      nombre_empresa: EMPRESA_ID,
      nomenclatura_turno: 'Cita',
      nomenclatura_turnos: 'Citas',
      nomenclatura_agente: 'Asesor',
      nomenclatura_agentes: 'Asesores',
      zona_horaria: 'America/Argentina/Buenos_Aires',
      moneda: 'ARS',
      idioma: 'es'
    },
    
    actualizadoEn: new Date()
  };

  await mongoose.connection.collection('configuraciones_modulo').updateOne(
    { empresaId: EMPRESA_ID },
    { $set: moduloConfig },
    { upsert: true }
  );
  console.log('✅ Configuración de módulo creada');

  // 3. Configurar bot de pasos (INACTIVO - usará GPT conversacional)
  console.log('\n=== CONFIGURANDO BOT ===');
  
  const botConfig = {
    empresaId: EMPRESA_ID,
    activo: false, // Usará GPT conversacional
    
    mensajeBienvenida: `¡Hola! 👋
Bienvenido al *Instituto Universitario Del Ibera* 🎓

Soy tu asistente virtual y puedo ayudarte con:

📚 *Información sobre carreras*
📝 *Proceso de inscripción*
📅 *Horarios y modalidades*
❓ *Consultas generales*

¿En qué puedo ayudarte hoy?`,
    
    mensajeDespedida: '¡Gracias por contactarnos! 🎓 Si tenés más consultas, no dudes en escribirnos. ¡Éxitos!',
    mensajeError: '❌ Disculpá, no pude entender tu consulta. ¿Podrías reformularla?',
    timeoutMinutos: 30,
    
    horariosAtencion: {
      activo: false, // 24/7 para consultas
      inicio: '08:00',
      fin: '20:00',
      diasSemana: [1, 2, 3, 4, 5, 6],
      mensajeFueraHorario: '⏰ Nuestro horario de atención es de Lunes a Viernes de 8:00 a 20:00 y Sábados de 9:00 a 13:00. Dejanos tu consulta y te responderemos a la brevedad.'
    },
    
    requiereConfirmacion: false,
    permiteCancelacion: false,
    notificarAdmin: true,
    
    updatedAt: new Date()
  };

  await mongoose.connection.collection('configuracionbots').updateOne(
    { empresaId: EMPRESA_ID },
    { $set: botConfig },
    { upsert: true }
  );
  console.log('✅ Configuración de bot creada (GPT conversacional)');

  // 4. Crear usuario admin para el CRM
  console.log('\n=== CREANDO USUARIO ADMIN ===');
  
  const usuarioAdmin = {
    email: 'admin@institutoibera.edu.ar',
    password: '$2b$10$rQZ5Q5Q5Q5Q5Q5Q5Q5Q5QOQ5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q', // Cambiar después
    nombre: 'Administrador',
    apellido: 'Instituto Ibera',
    empresaId: EMPRESA_ID,
    empresaNombre: EMPRESA_ID,
    rol: 'admin',
    activo: true,
    verificado: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const existeUsuario = await mongoose.connection.collection('usuarios').findOne({ 
    email: 'admin@institutoibera.edu.ar' 
  });
  
  if (!existeUsuario) {
    await mongoose.connection.collection('usuarios').insertOne(usuarioAdmin);
    console.log('✅ Usuario admin creado');
    console.log('   Email: admin@institutoibera.edu.ar');
    console.log('   ⚠️ IMPORTANTE: Cambiar contraseña después del primer login');
  } else {
    console.log('ℹ️ Usuario admin ya existe');
  }

  // 5. Verificación final
  console.log('\n=== VERIFICACIÓN FINAL ===');
  const empresa = await mongoose.connection.collection('empresas').findOne({ nombre: EMPRESA_ID });
  console.log('✅ Empresa:', empresa?.nombre);
  console.log('   Categoría:', empresa?.categoria);
  console.log('   Teléfono:', empresa?.telefono);
  
  const modulo = await mongoose.connection.collection('configuraciones_modulo').findOne({ empresaId: EMPRESA_ID });
  console.log('✅ Módulo configurado:', modulo?.tipoNegocio);
  
  const bot = await mongoose.connection.collection('configuracionbots').findOne({ empresaId: EMPRESA_ID });
  console.log('✅ Bot activo:', bot?.activo ? 'Sí (pasos)' : 'No (GPT conversacional)');
  
  console.log('\n========================================');
  console.log('🎓 INSTITUTO UNIVERSITARIO DEL IBERA');
  console.log('========================================');
  console.log('✅ Configuración completada exitosamente');
  console.log('');
  console.log('El instituto usará GPT conversacional para:');
  console.log('  📚 Consultas sobre carreras');
  console.log('  📝 Información de inscripciones');
  console.log('  📅 Horarios y modalidades');
  console.log('  ❓ Consultas generales');
  console.log('');
  console.log('Próximos pasos:');
  console.log('  1. Configurar webhook de WhatsApp en Meta');
  console.log('  2. Verificar número +5493794044101');
  console.log('  3. Cambiar contraseña del usuario admin');
  console.log('========================================');
  
  await mongoose.disconnect();
}

setup().catch(console.error);
