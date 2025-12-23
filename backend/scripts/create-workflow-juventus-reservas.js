import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const apiConfigSchema = new mongoose.Schema({}, { strict: false });
const ApiConfiguration = mongoose.model('ApiConfiguration', apiConfigSchema, 'api_configurations');

async function createWorkflowReservasJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar la API de Mis Canchas
    const api = await ApiConfiguration.findOne({ 
      nombre: /Mis Canchas/i 
    });

    if (!api) {
      console.error('❌ No se encontró la API de Mis Canchas');
      process.exit(1);
    }

    console.log('📋 API encontrada:', api.nombre);

    // Buscar endpoints necesarios
    const endpointDeportes = api.endpoints.find(ep => 
      ep.nombre.toLowerCase().includes('deporte')
    );
    const endpointDisponibilidad = api.endpoints.find(ep => 
      ep.nombre.toLowerCase().includes('disponibilidad')
    );
    const endpointCrearReserva = api.endpoints.find(ep => 
      ep.path && (ep.path.includes('booking') || ep.path === '/bookings')
    );
    const endpointPrecios = api.endpoints.find(ep => 
      ep.nombre.toLowerCase().includes('precio')
    );

    console.log('🔍 Buscando endpoint de crear reserva...');
    console.log('   Endpoints disponibles:', api.endpoints.map(ep => ({ nombre: ep.nombre, path: ep.path })));

    console.log('📍 Endpoints encontrados:');
    console.log('   - Deportes:', endpointDeportes?.nombre || '❌ No encontrado');
    console.log('   - Disponibilidad:', endpointDisponibilidad?.nombre || '❌ No encontrado');
    console.log('   - Crear Reserva:', endpointCrearReserva?.nombre || '❌ No encontrado');
    console.log('   - Precios:', endpointPrecios?.nombre || '❌ No encontrado');

    // Crear workflow
    const workflow = {
      id: `workflow-juventus-reservas-${Date.now()}`,
      nombre: 'Reservas Juventus - Completo',
      descripcion: 'Flujo completo de reservas de canchas con consulta de disponibilidad y pago',
      activo: true,
      trigger: {
        tipo: 'palabras_clave',
        palabras: ['reservar', 'turno', 'cancha', 'reserva', 'precio', 'precios', 'cuanto sale', 'disponibilidad']
      },
      prioridad: 20,
      mensajeInicial: '¡Hola! 👋 Te ayudo a reservar tu cancha en Club Juventus.\n\n¿Qué te gustaría hacer?',
      steps: [
        // PASO 1: Recopilar - Acción inicial
        {
          id: 'paso-1-accion',
          orden: 1,
          tipo: 'recopilar',
          nombre: 'Acción Inicial',
          descripcion: 'Usuario elige entre reservar o consultar precios',
          nombreVariable: 'accion_inicial',
          recopilacion: {
            tipo: 'opciones',
            mensaje: '¿Qué te gustaría hacer?',
            opciones: [
              { valor: 'reservar', etiqueta: '🎾 Reservar cancha' },
              { valor: 'precios', etiqueta: '💰 Consultar precios' }
            ],
            validacion: {
              requerido: true,
              mensajeError: 'Por favor selecciona una opción'
            }
          }
        },

        // PASO 2: Ejecutar - Obtener deportes disponibles
        {
          id: 'paso-2-deportes',
          orden: 2,
          tipo: 'consulta_filtrada',
          nombre: 'Obtener Deportes',
          descripcion: 'Obtiene la lista de deportes disponibles',
          nombreVariable: 'deportes_disponibles',
          endpointId: endpointDeportes?.id,
          parametros: {},
          transformacion: {
            tipo: 'extraer_campo',
            campo: 'deportes'
          }
        },

        // PASO 3: Recopilar - Elegir deporte
        {
          id: 'paso-3-deporte',
          orden: 3,
          tipo: 'recopilar',
          nombre: 'Elegir Deporte',
          descripcion: 'Usuario selecciona el deporte',
          nombreVariable: 'deporte_elegido',
          recopilacion: {
            tipo: 'opciones_dinamicas',
            mensaje: '¿Qué deporte te gustaría jugar?',
            origenDatos: 'deportes_disponibles',
            campoValor: 'id',
            campoEtiqueta: 'nombre',
            formatoEtiqueta: '{icono} {nombre}',
            validacion: {
              requerido: true,
              mensajeError: 'Por favor selecciona un deporte'
            }
          }
        },

        // PASO 4: Recopilar - Fecha
        {
          id: 'paso-4-fecha',
          orden: 4,
          tipo: 'recopilar',
          nombre: 'Elegir Fecha',
          descripcion: 'Usuario ingresa la fecha deseada',
          nombreVariable: 'fecha_elegida',
          recopilacion: {
            tipo: 'fecha',
            mensaje: '¿Para qué día querés reservar?\n\nPodés escribir:\n- Una fecha (ej: 25/12)\n- "hoy", "mañana"\n- Un día de la semana (ej: "viernes")',
            validacion: {
              requerido: true,
              fechaMinima: 'hoy',
              fechaMaxima: '+30d',
              mensajeError: 'Por favor ingresa una fecha válida (hoy o hasta 30 días adelante)'
            }
          }
        },

        // PASO 5: Recopilar - Duración
        {
          id: 'paso-5-duracion',
          orden: 5,
          tipo: 'recopilar',
          nombre: 'Duración del Partido',
          descripcion: 'Usuario selecciona duración',
          nombreVariable: 'duracion_elegida',
          recopilacion: {
            tipo: 'opciones',
            mensaje: '¿Cuánto tiempo querés jugar?',
            opciones: [
              { valor: '60', etiqueta: '⏱️ 1 hora (60 min)' },
              { valor: '90', etiqueta: '⏱️ 1 hora y media (90 min)' },
              { valor: '120', etiqueta: '⏱️ 2 horas (120 min)' }
            ],
            validacion: {
              requerido: true,
              mensajeError: 'Por favor selecciona una duración'
            }
          }
        },

        // PASO 6: Recopilar - Hora
        {
          id: 'paso-6-hora',
          orden: 6,
          tipo: 'recopilar',
          nombre: 'Hora Preferida',
          descripcion: 'Usuario ingresa hora deseada',
          nombreVariable: 'hora_elegida',
          recopilacion: {
            tipo: 'texto',
            mensaje: '¿A qué hora preferís jugar? (formato 24hs, ej: 19:00)',
            validacion: {
              requerido: true,
              patron: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              mensajeError: 'Por favor ingresa una hora válida (ej: 19:00)'
            }
          }
        },

        // PASO 7: Ejecutar - Consultar disponibilidad
        {
          id: 'paso-7-disponibilidad',
          orden: 7,
          tipo: 'consulta_filtrada',
          nombre: 'Consultar Disponibilidad',
          descripcion: 'Consulta canchas disponibles según criterios',
          nombreVariable: 'canchas_disponibles',
          endpointId: endpointDisponibilidad?.id,
          parametros: {
            query: {
              fecha: '{{fecha_elegida}}',
              deporte: '{{deporte_elegido}}',
              duracion: '{{duracion_elegida}}',
              hora_inicio: '{{hora_elegida}}'
            }
          },
          transformacion: {
            tipo: 'extraer_campo',
            campo: 'canchas_disponibles'
          },
          condiciones: [
            {
              campo: 'canchas_disponibles',
              operador: 'vacio',
              accion: 'mostrar_mensaje',
              mensaje: '😔 No hay canchas disponibles para {{fecha_elegida}} a las {{hora_elegida}}.\n\n¿Qué querés hacer?',
              opciones: [
                { valor: 'otra_hora', etiqueta: '🕐 Probar otra hora' },
                { valor: 'otro_dia', etiqueta: '📅 Elegir otro día' },
                { valor: 'ver_disponibles', etiqueta: '👀 Ver horarios disponibles del día' }
              ],
              siguiente_paso: 'paso-8-alternativas'
            }
          ]
        },

        // PASO 8: Recopilar - Manejar alternativas
        {
          id: 'paso-8-alternativas',
          orden: 8,
          tipo: 'recopilar',
          nombre: 'Alternativas',
          descripcion: 'Usuario elige qué hacer si no hay disponibilidad',
          nombreVariable: 'alternativa_elegida',
          condicion: {
            campo: 'canchas_disponibles',
            operador: 'vacio'
          },
          recopilacion: {
            tipo: 'opciones',
            mensaje: '¿Qué querés hacer?',
            opciones: [
              { valor: 'otra_hora', etiqueta: '🕐 Probar otra hora', siguiente_paso: 'paso-6-hora' },
              { valor: 'otro_dia', etiqueta: '📅 Elegir otro día', siguiente_paso: 'paso-4-fecha' },
              { valor: 'ver_disponibles', etiqueta: '👀 Ver horarios disponibles' }
            ]
          }
        },

        // PASO 9: Ejecutar - Mostrar disponibilidad del día (si eligió ver disponibles)
        {
          id: 'paso-9-disponibilidad-dia',
          orden: 9,
          tipo: 'consulta_filtrada',
          nombre: 'Disponibilidad del Día',
          descripcion: 'Muestra todos los horarios disponibles del día',
          nombreVariable: 'horarios_dia',
          condicion: {
            campo: 'alternativa_elegida',
            operador: 'igual',
            valor: 'ver_disponibles'
          },
          endpointId: endpointDisponibilidad?.id,
          parametros: {
            query: {
              fecha: '{{fecha_elegida}}',
              deporte: '{{deporte_elegido}}',
              duracion: '{{duracion_elegida}}'
            }
          }
        },

        // PASO 10: Recopilar - Elegir cancha disponible
        {
          id: 'paso-10-elegir-cancha',
          orden: 10,
          tipo: 'recopilar',
          nombre: 'Elegir Cancha',
          descripcion: 'Usuario selecciona una cancha disponible',
          nombreVariable: 'cancha_elegida',
          condicion: {
            campo: 'canchas_disponibles',
            operador: 'no_vacio'
          },
          recopilacion: {
            tipo: 'opciones_dinamicas',
            mensaje: '¡Perfecto! Estas canchas están disponibles:\n\n{{#canchas_disponibles}}\n🎾 {{nombre}} - {{tipo}}\n💰 ${{precio_hora}}/hora\n⏰ Horarios: {{horarios_disponibles}}\n{{/canchas_disponibles}}\n\n¿Cuál querés reservar?',
            origenDatos: 'canchas_disponibles',
            campoValor: 'id',
            campoEtiqueta: 'nombre',
            formatoEtiqueta: '{nombre} - ${precio_hora}',
            validacion: {
              requerido: true,
              mensajeError: 'Por favor selecciona una cancha'
            }
          }
        },

        // PASO 11: Recopilar - Datos del cliente
        {
          id: 'paso-11-datos-cliente',
          orden: 11,
          tipo: 'recopilar',
          nombre: 'Datos del Cliente',
          descripcion: 'Recopilar nombre, teléfono y email',
          nombreVariable: 'datos_cliente',
          recopilacion: {
            tipo: 'formulario',
            mensaje: 'Perfecto! Necesito algunos datos para confirmar tu reserva:',
            campos: [
              {
                nombre: 'nombre',
                etiqueta: 'Nombre completo',
                tipo: 'texto',
                requerido: true
              },
              {
                nombre: 'telefono',
                etiqueta: 'Teléfono (con código de área)',
                tipo: 'telefono',
                requerido: true,
                patron: '^549[0-9]{10}$'
              },
              {
                nombre: 'email',
                etiqueta: 'Email',
                tipo: 'email',
                requerido: true
              }
            ]
          }
        },

        // PASO 12: Ejecutar - Crear reserva
        {
          id: 'paso-12-crear-reserva',
          orden: 12,
          tipo: 'consulta_filtrada',
          nombre: 'Crear Reserva',
          descripcion: 'Crea la reserva en el sistema',
          nombreVariable: 'reserva_creada',
          endpointId: endpointCrearReserva?.id,
          parametros: {
            body: {
              cancha_id: '{{cancha_elegida}}',
              fecha: '{{fecha_elegida}}',
              hora_inicio: '{{hora_elegida}}',
              duracion: '{{duracion_elegida}}',
              cliente: {
                nombre: '{{datos_cliente.nombre}}',
                telefono: '{{datos_cliente.telefono}}',
                email: '{{datos_cliente.email}}'
              },
              origen: 'whatsapp'
            }
          },
          mensajeExito: '✅ ¡Reserva creada exitosamente!\n\n📋 Resumen:\n🎾 Cancha: {{cancha_elegida}}\n📅 Fecha: {{fecha_elegida}}\n⏰ Hora: {{hora_elegida}}\n⏱️ Duración: {{duracion_elegida}} min\n\n💰 Total: ${{reserva_creada.precio_total}}\n💵 Seña requerida: ${{reserva_creada.seña}}\n\nAhora te envío el link de pago...',
          mensajeError: '❌ Hubo un error al crear la reserva. Por favor intentá nuevamente.'
        },

        // PASO 13: Ejecutar - Generar link de pago MP
        {
          id: 'paso-13-link-pago',
          orden: 13,
          tipo: 'accion',
          nombre: 'Generar Link de Pago',
          descripcion: 'Genera link de Mercado Pago para la seña',
          nombreVariable: 'link_pago',
          accion: {
            tipo: 'mercadopago_preference',
            parametros: {
              title: 'Seña - Reserva Cancha {{deporte_elegido}}',
              description: 'Reserva para {{fecha_elegida}} a las {{hora_elegida}}',
              unit_price: '{{reserva_creada.seña}}',
              quantity: 1,
              external_reference: '{{reserva_creada.id}}',
              notification_url: '{{WEBHOOK_URL}}/mp/webhooks',
              back_urls: {
                success: '{{FRONTEND_URL}}/reserva/confirmada',
                failure: '{{FRONTEND_URL}}/reserva/error',
                pending: '{{FRONTEND_URL}}/reserva/pendiente'
              }
            }
          },
          mensajeExito: '💳 Link de pago generado:\n\n{{link_pago.init_point}}\n\n⏰ Tenés 10 minutos para completar el pago.\n\nUna vez confirmado el pago, tu reserva quedará confirmada! 🎉'
        }
      ]
    };

    // Agregar workflow a la API
    if (!api.workflows) {
      api.workflows = [];
    }

    // Eliminar workflows anteriores de reservas si existen
    api.workflows = api.workflows.filter(w => 
      !w.nombre.toLowerCase().includes('reserva') || 
      !w.nombre.toLowerCase().includes('juventus')
    );

    api.workflows.push(workflow);
    await api.save();

    console.log('\n✅ WORKFLOW CREADO EXITOSAMENTE!');
    console.log('📋 Nombre:', workflow.nombre);
    console.log('🆔 ID:', workflow.id);
    console.log('📝 Pasos:', workflow.steps.length);
    console.log('\n🎯 FLUJO CONFIGURADO:');
    workflow.steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.tipo.toUpperCase()}: ${step.nombre}`);
    });

    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('   1. Reiniciar el backend');
    console.log('   2. Probar desde WhatsApp con: "quiero reservar"');
    console.log('   3. Configurar webhook de Mercado Pago');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

createWorkflowReservasJuventus();
