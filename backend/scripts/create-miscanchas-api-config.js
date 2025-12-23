/**
 * Script para crear la configuración de API de Mis Canchas para Club Juventus
 * 
 * Uso: node scripts/create-miscanchas-api-config.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: No se encontró MONGODB_URI en las variables de entorno');
  process.exit(1);
}

// Configuración de la API de Mis Canchas
const misCanchasApiConfig = {
  // Referencia a la empresa Club Juventus (se actualizará con el ObjectId real)
  empresaId: null, // Se llenará dinámicamente
  
  nombre: 'Mis Canchas API',
  descripcion: 'API para gestión de reservas de canchas deportivas - Club Juventus',
  tipo: 'rest',
  estado: 'activo',
  baseUrl: 'https://venita-unjailed-multifariously.ngrok-free.dev/api/v1',
  version: '1.0.0',
  
  // Autenticación por Bearer Token (API Key)
  autenticacion: {
    tipo: 'bearer',
    configuracion: {
      token: '', // Se debe configurar con la API Key real
      headerName: 'Authorization'
    }
  },
  
  // Endpoints disponibles
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
        ejemploExito: {
          success: true,
          deportes: [
            { id: 'paddle', nombre: 'Paddle', icono: '🎾' },
            { id: 'futbol5', nombre: 'Fútbol 5', icono: '⚽' }
          ]
        }
      },
      activo: true
    },
    
    // 2. Consultar Disponibilidad
    {
      id: 'consultar-disponibilidad',
      nombre: 'Consultar Disponibilidad',
      descripcion: 'Consulta la disponibilidad de canchas para una fecha y deporte',
      metodo: 'GET',
      path: '/disponibilidad',
      parametros: {
        path: [],
        query: [
          {
            nombre: 'fecha',
            tipo: 'string',
            requerido: true,
            descripcion: 'Fecha en formato YYYY-MM-DD'
          },
          {
            nombre: 'deporte',
            tipo: 'string',
            requerido: true,
            descripcion: 'ID del deporte (ej: paddle, futbol5)'
          },
          {
            nombre: 'hora_inicio',
            tipo: 'string',
            requerido: false,
            descripcion: 'Hora específica HH:MM (opcional)'
          },
          {
            nombre: 'duracion',
            tipo: 'number',
            requerido: false,
            descripcion: 'Duración en minutos (60, 90, 120). Default: 60',
            valorPorDefecto: 60
          }
        ],
        headers: {}
      },
      respuesta: {
        ejemploExito: {
          success: true,
          fecha: '2025-12-23',
          deporte: 'paddle',
          canchas_disponibles: [
            {
              id: 'uuid-cancha-1',
              nombre: 'Cancha 1 - Paddle',
              tipo: 'techada',
              horarios_disponibles: [
                { hora: '08:00', duraciones: [60, 90, 120] },
                { hora: '19:00', duraciones: [60] }
              ],
              precio_hora: 15000,
              precio_hora_y_media: 20000,
              precio_dos_horas: 25000
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
      descripcion: 'Crea una pre-reserva que bloquea el horario por 10 minutos',
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
            cancha_id: 'uuid-cancha-1',
            fecha: '2025-12-23',
            hora_inicio: '19:00',
            duracion: 60,
            cliente: {
              nombre: 'Juan Pérez',
              telefono: '5493794123456'
            },
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
            cancha: 'Cancha 1 - Paddle',
            fecha: '2025-12-23',
            hora_inicio: '19:00',
            hora_fin: '20:00',
            duracion: 60,
            precio_total: 15000,
            seña_requerida: 5000
          }
        }
      },
      activo: true
    },
    
    // 4. Confirmar Reserva
    {
      id: 'confirmar-reserva',
      nombre: 'Confirmar Reserva',
      descripcion: 'Confirma una reserva después del pago',
      metodo: 'PUT',
      path: '/reservas/:reserva_id/confirmar',
      parametros: {
        path: [
          {
            nombre: 'reserva_id',
            tipo: 'string',
            requerido: true,
            descripcion: 'ID de la reserva a confirmar'
          }
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
          },
          ejemplo: {
            pago: {
              id: 'mp_payment_123456',
              monto: 5000,
              metodo: 'mercadopago',
              estado: 'approved'
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
          codigo_reserva: 'MC-2025-ABC12345',
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
          {
            nombre: 'reserva_id',
            tipo: 'string',
            requerido: true,
            descripcion: 'ID de la reserva a cancelar'
          }
        ],
        query: [],
        headers: {}
      },
      respuesta: {
        ejemploExito: {
          success: true,
          message: 'Reserva cancelada'
        }
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
          {
            nombre: 'deporte',
            tipo: 'string',
            requerido: false,
            descripcion: 'Filtrar por deporte'
          },
          {
            nombre: 'cancha_id',
            tipo: 'string',
            requerido: false,
            descripcion: 'Filtrar por cancha específica'
          }
        ],
        headers: {}
      },
      respuesta: {
        ejemploExito: {
          success: true,
          precios: [
            {
              cancha_id: 'uuid-cancha-1',
              cancha_nombre: 'Cancha 1 - Paddle',
              deporte: 'Paddle',
              precios: {
                '60': 15000,
                '90': 20000,
                '120': 25000
              },
              seña_porcentaje: 33
            }
          ],
          seña_minima: 5000
        }
      },
      activo: true
    }
  ],
  
  // Workflow para el flujo de reserva por WhatsApp
  workflows: [
    {
      id: 'workflow-reserva-canchas',
      nombre: 'Reserva de Canchas',
      descripcion: 'Flujo completo de reserva de canchas por WhatsApp',
      activo: true,
      trigger: {
        tipo: 'keyword',
        keywords: ['reservar', 'cancha', 'turno', 'paddle', 'futbol', 'fútbol', 'tenis']
      },
      prioridad: 10,
      mensajeInicial: '¡Hola! 👋 Te ayudo a reservar tu cancha.',
      
      steps: [
        // Paso 1: Seleccionar deporte
        {
          orden: 1,
          tipo: 'recopilar',
          nombre: 'Seleccionar Deporte',
          pregunta: '🏆 *¿Qué deporte querés jugar?*\n\nEscribí el número de la opción:',
          nombreVariable: 'deporte_id',
          endpointId: 'obtener-deportes',
          endpointResponseConfig: {
            arrayPath: 'deportes',
            idField: 'id',
            displayField: 'nombre'
          },
          plantillaOpciones: '{{numero}}. {{icono}} {{nombre}}',
          validacion: {
            tipo: 'opcion',
            mensajeError: 'Por favor, elegí un deporte de la lista.'
          }
        },
        
        // Paso 2: Ingresar fecha
        {
          orden: 2,
          tipo: 'input',
          nombre: 'Ingresar Fecha',
          pregunta: '📅 *¿Para qué fecha querés reservar?*\n\nEscribí la fecha en formato DD/MM/AAAA\no escribí "hoy" o "mañana"',
          nombreVariable: 'fecha',
          validacion: {
            tipo: 'regex',
            regex: '^(hoy|mañana|manana|\\d{1,2}/\\d{1,2}/\\d{4})$',
            mensajeError: 'Formato inválido. Usá DD/MM/AAAA o escribí "hoy" o "mañana".'
          }
        },
        
        // Paso 3: Seleccionar duración
        {
          orden: 3,
          tipo: 'input',
          nombre: 'Seleccionar Duración',
          pregunta: '⏳ *¿Cuánto tiempo querés reservar?*\n\n1️⃣ 1 hora\n2️⃣ 1 hora 30 minutos\n3️⃣ 2 horas\n\nEscribí el número:',
          nombreVariable: 'duracion',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3'],
            mensajeError: 'Por favor, escribí 1, 2 o 3.'
          }
        },
        
        // Paso 4: Seleccionar hora
        {
          orden: 4,
          tipo: 'input',
          nombre: 'Seleccionar Hora',
          pregunta: '⏰ *¿A qué hora querés comenzar?*\n\nEscribí la hora en formato 24hs (ej: 19:00)\nHorario disponible: 08:00 a 23:00',
          nombreVariable: 'hora_inicio',
          validacion: {
            tipo: 'regex',
            regex: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
            mensajeError: 'Formato inválido. Usá HH:MM (ej: 19:00).'
          }
        },
        
        // Paso 5: Consultar disponibilidad y mostrar canchas
        {
          orden: 5,
          tipo: 'consulta_filtrada',
          nombre: 'Mostrar Canchas Disponibles',
          pregunta: '🏟️ *Canchas disponibles:*\n\nEscribí el número de la cancha:',
          nombreVariable: 'cancha_id',
          endpointId: 'consultar-disponibilidad',
          mapeoParametros: {
            fecha: '{{fecha_formateada}}',
            deporte: '{{deporte_id}}',
            duracion: '{{duracion_minutos}}'
          },
          endpointResponseConfig: {
            arrayPath: 'canchas_disponibles',
            idField: 'id',
            displayField: 'nombre'
          },
          plantillaOpciones: '{{numero}}. {{nombre}} - ${{precio_hora}}/hora',
          validacion: {
            tipo: 'opcion',
            mensajeError: 'Por favor, elegí una cancha de la lista.'
          }
        },
        
        // Paso 6: Confirmación
        {
          orden: 6,
          tipo: 'confirmacion',
          nombre: 'Confirmar Reserva',
          pregunta: '✅ *Revisá tu reserva:*\n\n📅 Fecha: {{fecha}}\n⏰ Hora: {{hora_inicio}}\n⏳ Duración: {{duracion_texto}}\n🏟️ Cancha: {{cancha_nombre}}\n💰 Precio: ${{precio}}\n\n*¿Confirmamos?*\n\n1️⃣ Sí, confirmar\n2️⃣ Cancelar',
          nombreVariable: 'confirmacion',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2'],
            mensajeError: 'Por favor, escribí 1 o 2.'
          }
        }
      ],
      
      mensajeFinal: '🎉 *¡Reserva confirmada!*\n\nTe esperamos el {{fecha}} a las {{hora_inicio}} en {{cancha_nombre}}.\n\n¡Gracias por reservar con nosotros!',
      mensajeAbandonar: 'Reserva cancelada. Si querés hacer otra reserva, escribí "reservar".',
      permitirAbandonar: true,
      timeoutMinutos: 15
    }
  ],
  
  // Configuración general
  configuracion: {
    timeout: 30000,
    reintentos: 3,
    reintentarEn: [1000, 2000, 4000]
  },
  
  // Estadísticas iniciales
  estadisticas: {
    totalLlamadas: 0,
    llamadasExitosas: 0,
    llamadasFallidas: 0,
    tiempoPromedioRespuesta: 0
  }
};

async function main() {
  console.log('🔧 Script para crear configuración de API de Mis Canchas');
  console.log('=========================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    // 1. Buscar la empresa Club Juventus
    console.log('🔍 Buscando empresa Club Juventus...');
    const empresasCollection = db.collection('empresas');
    const empresa = await empresasCollection.findOne({ nombre: { $regex: /juventus/i } });
    
    if (!empresa) {
      console.error('❌ No se encontró la empresa Club Juventus');
      process.exit(1);
    }
    
    console.log(`   ✅ Encontrada: ${empresa.nombre} (ID: ${empresa._id})`);
    
    // 2. Verificar si ya existe una configuración de API para esta empresa
    const apiConfigCollection = db.collection('api_configurations');
    const existingConfig = await apiConfigCollection.findOne({ 
      empresaId: empresa._id,
      nombre: 'Mis Canchas API'
    });
    
    if (existingConfig) {
      console.log('\n⚠️  Ya existe una configuración de API para esta empresa.');
      console.log('   ¿Desea actualizarla? (El script la actualizará automáticamente)');
      
      // Actualizar la configuración existente
      misCanchasApiConfig.empresaId = empresa._id;
      
      const result = await apiConfigCollection.updateOne(
        { _id: existingConfig._id },
        { 
          $set: {
            ...misCanchasApiConfig,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('\n✅ Configuración de API actualizada exitosamente');
      } else {
        console.log('\n⚠️  No se realizaron cambios (ya estaba actualizada)');
      }
    } else {
      // Crear nueva configuración
      misCanchasApiConfig.empresaId = empresa._id;
      misCanchasApiConfig.createdAt = new Date();
      misCanchasApiConfig.updatedAt = new Date();
      
      const result = await apiConfigCollection.insertOne(misCanchasApiConfig);
      console.log(`\n✅ Configuración de API creada exitosamente (ID: ${result.insertedId})`);
    }
    
    // 3. Mostrar resumen
    console.log('\n📋 Resumen de la configuración:');
    console.log('-'.repeat(50));
    console.log(`   Empresa: ${empresa.nombre}`);
    console.log(`   API Base URL: ${misCanchasApiConfig.baseUrl}`);
    console.log(`   Endpoints configurados: ${misCanchasApiConfig.endpoints.length}`);
    misCanchasApiConfig.endpoints.forEach((ep, i) => {
      console.log(`      ${i + 1}. ${ep.metodo} ${ep.path} - ${ep.nombre}`);
    });
    console.log(`   Workflows configurados: ${misCanchasApiConfig.workflows.length}`);
    
    console.log('\n⚠️  IMPORTANTE: Debes configurar la API Key en la autenticación.');
    console.log('   Ejecuta el siguiente comando para actualizar la API Key:');
    console.log('\n   db.api_configurations.updateOne(');
    console.log(`     { empresaId: ObjectId("${empresa._id}") },`);
    console.log('     { $set: { "autenticacion.configuracion.token": "TU_API_KEY_AQUI" } }');
    console.log('   )');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

main();
