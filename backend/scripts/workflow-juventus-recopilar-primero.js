import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowRecopilarPrimero() {
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

    // Workflow: PRIMERO recopilar TODO, DESPUÉS llamar API
    const workflow = {
      _id: new mongoose.Types.ObjectId(),
      id: new mongoose.Types.ObjectId().toString(),
      nombre: 'Juventus - Reserva de Canchas',
      descripcion: 'Flujo para reservar canchas - recopila datos y luego crea la reserva',
      activo: true,
      prioridad: 25,
      trigger: {
        tipo: 'keyword',
        keywords: ['reservar', 'turno', 'cancha', 'reserva', 'quiero reservar', 'hola', 'menu']
      },
      mensajeInicial: '¡Hola! 👋\nBienvenido a Club Juventus 🎾\n\nTe ayudo a reservar tu cancha en pocos pasos.',
      steps: [
        // PASO 1: Recopilar fecha
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 1,
          nombre: 'Solicitar fecha',
          tipo: 'recopilar',
          nombreVariable: 'fecha',
          pregunta: '📅 ¿Para qué fecha querés reservar?\n\nEscribí la fecha en formato DD/MM/AAAA o escribí "hoy" o "mañana"',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        // PASO 2: Recopilar cancha_id
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 2,
          nombre: 'Solicitar cancha',
          tipo: 'recopilar',
          nombreVariable: 'cancha_id',
          pregunta: '🏟️ ¿Qué cancha querés reservar?\n\nEscribí el ID o nombre de la cancha',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        // PASO 3: Recopilar hora_inicio
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 3,
          nombre: 'Solicitar hora',
          tipo: 'recopilar',
          nombreVariable: 'hora_inicio',
          pregunta: '⏰ ¿A qué hora querés jugar?\n\nHorarios disponibles: 08:00 a 23:00\nEscribí la hora en formato HH:MM (ej: 19:00)',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        // PASO 4: Recopilar duración
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 4,
          nombre: 'Solicitar duración',
          tipo: 'recopilar',
          nombreVariable: 'duracion',
          pregunta: '⏱️ ¿Cuánto tiempo querés reservar?\n\n1️⃣ 60 minutos (1 hora)\n2️⃣ 90 minutos (1 hora y media)\n3️⃣ 120 minutos (2 horas)\n\nEscribí 60, 90 o 120',
          validacion: {
            tipo: 'opcion',
            opciones: ['60', '90', '120']
          }
        },
        // PASO 5: Recopilar nombre del cliente
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 5,
          nombre: 'Solicitar nombre',
          tipo: 'recopilar',
          nombreVariable: 'cliente_nombre',
          pregunta: '👤 ¿A nombre de quién hacemos la reserva?',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        // PASO 6: Recopilar teléfono del cliente
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 6,
          nombre: 'Solicitar teléfono',
          tipo: 'recopilar',
          nombreVariable: 'cliente_telefono',
          pregunta: '📱 ¿Cuál es tu número de teléfono?\n\nEscribí el número con código de área (ej: 5493794123456)',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        // PASO 7: Confirmar datos
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 7,
          nombre: 'Confirmar datos',
          tipo: 'recopilar',
          nombreVariable: 'confirmacion',
          pregunta: '📋 *Resumen de tu reserva:*\n\n📅 Fecha: {{fecha}}\n🏟️ Cancha: {{cancha_id}}\n⏰ Hora: {{hora_inicio}}\n⏱️ Duración: {{duracion}} minutos\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n\n¿Confirmás la reserva?\nEscribí *SI* para confirmar o *NO* para cancelar',
          validacion: {
            tipo: 'confirmacion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        // PASO 8: Pre-crear reserva (EJECUTAR API)
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 8,
          nombre: 'Pre-crear reserva',
          tipo: 'ejecutar',
          nombreVariable: 'reserva',
          endpointId: getEndpointId('pre-crear'),
          parametros: {
            body: {
              cancha_id: '{{cancha_id}}',
              fecha: '{{fecha}}',
              hora_inicio: '{{hora_inicio}}',
              duracion: '{{duracion}}',
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
        // PASO 9: Generar link de pago
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 9,
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
        // PASO 10: Enviar link de pago
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 10,
          nombre: 'Enviar link de pago',
          tipo: 'mensaje',
          mensaje: '✅ *¡Reserva pre-creada!*\n\n🏟️ Cancha {{cancha_id}}\n📅 {{fecha}} a las {{hora_inicio}}\n💰 Total: ${{reserva.precio}}\n\n💳 *Pagá con este link:*\n{{pago.link}}\n\n⚠️ Tenés 15 minutos para completar el pago.\nSi no se confirma, la reserva se cancelará automáticamente.'
        },
        // PASO 11: Despedida
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 11,
          nombre: 'Despedida',
          tipo: 'mensaje',
          mensaje: '¡Gracias por elegir Club Juventus! 🎾\n\nSi tenés alguna consulta, escribinos.\n\n¡Nos vemos en la cancha! 💪'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('\n📋 WORKFLOW CREADO:');
    console.log('   Nombre:', workflow.nombre);
    console.log('   Steps:', workflow.steps.length);
    console.log('\n📋 ORDEN DE PASOS:');
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

crearWorkflowRecopilarPrimero();
