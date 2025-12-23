import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowFlujoCorrecto() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    const apiJuventus = await db.collection('api_configurations').findOne({ 
      nombre: /mis canchas/i 
    });

    if (!apiJuventus) {
      console.error('❌ No se encontró API de Juventus');
      process.exit(1);
    }

    const endpoints = apiJuventus.endpoints || [];
    const getEndpointId = (nombre) => {
      const ep = endpoints.find(e => e.nombre.toLowerCase().includes(nombre.toLowerCase()));
      return ep?._id?.toString() || null;
    };

    // Workflow según el flujo especificado
    const workflow = {
      _id: new mongoose.Types.ObjectId(),
      id: new mongoose.Types.ObjectId().toString(),
      nombre: 'Juventus - Reserva de Canchas',
      descripcion: 'Flujo de reserva: deporte -> fecha -> duración/hora -> consultar disponibilidad -> confirmar -> pago',
      activo: true,
      prioridad: 25,
      trigger: {
        tipo: 'keyword',
        keywords: ['reservar', 'turno', 'cancha', 'reserva', 'quiero reservar', 'hola', 'menu']
      },
      mensajeInicial: '¡Hola! 👋\nBienvenido a Club Juventus 🎾\n\nTe ayudo a reservar tu cancha.',
      steps: [
        // PASO 1: Elegir deporte
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 1,
          nombre: 'Elegir deporte',
          tipo: 'recopilar',
          nombreVariable: 'deporte',
          pregunta: '🎾 ¿Qué deporte querés jugar?\n\n1️⃣ Tenis\n2️⃣ Paddle\n3️⃣ Fútbol\n\nEscribí el número o el nombre del deporte',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', 'tenis', 'paddle', 'futbol', 'fútbol']
          }
        },
        // PASO 2: Elegir fecha
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 2,
          nombre: 'Elegir fecha',
          tipo: 'recopilar',
          nombreVariable: 'fecha',
          pregunta: '📅 ¿Para qué fecha querés reservar?\n\nEscribí la fecha en formato DD/MM/AAAA o escribí "hoy" o "mañana"',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        // PASO 3: Duración del partido
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 3,
          nombre: 'Duración del partido',
          tipo: 'recopilar',
          nombreVariable: 'duracion',
          pregunta: '⏱️ ¿Cuánto tiempo querés jugar?\n\n1️⃣ 60 minutos (1 hora)\n2️⃣ 90 minutos (1 hora y media)\n3️⃣ 120 minutos (2 horas)\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '60', '90', '120']
          }
        },
        // PASO 4: Hora preferida
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 4,
          nombre: 'Hora preferida',
          tipo: 'recopilar',
          nombreVariable: 'hora_preferida',
          pregunta: '⏰ ¿A qué hora preferís jugar?\n\nHorarios disponibles: 08:00 a 23:00\nEscribí la hora en formato HH:MM (ej: 19:00)',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        // PASO 5: Consultar disponibilidad (EJECUTAR API)
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 5,
          nombre: 'Consultar disponibilidad',
          tipo: 'consulta_filtrada',
          nombreVariable: 'turno_seleccionado',
          endpointId: getEndpointId('disponibilidad'),
          parametros: {
            fecha: '{{fecha}}',
            deporte: '{{deporte}}',
            hora: '{{hora_preferida}}',
            duracion: '{{duracion}}'
          },
          pregunta: '🏟️ *Turnos disponibles:*\n\n{{opciones}}\n\n¿Cuál turno querés reservar?\nEscribí el número',
          endpointResponseConfig: {
            valorField: 'id',
            textoField: 'descripcion'
          },
          mensajeAlternativo: '⚠️ No hay turnos disponibles para esa hora.\n\n¿Querés ver otras opciones?\nEscribí *SI* para ver otros horarios o *NO* para cancelar'
        },
        // PASO 6: Solicitar nombre
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 6,
          nombre: 'Solicitar nombre',
          tipo: 'recopilar',
          nombreVariable: 'cliente_nombre',
          pregunta: '👤 ¿A nombre de quién hacemos la reserva?',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        // PASO 7: Solicitar teléfono
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 7,
          nombre: 'Solicitar teléfono',
          tipo: 'recopilar',
          nombreVariable: 'cliente_telefono',
          pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        // PASO 8: Confirmar reserva
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 8,
          nombre: 'Confirmar reserva',
          tipo: 'recopilar',
          nombreVariable: 'confirmacion',
          pregunta: '📋 *Resumen de tu reserva:*\n\n🎾 Deporte: {{deporte}}\n📅 Fecha: {{fecha}}\n⏰ Hora: {{hora_preferida}}\n⏱️ Duración: {{duracion}} minutos\n🏟️ Turno: {{turno_seleccionado}}\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n\n¿Confirmás la reserva?\nEscribí *SI* para confirmar o *NO* para cancelar',
          validacion: {
            tipo: 'confirmacion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        // PASO 9: Pre-crear reserva (EJECUTAR API)
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 9,
          nombre: 'Pre-crear reserva',
          tipo: 'ejecutar',
          nombreVariable: 'reserva',
          endpointId: getEndpointId('pre-crear'),
          parametros: {
            body: {
              turno_id: '{{turno_seleccionado}}',
              fecha: '{{fecha}}',
              hora_inicio: '{{hora_preferida}}',
              duracion: '{{duracion}}',
              deporte: '{{deporte}}',
              cliente: {
                nombre: '{{cliente_nombre}}',
                telefono: '{{cliente_telefono}}'
              },
              origen: 'whatsapp'
            }
          },
          condicion: {
            variable: 'confirmacion',
            operador: 'igual',
            valor: 'si'
          }
        },
        // PASO 10: Generar link de pago (EJECUTAR API)
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 10,
          nombre: 'Generar link de pago',
          tipo: 'ejecutar',
          nombreVariable: 'pago',
          endpointId: getEndpointId('pago'),
          parametros: {
            body: {
              reservaId: '{{reserva.id}}',
              monto: '{{reserva.precio}}'
            }
          }
        },
        // PASO 11: Enviar link de pago
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 11,
          nombre: 'Enviar link de pago',
          tipo: 'mensaje',
          mensaje: '✅ *¡Reserva confirmada!*\n\n🎾 {{deporte}}\n🏟️ {{turno_seleccionado}}\n📅 {{fecha}} a las {{hora_preferida}}\n💰 Seña: ${{reserva.precio}}\n\n💳 *Pagá la seña con este link:*\n{{pago.link}}\n\n⚠️ Tenés 15 minutos para completar el pago.\nSi no se confirma, la reserva se cancelará automáticamente.'
        },
        // PASO 12: Despedida
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 12,
          nombre: 'Despedida',
          tipo: 'mensaje',
          mensaje: '¡Gracias por elegir Club Juventus! 🎾\n\nTe esperamos en la cancha.\n\nSi tenés alguna consulta, escribinos.\n\n¡Nos vemos! 💪'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('\n📋 WORKFLOW CREADO - FLUJO CORRECTO:');
    console.log('   Nombre:', workflow.nombre);
    console.log('   Steps:', workflow.steps.length);
    console.log('\n📋 FLUJO:');
    workflow.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step.nombre} (${step.tipo})`);
    });

    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: apiJuventus._id },
      { 
        $set: { 
          workflows: [workflow]
        } 
      }
    );

    console.log('\n✅ Workflow guardado en BD');

    // Verificar
    const verificar = await db.collection('api_configurations').findOne({ 
      _id: apiJuventus._id 
    });

    console.log('\n📋 VERIFICACIÓN:');
    console.log('   Workflows:', verificar.workflows?.length || 0);
    console.log('   Steps:', verificar.workflows?.[0]?.steps?.length || 0);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

crearWorkflowFlujoCorrecto();
