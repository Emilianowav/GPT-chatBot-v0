/**
 * Script completo para configurar Club Juventus:
 * 1. Actualizar api_configurations con estructura completa como ICenter
 * 2. Crear usuario admin para la empresa
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const API_KEY = 'mc_16eeb4a3570d760196ca32d1bfa4821a9fd8816c18f5a2f54dbd3a7d09995e77';

async function main() {
  console.log('🔧 Configuración completa de Club Juventus');
  console.log('==========================================\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // 1. Obtener la empresa Club Juventus
  const empresa = await db.collection('empresas').findOne({ nombre: { $regex: /juventus/i } });
  if (!empresa) {
    console.error('❌ No se encontró la empresa Club Juventus');
    process.exit(1);
  }
  console.log(`✅ Empresa encontrada: ${empresa.nombre} (ID: ${empresa._id})`);

  // 2. Configuración completa de API para Mis Canchas - Club Juventus
  const apiConfigJuventus = {
    empresaId: empresa._id,
    nombre: 'Mis Canchas API - Club Juventus',
    descripcion: 'API para gestión de reservas de canchas deportivas del Club Juventus a través de la plataforma Mis Canchas',
    tipo: 'rest',
    estado: 'activo',
    baseUrl: 'https://venita-unjailed-multifariously.ngrok-free.dev/api/v1',
    version: '1.0.0',
    
    // Autenticación Bearer Token
    autenticacion: {
      tipo: 'bearer',
      configuracion: {
        token: API_KEY,
        headerName: 'Authorization'
      }
    },
    
    // Endpoints de la API
    endpoints: [
      // 1. Obtener Deportes
      {
        id: 'obtener-deportes',
        nombre: 'Obtener Deportes',
        descripcion: 'Lista todos los deportes disponibles en el establecimiento',
        metodo: 'GET',
        path: '/deportes',
        parametros: {
          path: [],
          query: [],
          headers: {}
        },
        respuesta: {
          schema: {
            success: 'boolean',
            deportes: 'array'
          },
          ejemploExito: {
            success: true,
            deportes: [
              { id: 'paddle', nombre: 'Paddle', icono: '🎾' },
              { id: 'futbol', nombre: 'Fútbol', icono: '⚽' }
            ]
          }
        },
        activo: true
      },
      
      // 2. Consultar Disponibilidad
      {
        id: 'consultar-disponibilidad',
        nombre: 'Consultar Disponibilidad',
        descripcion: 'Consulta la disponibilidad de canchas para una fecha, deporte y duración',
        metodo: 'GET',
        path: '/disponibilidad',
        parametros: {
          path: [],
          query: [
            { nombre: 'fecha', tipo: 'string', requerido: true, descripcion: 'Fecha en formato YYYY-MM-DD' },
            { nombre: 'deporte', tipo: 'string', requerido: true, descripcion: 'ID del deporte (paddle, futbol)' },
            { nombre: 'duracion', tipo: 'number', requerido: false, descripcion: 'Duración en minutos (60, 90, 120)', valorPorDefecto: 60 },
            { nombre: 'hora_inicio', tipo: 'string', requerido: false, descripcion: 'Hora específica HH:MM' }
          ],
          headers: {}
        },
        respuesta: {
          schema: {
            success: 'boolean',
            fecha: 'string',
            deporte: 'string',
            canchas_disponibles: 'array'
          },
          ejemploExito: {
            success: true,
            fecha: '2025-12-24',
            deporte: 'paddle',
            canchas_disponibles: [
              {
                id: 'uuid-cancha',
                nombre: 'Cancha #1',
                tipo: 'techada',
                horarios_disponibles: [{ hora: '19:00', duraciones: [60, 90] }],
                precio_hora: 30000,
                precio_hora_y_media: 45000,
                precio_dos_horas: 60000
              }
            ]
          }
        },
        activo: true
      },
      
      // 3. Pre-Crear Reserva
      {
        id: 'pre-crear-reserva',
        nombre: 'Pre-Crear Reserva',
        descripcion: 'Crea una pre-reserva que bloquea el horario por 10 minutos hasta confirmar pago',
        metodo: 'POST',
        path: '/reservas/pre-crear',
        parametros: {
          path: [],
          query: [],
          body: {
            tipo: 'json',
            schema: {
              cancha_id: { type: 'string', required: true },
              fecha: { type: 'string', required: true },
              hora_inicio: { type: 'string', required: true },
              duracion: { type: 'number', required: true },
              cliente: {
                nombre: { type: 'string', required: true },
                telefono: { type: 'string', required: true },
                email: { type: 'string', required: false }
              },
              origen: { type: 'string', default: 'whatsapp' }
            },
            ejemplo: {
              cancha_id: 'uuid-cancha',
              fecha: '2025-12-24',
              hora_inicio: '19:00',
              duracion: 60,
              cliente: { nombre: 'Juan Pérez', telefono: '5493794123456' },
              origen: 'whatsapp'
            }
          },
          headers: {}
        },
        respuesta: {
          ejemploExito: {
            success: true,
            reserva_id: 'uuid-reserva',
            estado: 'pendiente_pago',
            expira_en: 600,
            detalle: {
              cancha: 'Cancha #1',
              fecha: '2025-12-24',
              hora_inicio: '19:00',
              hora_fin: '20:00',
              duracion: 60,
              precio_total: 30000,
              seña_requerida: 10000
            }
          }
        },
        activo: true
      },
      
      // 4. Confirmar Reserva
      {
        id: 'confirmar-reserva',
        nombre: 'Confirmar Reserva',
        descripcion: 'Confirma una reserva después de recibir el pago',
        metodo: 'PUT',
        path: '/reservas/:reserva_id/confirmar',
        parametros: {
          path: [
            { nombre: 'reserva_id', tipo: 'string', requerido: true, descripcion: 'ID de la reserva' }
          ],
          query: [],
          body: {
            tipo: 'json',
            schema: {
              pago: {
                id: { type: 'string', required: true },
                monto: { type: 'number', required: true },
                metodo: { type: 'string', default: 'mercadopago' },
                estado: { type: 'string', required: true }
              }
            }
          },
          headers: {}
        },
        respuesta: {
          ejemploExito: {
            success: true,
            reserva_id: 'uuid-reserva',
            estado: 'confirmada',
            codigo_reserva: 'MC-2025-ABC123',
            mensaje: 'Reserva confirmada exitosamente'
          }
        },
        activo: true
      },
      
      // 5. Cancelar Reserva
      {
        id: 'cancelar-reserva',
        nombre: 'Cancelar Reserva',
        descripcion: 'Cancela una reserva existente',
        metodo: 'DELETE',
        path: '/reservas/:reserva_id',
        parametros: {
          path: [
            { nombre: 'reserva_id', tipo: 'string', requerido: true, descripcion: 'ID de la reserva' }
          ],
          query: [],
          headers: {}
        },
        respuesta: {
          ejemploExito: { success: true, message: 'Reserva cancelada' }
        },
        activo: true
      },
      
      // 6. Obtener Precios
      {
        id: 'obtener-precios',
        nombre: 'Obtener Precios',
        descripcion: 'Obtiene los precios de las canchas',
        metodo: 'GET',
        path: '/precios',
        parametros: {
          path: [],
          query: [
            { nombre: 'deporte', tipo: 'string', requerido: false, descripcion: 'Filtrar por deporte' },
            { nombre: 'cancha_id', tipo: 'string', requerido: false, descripcion: 'Filtrar por cancha' }
          ],
          headers: {}
        },
        respuesta: {
          ejemploExito: {
            success: true,
            precios: [
              {
                cancha_id: 'uuid',
                cancha_nombre: 'Cancha #1',
                deporte: 'paddle',
                precios: { '60': 30000, '90': 45000, '120': 60000 },
                seña_porcentaje: 33
              }
            ],
            seña_minima: 5000
          }
        },
        activo: true
      }
    ],
    
    // Integración con Chatbot
    chatbotIntegration: {
      habilitado: true,
      chatbotId: empresa._id.toString(),
      keywords: [
        {
          palabra: 'deportes',
          endpointId: 'obtener-deportes',
          descripcion: 'Lista los deportes disponibles',
          extraerParametros: false,
          parametrosConfig: [],
          respuestaTemplate: '🏆 *Deportes Disponibles*\n\n{{#deportes}}\n{{icono}} *{{nombre}}*\n{{/deportes}}\n\n💡 _Escribe el nombre del deporte para ver disponibilidad_',
          ejemplos: ['¿Qué deportes tienen?', 'deportes disponibles']
        },
        {
          palabra: 'precios',
          endpointId: 'obtener-precios',
          descripcion: 'Muestra los precios de las canchas',
          extraerParametros: false,
          parametrosConfig: [],
          respuestaTemplate: '💰 *Precios de Canchas*\n\n{{#precios}}\n🏟️ *{{cancha_nombre}}* ({{deporte}})\n   1 hora: ${{precios.60}}\n   1.5 horas: ${{precios.90}}\n   2 horas: ${{precios.120}}\n{{/precios}}',
          ejemplos: ['¿Cuánto sale?', 'precios', 'tarifas']
        }
      ],
      mensajeAyuda: 'Puedo ayudarte con: "reservar", "disponibilidad", "deportes", "precios", "cancelar"'
    },
    
    // Workflow principal de reserva
    workflows: [
      {
        id: 'workflow-reserva-canchas-juventus',
        nombre: 'Reserva de Canchas - Club Juventus',
        descripcion: 'Flujo completo de reserva de canchas por WhatsApp con pago por Mercado Pago',
        activo: true,
        
        trigger: {
          tipo: 'keyword',
          keywords: ['reservar', 'turno', 'cancha', 'paddle', 'futbol', 'fútbol', 'disponibilidad'],
          primeraRespuesta: false
        },
        prioridad: 20,
        
        steps: [
          // Paso 1: Seleccionar Deporte
          {
            orden: 1,
            tipo: 'recopilar',
            nombre: 'Seleccionar Deporte',
            descripcion: 'Usuario selecciona el deporte',
            pregunta: '🏆 *¿Qué deporte querés jugar?*\n\nSeleccioná una opción:',
            nombreVariable: 'deporte_id',
            validacion: {
              tipo: 'opcion',
              opciones: [],
              mensajeError: 'Por favor seleccioná un deporte de la lista'
            },
            endpointId: 'obtener-deportes',
            endpointResponseConfig: {
              arrayPath: 'deportes',
              idField: 'id',
              displayField: 'nombre'
            },
            plantillaOpciones: '{{numero}}. {{icono}} {{nombre}}',
            endpointsRelacionados: [],
            intentosMaximos: 3
          },
          
          // Paso 2: Ingresar Fecha
          {
            orden: 2,
            tipo: 'input',
            nombre: 'Ingresar Fecha',
            descripcion: 'Usuario ingresa la fecha deseada',
            pregunta: '📅 *¿Para qué fecha querés reservar?*\n\nPodés escribir:\n• "hoy" o "mañana"\n• Una fecha: DD/MM/AAAA (ej: 25/12/2025)',
            nombreVariable: 'fecha_texto',
            validacion: {
              tipo: 'texto',
              mensajeError: 'Por favor ingresá una fecha válida'
            },
            intentosMaximos: 3
          },
          
          // Paso 3: Seleccionar Duración
          {
            orden: 3,
            tipo: 'input',
            nombre: 'Seleccionar Duración',
            descripcion: 'Usuario selecciona la duración del turno',
            pregunta: '⏳ *¿Cuánto tiempo querés jugar?*\n\n1️⃣ 1 hora\n2️⃣ 1 hora 30 minutos\n3️⃣ 2 horas',
            nombreVariable: 'duracion_opcion',
            validacion: {
              tipo: 'opcion',
              opciones: ['1', '2', '3'],
              mensajeError: 'Por favor escribí 1, 2 o 3'
            },
            intentosMaximos: 3
          },
          
          // Paso 4: Consultar Disponibilidad y Seleccionar Cancha/Horario
          {
            orden: 4,
            tipo: 'consulta_filtrada',
            nombre: 'Seleccionar Cancha y Horario',
            descripcion: 'Muestra canchas disponibles y usuario selecciona',
            pregunta: '🏟️ *Canchas disponibles para {{fecha_formateada}}:*\n\nSeleccioná una opción:',
            nombreVariable: 'seleccion_cancha_horario',
            endpointId: 'consultar-disponibilidad',
            mapeoParametros: {
              fecha: 'fecha_api',
              deporte: 'deporte_id',
              duracion: 'duracion_minutos'
            },
            endpointResponseConfig: {
              arrayPath: 'canchas_disponibles',
              idField: 'id',
              displayField: 'nombre'
            },
            plantillaOpciones: '{{numero}}. *{{nombre}}* ({{tipo}})\n   💰 ${{precio_hora}}/hora\n   ⏰ Horarios: {{horarios_lista}}',
            validacion: {
              tipo: 'opcion',
              mensajeError: 'Por favor seleccioná una cancha de la lista'
            },
            endpointsRelacionados: [],
            intentosMaximos: 3
          },
          
          // Paso 5: Seleccionar Horario específico
          {
            orden: 5,
            tipo: 'input',
            nombre: 'Seleccionar Horario',
            descripcion: 'Usuario selecciona el horario específico',
            pregunta: '⏰ *¿A qué hora querés jugar?*\n\nEscribí la hora en formato 24hs (ej: 19:00)',
            nombreVariable: 'hora_inicio',
            validacion: {
              tipo: 'regex',
              regex: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
              mensajeError: 'Por favor escribí la hora en formato HH:MM (ej: 19:00)'
            },
            intentosMaximos: 3
          },
          
          // Paso 6: Confirmación
          {
            orden: 6,
            tipo: 'confirmacion',
            nombre: 'Confirmar Reserva',
            descripcion: 'Usuario confirma los datos de la reserva',
            pregunta: '✅ *Revisá tu reserva:*\n\n🏆 Deporte: {{deporte_nombre}}\n📅 Fecha: {{fecha_formateada}}\n⏰ Hora: {{hora_inicio}}\n⏳ Duración: {{duracion_texto}}\n🏟️ Cancha: {{cancha_nombre}}\n💰 Precio: ${{precio_total}}\n\n*¿Confirmamos la reserva?*\n\n1️⃣ Sí, confirmar y pagar\n2️⃣ Cambiar datos\n3️⃣ Cancelar',
            nombreVariable: 'confirmacion',
            validacion: {
              tipo: 'opcion',
              opciones: ['1', '2', '3'],
              mensajeError: 'Por favor escribí 1, 2 o 3'
            },
            intentosMaximos: 3
          }
        ],
        
        mensajeInicial: '👋 ¡Hola! Te ayudo a reservar tu cancha en *Club Juventus*.',
        mensajeFinal: '🎉 *¡Reserva pre-confirmada!*\n\n📱 Te enviamos el link de pago por Mercado Pago.\n⏳ Tenés 10 minutos para completar el pago.\n\n💡 Una vez que pagues, recibirás la confirmación automáticamente.',
        mensajeAbandonar: '❌ Reserva cancelada. Si querés hacer otra reserva, escribí "reservar".',
        
        repetirWorkflow: {
          habilitado: true,
          desdePaso: 1,
          variablesALimpiar: ['deporte_id', 'fecha_texto', 'duracion_opcion', 'seleccion_cancha_horario', 'hora_inicio', 'confirmacion'],
          pregunta: '¿Querés hacer otra reserva?',
          opcionRepetir: 'Sí, reservar otra cancha 🏟️',
          opcionFinalizar: 'No, eso es todo 👋'
        },
        
        permitirAbandonar: true,
        timeoutMinutos: 15,
        
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    
    // Configuración general
    configuracion: {
      timeout: 30000,
      reintentos: 3,
      reintentarEn: [1000, 2000, 4000],
      webhooks: []
    },
    
    // Estadísticas iniciales
    estadisticas: {
      totalLlamadas: 0,
      llamadasExitosas: 0,
      llamadasFallidas: 0,
      tiempoPromedioRespuesta: 0
    },
    
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // 3. Eliminar configuración anterior y crear la nueva
  console.log('\n📋 Actualizando configuración de API...');
  await db.collection('api_configurations').deleteMany({ empresaId: empresa._id });
  const insertResult = await db.collection('api_configurations').insertOne(apiConfigJuventus);
  console.log(`✅ Configuración de API creada (ID: ${insertResult.insertedId})`);

  // 4. Crear usuario admin para Club Juventus
  console.log('\n👤 Creando usuario admin...');
  
  // Verificar si ya existe
  const existingUser = await db.collection('usuarios').findOne({ 
    empresaId: empresa._id,
    rol: 'admin'
  });
  
  if (existingUser) {
    console.log(`⚠️  Ya existe un admin: ${existingUser.email}`);
  } else {
    const hashedPassword = await bcrypt.hash('Juventus2025!', 10);
    
    const adminUser = {
      empresaId: empresa._id,
      nombre: 'Admin Juventus',
      email: 'admin@clubjuventus.com',
      password: hashedPassword,
      rol: 'admin',
      activo: true,
      permisos: ['dashboard', 'turnos', 'clientes', 'reportes', 'configuracion'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const userResult = await db.collection('usuarios').insertOne(adminUser);
    console.log(`✅ Usuario admin creado (ID: ${userResult.insertedId})`);
    console.log(`   📧 Email: admin@clubjuventus.com`);
    console.log(`   🔑 Password: Juventus2025!`);
  }

  // 5. Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DE CONFIGURACIÓN');
  console.log('='.repeat(60));
  console.log(`\n🏢 Empresa: ${empresa.nombre}`);
  console.log(`📡 API Base URL: ${apiConfigJuventus.baseUrl}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 25)}...`);
  console.log(`\n📌 Endpoints configurados: ${apiConfigJuventus.endpoints.length}`);
  apiConfigJuventus.endpoints.forEach((ep, i) => {
    console.log(`   ${i+1}. ${ep.metodo} ${ep.path} - ${ep.nombre}`);
  });
  console.log(`\n🔄 Workflows configurados: ${apiConfigJuventus.workflows.length}`);
  apiConfigJuventus.workflows.forEach((wf, i) => {
    console.log(`   ${i+1}. ${wf.nombre}`);
    console.log(`      Trigger: ${wf.trigger.keywords.join(', ')}`);
    console.log(`      Steps: ${wf.steps.length}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Configuración completada');
}

main().catch(console.error);
