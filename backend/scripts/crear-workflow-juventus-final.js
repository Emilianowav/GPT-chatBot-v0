import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowJuventusFinal() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // Buscar API de Juventus
    const apiJuventus = await db.collection('api_configurations').findOne({ 
      nombre: /mis canchas/i 
    });

    if (!apiJuventus) {
      console.error('❌ No se encontró API de Juventus');
      process.exit(1);
    }

    console.log('📋 API encontrada:', apiJuventus.nombre);

    // Buscar endpoints
    const endpoints = apiJuventus.endpoints || [];
    const getEndpointId = (nombre) => {
      const ep = endpoints.find(e => e.nombre.toLowerCase().includes(nombre.toLowerCase()));
      return ep?._id?.toString() || null;
    };

    // Workflow con los 11 pasos EXACTOS que pediste
    const workflow = {
      _id: new mongoose.Types.ObjectId(),
      id: new mongoose.Types.ObjectId().toString(),
      nombre: 'Juventus - Reserva de Canchas',
      descripcion: 'Flujo completo para reservar canchas en Club Juventus',
      activo: true,
      prioridad: 25,
      trigger: {
        tipo: 'keyword',
        keywords: ['reservar', 'turno', 'cancha', 'reserva', 'quiero reservar', 'hola', 'menu']
      },
      mensajeInicial: '¡Hola! 👋\nBienvenido a Club Juventus 🎾\n\nTe ayudo a reservar tu cancha en pocos pasos.',
      steps: [
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
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 2,
          nombre: 'Consultar disponibilidad',
          tipo: 'consulta_filtrada',
          nombreVariable: 'disponibilidad',
          endpointId: getEndpointId('disponibilidad'),
          parametros: {
            fecha: '{{fecha}}'
          },
          pregunta: '🏟️ Canchas disponibles:\n\n{{opciones}}\n\n¿Qué cancha querés?',
          endpointResponseConfig: {
            valorField: 'id',
            textoField: 'nombre'
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 3,
          nombre: 'Solicitar hora',
          tipo: 'recopilar',
          nombreVariable: 'hora',
          pregunta: '⏰ ¿A qué hora querés jugar?\n\nHorarios disponibles: 08:00 a 23:00\nEscribí la hora en formato HH:MM (ej: 18:00)',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 4,
          nombre: 'Solicitar duración',
          tipo: 'recopilar',
          nombreVariable: 'duracion',
          pregunta: '⏱️ ¿Cuánto tiempo querés reservar?\n\n1️⃣ 1 hora\n2️⃣ 1 hora y media\n3️⃣ 2 horas\n\nEscribí 1, 2 o 3',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3']
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 5,
          nombre: 'Solicitar nombre',
          tipo: 'recopilar',
          nombreVariable: 'nombre_cliente',
          pregunta: '👤 ¿A nombre de quién hacemos la reserva?',
          validacion: {
            tipo: 'texto',
            requerido: true
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 6,
          nombre: 'Confirmar datos',
          tipo: 'recopilar',
          nombreVariable: 'confirmacion',
          pregunta: '📋 *Resumen de tu reserva:*\n\n📅 Fecha: {{fecha}}\n🏟️ Cancha: {{disponibilidad}}\n⏰ Hora: {{hora}}\n⏱️ Duración: {{duracion}}\n👤 Nombre: {{nombre_cliente}}\n\n¿Confirmás la reserva?\nEscribí *SI* para confirmar o *NO* para cancelar',
          validacion: {
            tipo: 'confirmacion',
            opciones: ['si', 'sí', 'SI', 'Si', 'no', 'NO', 'No']
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 7,
          nombre: 'Pre-crear reserva',
          tipo: 'ejecutar',
          nombreVariable: 'reserva',
          endpointId: getEndpointId('pre-crear'),
          parametros: {
            body: {
              canchaId: '{{disponibilidad}}',
              fecha: '{{fecha}}',
              horaInicio: '{{hora}}',
              duracion: '{{duracion}}',
              cliente: {
                nombre: '{{nombre_cliente}}',
                telefono: '{{telefono_cliente}}'
              }
            }
          },
          condicion: {
            variable: 'confirmacion',
            operador: 'igual',
            valor: 'si'
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 8,
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
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 9,
          nombre: 'Enviar link de pago',
          tipo: 'mensaje',
          mensaje: '✅ *¡Reserva pre-creada!*\n\n🏟️ {{disponibilidad}}\n📅 {{fecha}} a las {{hora}}\n💰 Total: ${{reserva.precio}}\n\n💳 *Pagá con este link:*\n{{pago.link}}\n\n⚠️ Tenés 15 minutos para completar el pago.\nSi no se confirma, la reserva se cancelará automáticamente.'
        },
        {
          _id: new mongoose.Types.ObjectId(),
          id: new mongoose.Types.ObjectId().toString(),
          orden: 10,
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
    console.log('\n📋 PASOS:');
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

crearWorkflowJuventusFinal();
