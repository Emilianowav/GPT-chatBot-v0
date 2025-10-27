// 🚀 Script de Onboarding para San Jose - Empresa de Viajes
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { EmpresaModel } from '../models/Empresa.js';
import { AdminUserModel } from '../models/AdminUser.js';
import { ConfiguracionModuloModel, TipoNegocio, TipoCampo } from '../modules/calendar/models/ConfiguracionModulo.js';
import { ConfiguracionBotModel } from '../modules/calendar/models/ConfiguracionBot.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';

const EMPRESA_DATA = {
  nombre: 'San Jose',
  categoria: 'viajes',
  telefono: '+5493794044092',
  email: 'contacto@sanjoseviajes.com',
  phoneNumberId: '888481464341184',
  wabaId: '772636765924023',
  verifyCode: '643175'
};

const ADMIN_DATA = {
  username: 'sanjose_admin',
  password: 'SanJose2025!',
  email: 'admin@sanjoseviajes.com',
  nombre: 'Admin',
  apellido: 'San Jose'
};

async function onboardingSanJose() {
  try {
    console.log('🚀 Iniciando onboarding de San Jose...\n');
    console.log('🔌 Conectando a MongoDB...');
    await connectDB();
    console.log('✅ Conectado a MongoDB\n');
    
    // ==================== PASO 1: CREAR EMPRESA ====================
    console.log('📋 PASO 1: Creando empresa San Jose...');
    
    let empresa = await EmpresaModel.findOne({ nombre: EMPRESA_DATA.nombre });
    
    if (empresa) {
      console.log('⚠️  La empresa San Jose ya existe. Actualizando configuración...');
    } else {
      // Definir el módulo de calendario
      const moduloCalendario = {
        id: 'calendar_booking',
        nombre: 'Calendario de Viajes',
        descripcion: 'Sistema de gestión de viajes y reservas con bot de WhatsApp',
        version: '1.0.0',
        categoria: 'booking',
        icono: '🚌',
        activo: true,
        fechaActivacion: new Date(),
        precio: 39,
        planMinimo: 'standard',
        dependencias: [],
        permisos: [
          'calendar:turnos:read',
          'calendar:turnos:write',
          'calendar:turnos:delete',
          'calendar:agentes:read',
          'calendar:agentes:write',
          'calendar:config:admin'
        ],
        configuracion: {
          duracionTurnoPorDefecto: 60,
          bufferEntreturnos: 0,
          anticipacionMinima: 1,
          anticipacionMaxima: 60,
          horaAperturaGlobal: '00:00',
          horaCierreGlobal: '23:59',
          requiereConfirmacionAgente: false,
          tiempoLimiteConfirmacion: 24,
          recordatorio24h: true,
          recordatorio1h: false,
          permiteCancelacion: true,
          tiempoLimiteCancelacion: 12,
          notificarAgenteNuevoTurno: true,
          notificarAgenteCancelacion: true
        },
        autor: 'Neural Team',
        documentacion: 'https://docs.neural-crm.com/modules/calendar',
        soporte: 'soporte@neural-crm.com'
      };
      
      empresa = new EmpresaModel({
        nombre: EMPRESA_DATA.nombre,
        categoria: EMPRESA_DATA.categoria,
        telefono: EMPRESA_DATA.telefono,
        email: EMPRESA_DATA.email,
        phoneNumberId: EMPRESA_DATA.phoneNumberId,
        prompt: `Sos el asistente virtual de San Jose, una empresa de viajes y turismo.

Tu función principal es ayudar a los clientes a:
- Agendar viajes y reservas
- Consultar sus viajes programados
- Modificar o cancelar reservas
- Brindar información sobre destinos y servicios

Características:
- Sé amable, profesional y eficiente
- Usa emojis para hacer la conversación más amigable
- Confirma siempre los datos importantes (origen, destino, fecha, hora)
- Si no entiendes algo, pide aclaración
- Para consultas complejas, ofrece derivar a un agente humano

Información de la empresa:
- Empresa: San Jose Viajes
- Especialidad: Viajes y turismo
- Teléfono: ${EMPRESA_DATA.telefono}`,
        saludos: [
          '¡Hola! 👋 Bienvenido a San Jose Viajes. ¿En qué puedo ayudarte hoy?',
          '¡Hola! 🚌 Soy el asistente de San Jose. ¿Querés agendar un viaje o consultar una reserva?',
          '¡Bienvenido a San Jose Viajes! 🌎 ¿Cómo puedo ayudarte?'
        ],
        catalogoPath: 'data/catalogos/san_jose_viajes.txt',
        linkCatalogo: 'https://sanjoseviajes.com/destinos',
        modelo: 'gpt-3.5-turbo',
        
        // Plan y módulos
        plan: 'standard',
        modulos: [moduloCalendario as any],
        
        // Límites del plan standard
        limites: {
          mensajesMensuales: 5000,
          usuariosActivos: 500,
          almacenamiento: 1000,
          integraciones: 3,
          exportacionesMensuales: 10,
          agentesSimultaneos: 3,
          maxUsuarios: 10,
          maxAdmins: 2
        },
        
        // Uso inicial
        uso: {
          mensajesEsteMes: 0,
          usuariosActivos: 0,
          almacenamientoUsado: 0,
          exportacionesEsteMes: 0,
          ultimaActualizacion: new Date()
        },
        
        // Facturación
        facturacion: {
          estado: 'activo',
          ultimoPago: new Date(),
          proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      
      await empresa.save();
      console.log('✅ Empresa San Jose creada exitosamente');
    }
    
    // ==================== PASO 2: CREAR USUARIO ADMIN ====================
    console.log('\n📋 PASO 2: Creando usuario administrador...');
    
    let adminUser = await AdminUserModel.findOne({ 
      username: ADMIN_DATA.username,
      empresaId: EMPRESA_DATA.nombre
    });
    
    if (!adminUser) {
      adminUser = new AdminUserModel({
        username: ADMIN_DATA.username,
        password: ADMIN_DATA.password,
        empresaId: EMPRESA_DATA.nombre,
        role: 'admin',
        email: ADMIN_DATA.email,
        nombre: ADMIN_DATA.nombre,
        apellido: ADMIN_DATA.apellido,
        activo: true
      });
      
      await adminUser.save();
      console.log('✅ Usuario admin creado');
    } else {
      console.log('ℹ️  Usuario admin ya existe');
    }
    
    // ==================== PASO 3: CONFIGURAR MÓDULO DE CALENDARIO ====================
    console.log('\n📋 PASO 3: Configurando módulo de calendario...');
    
    let configModulo = await ConfiguracionModuloModel.findOne({ 
      empresaId: EMPRESA_DATA.nombre 
    });
    
    if (!configModulo) {
      configModulo = new ConfiguracionModuloModel({
        empresaId: EMPRESA_DATA.nombre,
        tipoNegocio: TipoNegocio.VIAJES,
        
        // Nomenclatura personalizada para viajes
        nomenclatura: {
          turno: 'Viaje',
          turnos: 'Viajes',
          agente: 'Chofer',
          agentes: 'Choferes',
          cliente: 'Pasajero',
          clientes: 'Pasajeros',
          recurso: 'Vehículo',
          recursos: 'Vehículos'
        },
        
        // Campos personalizados para viajes
        camposPersonalizados: [
          {
            clave: 'origen',
            etiqueta: 'Origen',
            tipo: TipoCampo.TEXTO,
            requerido: true,
            placeholder: 'Ej: Buenos Aires',
            orden: 1,
            mostrarEnLista: true,
            mostrarEnCalendario: true,
            usarEnNotificacion: true
          },
          {
            clave: 'destino',
            etiqueta: 'Destino',
            tipo: TipoCampo.TEXTO,
            requerido: true,
            placeholder: 'Ej: Córdoba',
            orden: 2,
            mostrarEnLista: true,
            mostrarEnCalendario: true,
            usarEnNotificacion: true
          },
          {
            clave: 'pasajeros',
            etiqueta: 'Cantidad de pasajeros',
            tipo: TipoCampo.NUMERO,
            requerido: true,
            placeholder: 'Ej: 2',
            orden: 3,
            mostrarEnLista: true,
            mostrarEnCalendario: false,
            usarEnNotificacion: true,
            validacion: {
              min: 1,
              max: 50,
              mensaje: 'La cantidad debe estar entre 1 y 50 pasajeros'
            }
          },
          {
            clave: 'tipo_viaje',
            etiqueta: 'Tipo de viaje',
            tipo: TipoCampo.SELECT,
            requerido: true,
            opciones: ['Solo ida', 'Ida y vuelta', 'Excursión'],
            orden: 4,
            mostrarEnLista: true,
            mostrarEnCalendario: false,
            usarEnNotificacion: false
          },
          {
            clave: 'observaciones',
            etiqueta: 'Observaciones',
            tipo: TipoCampo.TEXTAREA,
            requerido: false,
            placeholder: 'Información adicional sobre el viaje',
            orden: 5,
            mostrarEnLista: false,
            mostrarEnCalendario: false,
            usarEnNotificacion: false
          }
        ],
        
        // Configuración de agentes/choferes
        usaAgentes: true,
        agenteRequerido: true,
        usaRecursos: true,
        recursoRequerido: false,
        
        // Configuración de horarios
        usaHorariosDisponibilidad: false, // Permite cualquier horario
        duracionPorDefecto: 60,
        permiteDuracionVariable: true,
        
        // Notificaciones automáticas
        notificaciones: [
          {
            activa: true,
            tipo: 'recordatorio',
            momento: 'noche_anterior',
            horaEnvio: '20:00',
            diasAntes: 1,
            plantillaMensaje: '🚌 *Recordatorio de viaje*\n\nHola! Te recordamos tu viaje para mañana:\n\n📍 Origen: {origen}\n📍 Destino: {destino}\n🕐 Hora: {hora}\n👥 Pasajeros: {pasajeros}\n\n¡Buen viaje! 🌟',
            requiereConfirmacion: true,
            mensajeConfirmacion: '✅ Perfecto! Tu viaje está confirmado.',
            mensajeCancelacion: '❌ Entendido. Si necesitas reprogramar, contáctanos.'
          }
        ],
        
        // Confirmación de viajes
        requiereConfirmacion: true,
        tiempoLimiteConfirmacion: 24,
        
        // Integración con chatbot
        chatbotActivo: true,
        chatbotPuedeCrear: true,
        chatbotPuedeModificar: false,
        chatbotPuedeCancelar: true,
        
        activo: true
      });
      
      await configModulo.save();
      console.log('✅ Configuración del módulo creada');
    } else {
      console.log('ℹ️  Configuración del módulo ya existe');
    }
    
    // ==================== PASO 4: CONFIGURAR BOT DE PASOS ====================
    console.log('\n📋 PASO 4: Configurando bot de pasos para WhatsApp...');
    
    let configBot = await ConfiguracionBotModel.findOne({ 
      empresaId: EMPRESA_DATA.nombre 
    });
    
    if (!configBot) {
      configBot = new ConfiguracionBotModel({
        empresaId: EMPRESA_DATA.nombre,
        activo: true,
        
        mensajeBienvenida: `¡Hola! 👋 Soy el asistente virtual de *San Jose Viajes* 🚌

¿En qué puedo ayudarte?

1️⃣ Reservar un viaje
2️⃣ Consultar mis viajes
3️⃣ Cancelar un viaje

Escribe el número de la opción que necesites.`,
        
        mensajeDespedida: '¡Hasta pronto! 👋 Que tengas un excelente viaje. Si necesitas algo más, escríbeme.',
        
        mensajeError: '❌ No entendí tu respuesta. Por favor, elige una opción válida del menú.',
        
        timeoutMinutos: 15,
        
        // Configuración de horarios de atención
        horariosAtencion: {
          activo: true,
          inicio: '06:00',
          fin: '22:00',
          diasSemana: [0, 1, 2, 3, 4, 5, 6], // Todos los días
          mensajeFueraHorario: '⏰ Nuestro horario de atención es de {inicio} a {fin}.\n\nDejanos tu consulta y te responderemos a la brevedad. ¡Gracias!'
        },
        
        requiereConfirmacion: true,
        permiteCancelacion: true,
        notificarAdmin: true,
        
        // Los flujos se manejan por defecto en el servicio
        flujos: {
          crearTurno: {
            nombre: 'Reservar Viaje',
            descripcion: 'Flujo para reservar un nuevo viaje',
            pasoInicial: 'seleccionar_fecha',
            pasos: []
          },
          consultarTurnos: {
            nombre: 'Consultar Viajes',
            descripcion: 'Flujo para ver viajes reservados',
            pasoInicial: 'mostrar_viajes',
            pasos: []
          },
          cancelarTurno: {
            nombre: 'Cancelar Viaje',
            descripcion: 'Flujo para cancelar un viaje',
            pasoInicial: 'listar_viajes',
            pasos: []
          }
        }
      });
      
      await configBot.save();
      console.log('✅ Configuración del bot creada');
    } else {
      console.log('ℹ️  Configuración del bot ya existe');
    }
    
    // ==================== PASO 5: CREAR CHOFERES DE EJEMPLO ====================
    console.log('\n📋 PASO 5: Creando choferes de ejemplo...');
    
    const choferes = [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@sanjoseviajes.com',
        telefono: '+5493794111111',
        especialidad: 'Viajes largos',
        color: '#3B82F6'
      },
      {
        nombre: 'María',
        apellido: 'González',
        email: 'maria.gonzalez@sanjoseviajes.com',
        telefono: '+5493794222222',
        especialidad: 'Excursiones',
        color: '#10B981'
      }
    ];
    
    for (const choferData of choferes) {
      const choferExistente = await AgenteModel.findOne({
        empresaId: EMPRESA_DATA.nombre,
        email: choferData.email
      });
      
      if (!choferExistente) {
        const chofer = new AgenteModel({
          empresaId: EMPRESA_DATA.nombre,
          nombre: choferData.nombre,
          apellido: choferData.apellido,
          email: choferData.email,
          telefono: choferData.telefono,
          especialidad: choferData.especialidad,
          color: choferData.color,
          activo: true,
          horarios: [
            {
              dia: 1,
              activo: true,
              bloques: [{ inicio: '06:00', fin: '22:00' }]
            },
            {
              dia: 2,
              activo: true,
              bloques: [{ inicio: '06:00', fin: '22:00' }]
            },
            {
              dia: 3,
              activo: true,
              bloques: [{ inicio: '06:00', fin: '22:00' }]
            },
            {
              dia: 4,
              activo: true,
              bloques: [{ inicio: '06:00', fin: '22:00' }]
            },
            {
              dia: 5,
              activo: true,
              bloques: [{ inicio: '06:00', fin: '22:00' }]
            },
            {
              dia: 6,
              activo: true,
              bloques: [{ inicio: '06:00', fin: '22:00' }]
            },
            {
              dia: 0,
              activo: true,
              bloques: [{ inicio: '06:00', fin: '22:00' }]
            }
          ]
        });
        
        await chofer.save();
        console.log(`✅ Chofer creado: ${choferData.nombre} ${choferData.apellido}`);
      } else {
        console.log(`ℹ️  Chofer ya existe: ${choferData.nombre} ${choferData.apellido}`);
      }
    }
    
    // ==================== PASO 6: CREAR ARCHIVO DE CATÁLOGO ====================
    console.log('\n📋 PASO 6: Creando archivo de catálogo...');
    
    const catalogoContent = `CATÁLOGO DE SERVICIOS - SAN JOSE VIAJES

🚌 DESTINOS PRINCIPALES:
- Buenos Aires
- Córdoba
- Rosario
- Mendoza
- Bariloche
- Mar del Plata
- Salta
- Tucumán

🎫 TIPOS DE SERVICIO:
1. Solo ida
2. Ida y vuelta
3. Excursiones (incluye guía)

💺 CATEGORÍAS:
- Semicama
- Cama ejecutiva
- Suite

📅 HORARIOS:
- Salidas diarias desde las 06:00 hasta las 22:00
- Consultar disponibilidad para horarios especiales

💰 PRECIOS:
- Varían según destino, categoría y temporada
- Descuentos para grupos (más de 10 pasajeros)
- Promociones especiales en temporada baja

📞 CONTACTO:
- WhatsApp: ${EMPRESA_DATA.telefono}
- Email: ${EMPRESA_DATA.email}

🎁 SERVICIOS INCLUIDOS:
- WiFi a bordo
- Aire acondicionado
- Baño
- Snacks y bebidas (según categoría)

⚠️ POLÍTICAS:
- Cancelación gratuita hasta 12 horas antes
- Menores de 5 años viajan gratis (sin asiento)
- Mascotas permitidas (consultar condiciones)`;
    
    const fs = await import('fs');
    const path = await import('path');
    
    const catalogoDir = path.resolve(process.cwd(), 'data', 'catalogos');
    const catalogoPath = path.join(catalogoDir, 'san_jose_viajes.txt');
    
    // Crear directorio si no existe
    if (!fs.existsSync(catalogoDir)) {
      fs.mkdirSync(catalogoDir, { recursive: true });
    }
    
    fs.writeFileSync(catalogoPath, catalogoContent, 'utf-8');
    console.log('✅ Archivo de catálogo creado');
    
    // ==================== RESUMEN FINAL ====================
    console.log('\n' + '='.repeat(60));
    console.log('✅ ONBOARDING COMPLETADO EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log('\n📊 RESUMEN DE LA CONFIGURACIÓN:\n');
    console.log('🏢 EMPRESA:');
    console.log(`   Nombre: ${EMPRESA_DATA.nombre}`);
    console.log(`   Categoría: ${EMPRESA_DATA.categoria}`);
    console.log(`   Teléfono: ${EMPRESA_DATA.telefono}`);
    console.log(`   Email: ${EMPRESA_DATA.email}`);
    console.log(`   Plan: Standard`);
    console.log('');
    console.log('📱 WHATSAPP:');
    console.log(`   Number ID: ${EMPRESA_DATA.phoneNumberId}`);
    console.log(`   WABA ID: ${EMPRESA_DATA.wabaId}`);
    console.log(`   Verify Code: ${EMPRESA_DATA.verifyCode}`);
    console.log('');
    console.log('👤 USUARIO ADMIN:');
    console.log(`   Username: ${ADMIN_DATA.username}`);
    console.log(`   Password: ${ADMIN_DATA.password}`);
    console.log(`   Email: ${ADMIN_DATA.email}`);
    console.log('');
    console.log('📅 MÓDULO DE CALENDARIO:');
    console.log('   ✅ Activo');
    console.log('   Tipo: Viajes');
    console.log('   Campos: Origen, Destino, Pasajeros, Tipo de viaje, Observaciones');
    console.log('   Choferes: 2 creados');
    console.log('');
    console.log('🤖 BOT DE PASOS:');
    console.log('   ✅ Activo');
    console.log('   Horario: 06:00 - 22:00 (todos los días)');
    console.log('   Funciones: Reservar, Consultar, Cancelar');
    console.log('   Notificaciones: Recordatorio 24h antes');
    console.log('');
    console.log('🚀 PRÓXIMOS PASOS:');
    console.log('   1. Hacer login en el dashboard: https://gpt-chatbot-v0.onrender.com');
    console.log('   2. Configurar webhook de WhatsApp con el Number ID');
    console.log('   3. Probar el bot enviando un mensaje al número');
    console.log('   4. Verificar que se guarden los turnos correctamente');
    console.log('');
    console.log('💡 PARA PROBAR EL BOT:');
    console.log('   Envía un mensaje de WhatsApp a: ' + EMPRESA_DATA.telefono);
    console.log('   El bot responderá con el menú de opciones');
    console.log('');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR EN ONBOARDING:', error);
    process.exit(1);
  }
}

// Ejecutar
onboardingSanJose();
