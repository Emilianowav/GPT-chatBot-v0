import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function setupIntercapital() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar o crear empresa Intercapital
    let empresa = await db.collection('empresas').findOne({ nombre: /intercapital/i });
    
    if (!empresa) {
      console.log('📝 Creando empresa Intercapital...');
      const result = await db.collection('empresas').insertOne({
        nombre: 'Intercapital',
        descripcion: 'Sociedad de Bolsa',
        activo: true,
        created_at: new Date()
      });
      empresa = { _id: result.insertedId, nombre: 'Intercapital' };
      console.log('✅ Empresa creada:', empresa._id);
    } else {
      console.log('✅ Empresa encontrada:', empresa._id);
    }

    // Verificar si ya existe la API
    const existingApi = await db.collection('api_configurations').findOne({
      nombre: 'Intercapital'
    });

    if (existingApi) {
      console.log('⚠️  API Intercapital ya existe. Eliminando para recrear...');
      await db.collection('api_configurations').deleteOne({ _id: existingApi._id });
    }

    // Crear configuración completa de API
    const apiConfig = {
      nombre: 'Intercapital API',
      descripcion: 'API para operaciones de compra/venta de activos y retiros en Intercapital',
      tipo: 'rest',
      estado: 'activo',
      baseUrl: 'https://app1.intercapital.ar/api/chatbot',
      version: '1.0.0',
      empresaId: empresa._id,
      activa: true,
      
      // Autenticación con API Key
      autenticacion: {
        tipo: 'api_key',
        configuracion: {
          apiKey: '2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a',
          headerName: 'x-api-key',
          apiKeyLocation: 'header',
          apiKeyName: 'x-api-key',
          scope: []
        }
      },
      
      headers: {
        'Content-Type': 'application/json'
      },
      
      // ============================================
      // ENDPOINTS
      // ============================================
      endpoints: [
        {
          id: 'intercapital-validar-usuario',
          nombre: 'Validar Usuario',
          descripcion: 'Valida si un comitente existe y puede operar',
          method: 'GET',
          metodo: 'GET',
          path: '/usuarios/validate',
          parametros: {
            comitente: '{{comitente}}'
          }
        },
        {
          id: 'intercapital-crear-orden',
          nombre: 'Crear Orden',
          descripcion: 'Crea una orden de compra/venta/retiro',
          method: 'POST',
          metodo: 'POST',
          path: '/ordenes',
          body: {
            comitente: '{{comitente}}',
            operacion: '{{operacion}}',
            symbol: '{{symbol}}',
            cantidad: '{{cantidad}}',
            precio: '{{precio}}',
            plazo: 'CONTADO',
            tipo_orden: 'MERCADO',
            cbu_destino: '{{cbu_destino}}',
            notas: 'Orden desde WhatsApp',
            metadata: {
              whatsapp_phone: '{{telefono}}',
              conversation_id: '{{conversationId}}'
            }
          }
        },
        {
          id: 'intercapital-consultar-orden',
          nombre: 'Consultar Orden',
          descripcion: 'Consulta el estado de una orden específica',
          method: 'GET',
          metodo: 'GET',
          path: '/ordenes/{{ordenId}}'
        },
        {
          id: 'intercapital-listar-ordenes',
          nombre: 'Listar Órdenes',
          descripcion: 'Lista las órdenes de un comitente',
          method: 'GET',
          metodo: 'GET',
          path: '/ordenes',
          parametros: {
            comitente: '{{comitente}}',
            estado: '{{estado}}',
            limit: '{{limit}}'
          }
        }
      ],

      // ============================================
      // WORKFLOWS
      // ============================================
      workflows: [
        // MENÚ PRINCIPAL
        {
          id: 'intercapital-menu-principal',
          nombre: 'Intercapital - Menú Principal',
          descripcion: 'Menú principal de operaciones',
          activo: true,
          trigger: {
            tipo: 'keyword',
            keywords: ['hola', 'menu', 'inicio', 'intercapital', 'ayuda']
          },
          mensajeInicial: `👋 ¡Bienvenido a Intercapital!

Soy tu asistente virtual para operaciones bursátiles.`,
          steps: [
            {
              orden: 1,
              nombre: 'Menú principal',
              tipo: 'recopilar',
              pregunta: `👉 ¿Qué operación deseas realizar?

1️⃣ Comprar activos
2️⃣ Vender activos
3️⃣ Solicitar retiro
4️⃣ Consultar mis órdenes
5️⃣ Ayuda

Escribí el número`,
              nombreVariable: 'opcion_menu',
              validacion: {
                tipo: 'opcion',
                opciones: ['1', '2', '3', '4', '5']
              }
            }
          ],
          workflowsSiguientes: {
            pregunta: '',
            workflows: [
              { workflowId: 'intercapital-comprar', opcion: '1' },
              { workflowId: 'intercapital-vender', opcion: '2' },
              { workflowId: 'intercapital-retiro', opcion: '3' },
              { workflowId: 'intercapital-consultar', opcion: '4' },
              { workflowId: 'intercapital-ayuda', opcion: '5' }
            ]
          }
        },

        // WORKFLOW 1: COMPRAR ACTIVOS
        {
          id: 'intercapital-comprar',
          nombre: 'Intercapital - Comprar Activos',
          descripcion: 'Flujo para comprar activos en el mercado',
          activo: true,
          trigger: { tipo: 'manual' },
          steps: [
            {
              orden: 1,
              nombre: 'Solicitar comitente',
              tipo: 'recopilar',
              pregunta: '🔢 Por favor, ingresa tu número de comitente:',
              nombreVariable: 'comitente',
              validacion: {
                tipo: 'numero',
                min: 1,
                mensajeError: 'El número de comitente debe ser válido'
              }
            },
            {
              orden: 2,
              nombre: 'Validar comitente',
              tipo: 'consulta_filtrada',
              nombreVariable: 'validacion_usuario',
              endpointId: 'intercapital-validar-usuario',
              mapeoParametros: {
                comitente: 'comitente'
              },
              mensajeSinResultados: `❌ No encontramos tu número de comitente o tu cuenta no está activa.

Por favor verifica el número e intenta nuevamente.

Escribí *1* para volver al menú principal`,
              plantillaRespuesta: '✅ Hola {{nombre}}! Tu cuenta está activa y lista para operar.'
            },
            {
              orden: 3,
              nombre: 'Solicitar símbolo',
              tipo: 'recopilar',
              pregunta: '📊 ¿Qué activo deseas comprar?\n\nEjemplos: AL30, GGAL, YPFD, PAMP, etc.\n\nEscribe el símbolo del activo:',
              nombreVariable: 'symbol',
              validacion: {
                tipo: 'texto',
                minLength: 2,
                maxLength: 10,
                mensajeError: 'Ingresa un símbolo válido (ej: AL30)'
              }
            },
            {
              orden: 4,
              nombre: 'Solicitar cantidad',
              tipo: 'recopilar',
              pregunta: '📦 ¿Cuántas unidades deseas comprar?',
              nombreVariable: 'cantidad',
              validacion: {
                tipo: 'numero',
                min: 1,
                mensajeError: 'La cantidad debe ser mayor a 0'
              }
            },
            {
              orden: 5,
              nombre: 'Solicitar precio',
              tipo: 'recopilar',
              pregunta: '💰 ¿A qué precio deseas comprar? (precio por unidad en pesos)',
              nombreVariable: 'precio',
              validacion: {
                tipo: 'numero',
                min: 0.01,
                mensajeError: 'El precio debe ser mayor a 0'
              }
            },
            {
              orden: 6,
              nombre: 'Confirmación',
              tipo: 'confirmacion',
              pregunta: '📋 *Confirma tu orden de COMPRA:*\n\n' +
                '🔢 Comitente: {{comitente}}\n' +
                '👤 Nombre: {{nombre}}\n' +
                '📊 Activo: {{symbol}}\n' +
                '📦 Cantidad: {{cantidad}} unidades\n' +
                '💰 Precio: ${{precio}} por unidad\n' +
                '💵 Total aproximado: ${{monto_estimado}}\n\n' +
                '⚠️ *Importante:* Esta orden quedará PENDIENTE de aprobación por nuestro equipo.\n\n' +
                '¿Confirmas la operación?\n\n' +
                '1️⃣ Sí, confirmar orden\n' +
                '2️⃣ No, cancelar\n\n' +
                'Escribí el número',
              nombreVariable: 'confirmacion',
              validacion: {
                tipo: 'opcion',
                opciones: ['1', '2'],
                mapeo: {
                  '1': 'confirmar',
                  '2': 'cancelar'
                }
              }
            },
            {
              orden: 7,
              nombre: 'Crear orden',
              tipo: 'consulta_filtrada',
              nombreVariable: 'orden_creada',
              endpointId: 'intercapital-crear-orden',
              mapeoParametros: {
                comitente: 'comitente',
                operacion: 'COMPRA',
                symbol: 'symbol',
                cantidad: 'cantidad',
                precio: 'precio'
              },
              plantillaRespuesta: '✅ *¡Orden creada exitosamente!*\n\n' +
                '📋 Orden #{{orden}}\n' +
                '📊 Operación: COMPRA {{cantidad}} {{symbol}}\n' +
                '💰 Precio: ${{precio}} por unidad\n' +
                '💵 Monto total: ${{monto}}\n' +
                '📌 Estado: {{estado}}\n\n' +
                '⏳ Tu orden será procesada por nuestro equipo de operaciones.\n\n' +
                'Te notificaremos cuando cambie de estado.\n\n' +
                'Escribí *1* para volver al menú principal'
            }
          ]
        },

        // WORKFLOW 2: VENDER ACTIVOS
        {
          id: 'intercapital-vender',
          nombre: 'Intercapital - Vender Activos',
          descripcion: 'Flujo para vender activos en el mercado',
          activo: true,
          trigger: { tipo: 'manual' },
          steps: [
            {
              orden: 1,
              nombre: 'Solicitar comitente',
              tipo: 'recopilar',
              pregunta: '🔢 Por favor, ingresa tu número de comitente:',
              nombreVariable: 'comitente',
              validacion: {
                tipo: 'numero',
                min: 1,
                mensajeError: 'El número de comitente debe ser válido'
              }
            },
            {
              orden: 2,
              nombre: 'Validar comitente',
              tipo: 'consulta_filtrada',
              nombreVariable: 'validacion_usuario',
              endpointId: 'intercapital-validar-usuario',
              mapeoParametros: {
                comitente: 'comitente'
              },
              mensajeSinResultados: `❌ No encontramos tu número de comitente o tu cuenta no está activa.

Por favor verifica el número e intenta nuevamente.

Escribí *1* para volver al menú principal`,
              plantillaRespuesta: '✅ Hola {{nombre}}! Tu cuenta está activa y lista para operar.'
            },
            {
              orden: 3,
              nombre: 'Solicitar símbolo',
              tipo: 'recopilar',
              pregunta: '📊 ¿Qué activo deseas vender?\n\nEjemplos: AL30, GGAL, YPFD, PAMP, etc.\n\nEscribe el símbolo del activo:',
              nombreVariable: 'symbol',
              validacion: {
                tipo: 'texto',
                minLength: 2,
                maxLength: 10,
                mensajeError: 'Ingresa un símbolo válido (ej: AL30)'
              }
            },
            {
              orden: 4,
              nombre: 'Solicitar cantidad',
              tipo: 'recopilar',
              pregunta: '📦 ¿Cuántas unidades deseas vender?',
              nombreVariable: 'cantidad',
              validacion: {
                tipo: 'numero',
                min: 1,
                mensajeError: 'La cantidad debe ser mayor a 0'
              }
            },
            {
              orden: 5,
              nombre: 'Solicitar precio',
              tipo: 'recopilar',
              pregunta: '💰 ¿A qué precio deseas vender? (precio por unidad en pesos)',
              nombreVariable: 'precio',
              validacion: {
                tipo: 'numero',
                min: 0.01,
                mensajeError: 'El precio debe ser mayor a 0'
              }
            },
            {
              orden: 6,
              nombre: 'Confirmación',
              tipo: 'confirmacion',
              pregunta: '📋 *Confirma tu orden de VENTA:*\n\n' +
                '🔢 Comitente: {{comitente}}\n' +
                '👤 Nombre: {{nombre}}\n' +
                '📊 Activo: {{symbol}}\n' +
                '📦 Cantidad: {{cantidad}} unidades\n' +
                '💰 Precio: ${{precio}} por unidad\n' +
                '💵 Total aproximado: ${{monto_estimado}}\n\n' +
                '⚠️ *Importante:* Esta orden quedará PENDIENTE de aprobación por nuestro equipo.\n\n' +
                '¿Confirmas la operación?\n\n' +
                '1️⃣ Sí, confirmar orden\n' +
                '2️⃣ No, cancelar\n\n' +
                'Escribí el número',
              nombreVariable: 'confirmacion',
              validacion: {
                tipo: 'opcion',
                opciones: ['1', '2'],
                mapeo: {
                  '1': 'confirmar',
                  '2': 'cancelar'
                }
              }
            },
            {
              orden: 7,
              nombre: 'Crear orden',
              tipo: 'consulta_filtrada',
              nombreVariable: 'orden_creada',
              endpointId: 'intercapital-crear-orden',
              mapeoParametros: {
                comitente: 'comitente',
                operacion: 'VENTA',
                symbol: 'symbol',
                cantidad: 'cantidad',
                precio: 'precio'
              },
              plantillaRespuesta: '✅ *¡Orden creada exitosamente!*\n\n' +
                '📋 Orden #{{orden}}\n' +
                '📊 Operación: VENTA {{cantidad}} {{symbol}}\n' +
                '💰 Precio: ${{precio}} por unidad\n' +
                '💵 Monto total: ${{monto}}\n' +
                '📌 Estado: {{estado}}\n\n' +
                '⏳ Tu orden será procesada por nuestro equipo de operaciones.\n\n' +
                'Te notificaremos cuando cambie de estado.\n\n' +
                'Escribí *1* para volver al menú principal'
            }
          ]
        },

        // WORKFLOW 3: SOLICITAR RETIRO
        {
          id: 'intercapital-retiro',
          nombre: 'Intercapital - Solicitar Retiro',
          descripcion: 'Flujo para solicitar retiro de fondos',
          activo: true,
          trigger: { tipo: 'manual' },
          steps: [
            {
              orden: 1,
              nombre: 'Solicitar comitente',
              tipo: 'recopilar',
              pregunta: '🔢 Por favor, ingresa tu número de comitente:',
              nombreVariable: 'comitente',
              validacion: {
                tipo: 'numero',
                min: 1,
                mensajeError: 'El número de comitente debe ser válido'
              }
            },
            {
              orden: 2,
              nombre: 'Validar comitente',
              tipo: 'consulta_filtrada',
              nombreVariable: 'validacion_usuario',
              endpointId: 'intercapital-validar-usuario',
              mapeoParametros: {
                comitente: 'comitente'
              },
              mensajeSinResultados: `❌ No encontramos tu número de comitente o tu cuenta no está activa.

Por favor verifica el número e intenta nuevamente.

Escribí *1* para volver al menú principal`,
              plantillaRespuesta: '✅ Hola {{nombre}}! Procedamos con tu solicitud de retiro.'
            },
            {
              orden: 3,
              nombre: 'Solicitar monto',
              tipo: 'recopilar',
              pregunta: '💵 ¿Qué monto deseas retirar? (en pesos)',
              nombreVariable: 'cantidad',
              validacion: {
                tipo: 'numero',
                min: 1,
                mensajeError: 'El monto debe ser mayor a 0'
              }
            },
            {
              orden: 4,
              nombre: 'Solicitar CBU',
              tipo: 'recopilar',
              pregunta: '🏦 Ingresa el CBU de destino (22 dígitos):\n\n⚠️ *Importante:* Verifica que el CBU sea correcto.',
              nombreVariable: 'cbu_destino',
              validacion: {
                tipo: 'texto',
                minLength: 22,
                maxLength: 22,
                mensajeError: 'El CBU debe tener exactamente 22 dígitos'
              }
            },
            {
              orden: 5,
              nombre: 'Confirmación',
              tipo: 'confirmacion',
              pregunta: '📋 *Confirma tu solicitud de RETIRO:*\n\n' +
                '🔢 Comitente: {{comitente}}\n' +
                '👤 Nombre: {{nombre}}\n' +
                '💵 Monto: ${{cantidad}}\n' +
                '🏦 CBU destino: {{cbu_destino}}\n\n' +
                '⚠️ *Importante:* Esta solicitud quedará PENDIENTE de aprobación.\n\n' +
                '¿Confirmas la operación?\n\n' +
                '1️⃣ Sí, confirmar retiro\n' +
                '2️⃣ No, cancelar\n\n' +
                'Escribí el número',
              nombreVariable: 'confirmacion',
              validacion: {
                tipo: 'opcion',
                opciones: ['1', '2'],
                mapeo: {
                  '1': 'confirmar',
                  '2': 'cancelar'
                }
              }
            },
            {
              orden: 6,
              nombre: 'Crear solicitud',
              tipo: 'consulta_filtrada',
              nombreVariable: 'orden_creada',
              endpointId: 'intercapital-crear-orden',
              mapeoParametros: {
                comitente: 'comitente',
                operacion: 'RETIRO',
                symbol: 'PESOS',
                cantidad: 'cantidad',
                precio: '1',
                cbu_destino: 'cbu_destino'
              },
              plantillaRespuesta: '✅ *¡Solicitud de retiro creada!*\n\n' +
                '📋 Orden #{{orden}}\n' +
                '💵 Monto: ${{monto}}\n' +
                '🏦 CBU: {{cbu_destino}}\n' +
                '📌 Estado: {{estado}}\n\n' +
                '⏳ Tu solicitud será procesada por nuestro equipo.\n\n' +
                'Los retiros se procesan en 24-48hs hábiles.\n\n' +
                'Escribí *1* para volver al menú principal'
            }
          ]
        },

        // WORKFLOW 4: CONSULTAR ÓRDENES
        {
          id: 'intercapital-consultar',
          nombre: 'Intercapital - Consultar Órdenes',
          descripcion: 'Consultar estado de órdenes',
          activo: true,
          trigger: { tipo: 'manual' },
          steps: [
            {
              orden: 1,
              nombre: 'Solicitar comitente',
              tipo: 'recopilar',
              pregunta: '🔢 Por favor, ingresa tu número de comitente:',
              nombreVariable: 'comitente',
              validacion: {
                tipo: 'numero',
                min: 1,
                mensajeError: 'El número de comitente debe ser válido'
              }
            },
            {
              orden: 2,
              nombre: 'Validar comitente',
              tipo: 'consulta_filtrada',
              nombreVariable: 'validacion_usuario',
              endpointId: 'intercapital-validar-usuario',
              mapeoParametros: {
                comitente: 'comitente'
              },
              mensajeSinResultados: `❌ No encontramos tu número de comitente.

Por favor verifica el número e intenta nuevamente.

Escribí *1* para volver al menú principal`,
              plantillaRespuesta: '✅ Hola {{nombre}}! Consultando tus órdenes...'
            },
            {
              orden: 3,
              nombre: 'Listar órdenes',
              tipo: 'consulta_filtrada',
              nombreVariable: 'ordenes',
              endpointId: 'intercapital-listar-ordenes',
              mapeoParametros: {
                comitente: 'comitente',
                limit: '10'
              },
              endpointResponseConfig: {
                arrayPath: 'data',
                idField: 'id',
                displayField: 'orden'
              },
              mensajeSinResultados: `📋 No tienes órdenes registradas.

Escribí *1* para volver al menú principal`,
              plantillaOpciones: '{{numero}}. Orden #{{orden}} - {{operacion}} {{cantidad}} {{symbol}} - Estado: {{estado}}',
              pregunta: '📋 *Tus últimas órdenes:*\n\n{{opciones}}\n\nSelecciona una orden para ver más detalles o escribe *0* para volver al menú.'
            }
          ]
        },

        // WORKFLOW 5: AYUDA
        {
          id: 'intercapital-ayuda',
          nombre: 'Intercapital - Ayuda',
          descripcion: 'Información de ayuda',
          activo: true,
          trigger: { tipo: 'manual' },
          steps: [
            {
              orden: 1,
              nombre: 'Mostrar ayuda',
              tipo: 'recopilar',
              pregunta: 'ℹ️ *AYUDA - Intercapital Bot*\n\n' +
                '*¿Qué puedes hacer?*\n\n' +
                '1️⃣ *Comprar activos*\n' +
                '   Crea órdenes de compra de acciones, bonos, cedears, etc.\n\n' +
                '2️⃣ *Vender activos*\n' +
                '   Crea órdenes de venta de tus activos.\n\n' +
                '3️⃣ *Solicitar retiros*\n' +
                '   Solicita transferencias a tu cuenta bancaria.\n\n' +
                '4️⃣ *Consultar órdenes*\n' +
                '   Revisa el estado de tus operaciones.\n\n' +
                '*Información importante:*\n' +
                '• Todas las órdenes quedan PENDIENTES de aprobación\n' +
                '• Nuestro equipo las procesará en horario de mercado\n' +
                '• Recibirás notificaciones de cambios de estado\n\n' +
                '*¿Necesitas ayuda personalizada?*\n' +
                'Contacta a nuestro equipo:\n' +
                '📞 Teléfono: 0800-XXX-XXXX\n' +
                '📧 Email: soporte@intercapital.com.ar\n\n' +
                'Escribí *1* para volver al menú principal',
              nombreVariable: 'volver_menu',
              validacion: {
                tipo: 'opcion',
                opciones: ['1']
              }
            }
          ]
        }
      ],

      // Variables globales
      variables: {
        apiUrl: 'https://app1.intercapital.ar/api/chatbot',
        apiKey: '2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a'
      },

      // Configuración adicional
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
        tiempoPromedioRespuesta: 0,
        ultimaLlamada: null
      },

      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insertar en la base de datos
    const result = await db.collection('api_configurations').insertOne(apiConfig);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CONFIGURACIÓN INTERCAPITAL CREADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Resumen:');
    console.log(`   - API ID: ${result.insertedId}`);
    console.log(`   - Empresa: ${empresa.nombre} (${empresa._id})`);
    console.log(`   - Endpoints: ${apiConfig.endpoints.length}`);
    console.log(`   - Workflows: ${apiConfig.workflows.length}`);
    console.log('\n📊 Workflows creados:');
    apiConfig.workflows.forEach((wf, i) => {
      console.log(`   ${i + 1}. ${wf.nombre} (${wf.steps?.length || 0} pasos)`);
    });
    console.log('\n✅ Sistema listo para usar!');
    console.log('\n🧪 Para probar:');
    console.log('   1. Escribe "hola" o "intercapital" en WhatsApp');
    console.log('   2. Sigue el menú interactivo');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupIntercapital();
