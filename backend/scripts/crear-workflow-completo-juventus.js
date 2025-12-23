import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowCompletoJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // Buscar API de Mis Canchas
    const apiConfig = await db.collection('api_configurations').findOne({ 
      nombre: /mis canchas/i 
    });

    if (!apiConfig) {
      console.error('❌ No se encontró API de Mis Canchas');
      process.exit(1);
    }

    console.log('📋 API encontrada:', apiConfig.nombre);

    // Buscar endpoints
    const endpoints = apiConfig.endpoints || [];
    console.log('📋 Endpoints disponibles:', endpoints.length);

    const getEndpointId = (nombre) => {
      const ep = endpoints.find(e => e.nombre.toLowerCase().includes(nombre.toLowerCase()));
      return ep?._id?.toString() || ep?.id || null;
    };

    // Workflow completo con 11 pasos
    const workflowCompleto = {
      _id: new mongoose.Types.ObjectId(),
      nombre: 'Juventus - Reserva de Canchas',
      descripcion: 'Flujo completo para reservar canchas en Club Juventus',
      activo: true,
      prioridad: 25,
      trigger: {
        tipo: 'keyword',
        keywords: ['reservar', 'turno', 'cancha', 'reserva', 'quiero reservar', 'hola', 'menu']
      },
      pasos: [
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 1,
          nombre: 'Bienvenida y solicitar fecha',
          tipo: 'recopilar_dato',
          configuracion: {
            variable: 'fecha',
            mensaje: '¡Hola! 👋\nBienvenido a Club Juventus 🎾\n\nTe ayudo a reservar tu cancha en pocos pasos.\n\n📅 ¿Para qué fecha querés reservar?\n\nEscribí la fecha en formato DD/MM/AAAA\no escribí "hoy" o "mañana"',
            validacion: {
              tipo: 'fecha',
              formatosAceptados: ['DD/MM/YYYY', 'hoy', 'mañana'],
              mensajeError: '❌ Formato de fecha no válido.\nPor favor escribí la fecha como DD/MM/AAAA o escribí "hoy" o "mañana"'
            }
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 2,
          nombre: 'Consultar disponibilidad',
          tipo: 'ejecutar_endpoint',
          configuracion: {
            endpointId: getEndpointId('disponibilidad'),
            parametros: {
              fecha: '{{fecha}}'
            },
            guardarEn: 'disponibilidad',
            mensajeEspera: '🔍 Consultando disponibilidad...'
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 3,
          nombre: 'Mostrar canchas disponibles',
          tipo: 'recopilar_dato',
          configuracion: {
            variable: 'cancha_id',
            mensaje: '🏟️ Canchas disponibles para el {{fecha}}:\n\n{{#disponibilidad.canchas}}\n• {{nombre}} ({{tipo}})\n{{/disponibilidad.canchas}}\n\n¿Qué cancha querés? Escribí el nombre o número.',
            validacion: {
              tipo: 'texto',
              mensajeError: '❌ Por favor seleccioná una cancha válida de la lista.'
            }
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 4,
          nombre: 'Solicitar hora',
          tipo: 'recopilar_dato',
          configuracion: {
            variable: 'hora',
            mensaje: '⏰ ¿A qué hora querés jugar?\n\nHorarios disponibles: 08:00 a 23:00\nEscribí la hora en formato HH:MM (ej: 18:00)',
            validacion: {
              tipo: 'hora',
              formatosAceptados: ['HH:MM', 'HH:mm'],
              mensajeError: '❌ Formato de hora no válido.\nPor favor escribí la hora como HH:MM (ej: 18:00)'
            }
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 5,
          nombre: 'Solicitar duración',
          tipo: 'recopilar_dato',
          configuracion: {
            variable: 'duracion',
            mensaje: '⏱️ ¿Cuánto tiempo querés reservar?\n\n1️⃣ 1 hora\n2️⃣ 1 hora y media\n3️⃣ 2 horas\n\nEscribí 1, 2 o 3',
            validacion: {
              tipo: 'opcion',
              opciones: ['1', '2', '3', '1 hora', '1.5', '2 horas'],
              mensajeError: '❌ Por favor elegí una opción válida (1, 2 o 3)'
            }
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 6,
          nombre: 'Solicitar nombre',
          tipo: 'recopilar_dato',
          configuracion: {
            variable: 'nombre_cliente',
            mensaje: '👤 ¿A nombre de quién hacemos la reserva?',
            validacion: {
              tipo: 'texto',
              minLength: 2,
              mensajeError: '❌ Por favor ingresá un nombre válido'
            }
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 7,
          nombre: 'Confirmar datos',
          tipo: 'recopilar_dato',
          configuracion: {
            variable: 'confirmacion',
            mensaje: '📋 *Resumen de tu reserva:*\n\n📅 Fecha: {{fecha}}\n🏟️ Cancha: {{cancha_id}}\n⏰ Hora: {{hora}}\n⏱️ Duración: {{duracion}}\n👤 Nombre: {{nombre_cliente}}\n\n¿Confirmás la reserva?\nEscribí *SI* para confirmar o *NO* para cancelar',
            validacion: {
              tipo: 'confirmacion',
              opciones: ['si', 'sí', 'no', 'cancelar'],
              mensajeError: '❌ Por favor respondé SI o NO'
            }
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 8,
          nombre: 'Pre-crear reserva',
          tipo: 'ejecutar_endpoint',
          configuracion: {
            endpointId: getEndpointId('pre-crear'),
            parametros: {
              body: {
                canchaId: '{{cancha_id}}',
                fecha: '{{fecha}}',
                horaInicio: '{{hora}}',
                duracion: '{{duracion}}',
                cliente: {
                  nombre: '{{nombre_cliente}}',
                  telefono: '{{telefono_cliente}}'
                }
              }
            },
            guardarEn: 'reserva',
            mensajeEspera: '⏳ Procesando tu reserva...',
            condicion: {
              variable: 'confirmacion',
              operador: 'igual',
              valor: 'si'
            }
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 9,
          nombre: 'Generar link de pago',
          tipo: 'ejecutar_endpoint',
          configuracion: {
            endpointId: getEndpointId('pago'),
            parametros: {
              body: {
                reservaId: '{{reserva.id}}',
                monto: '{{reserva.precio}}'
              }
            },
            guardarEn: 'pago',
            mensajeEspera: '💳 Generando link de pago...'
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 10,
          nombre: 'Enviar link de pago',
          tipo: 'mensaje',
          configuracion: {
            mensaje: '✅ *¡Reserva pre-creada!*\n\n🏟️ {{cancha_id}}\n📅 {{fecha}} a las {{hora}}\n💰 Total: ${{reserva.precio}}\n\n💳 *Pagá con este link:*\n{{pago.link}}\n\n⚠️ Tenés 15 minutos para completar el pago.\nSi no se confirma, la reserva se cancelará automáticamente.'
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          orden: 11,
          nombre: 'Despedida',
          tipo: 'mensaje',
          configuracion: {
            mensaje: '¡Gracias por elegir Club Juventus! 🎾\n\nSi tenés alguna consulta, escribinos.\n\n¡Nos vemos en la cancha! 💪'
          }
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Actualizar API con el workflow completo
    await db.collection('api_configurations').updateOne(
      { _id: apiConfig._id },
      { 
        $set: { 
          workflows: [workflowCompleto]
        } 
      }
    );

    console.log('\n✅ Workflow actualizado con', workflowCompleto.pasos.length, 'pasos');
    console.log('\n📋 PASOS CREADOS:');
    workflowCompleto.pasos.forEach((paso, i) => {
      console.log(`   ${i + 1}. ${paso.nombre} (${paso.tipo})`);
    });

    console.log('\n🚀 Redesplegá en Render para probar');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

crearWorkflowCompletoJuventus();
