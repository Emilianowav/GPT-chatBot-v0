// Script para crear API de ejemplo para iCenter
const mongoose = require('./backend/node_modules/mongoose');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

// Generar UUID simple sin dependencia
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.client.db('neural_chatbot');
    
    // 1. Buscar empresa y chatbot
    const empresa = await db.collection('empresas').findOne({ nombre: 'iCenter' });
    const empresaId = empresa._id.toString();
    const chatbot = await db.collection('chatbots').findOne({ empresaId });
    const chatbotId = chatbot._id.toString();
    
    console.log('🏢 Empresa:', empresa.nombre);
    console.log('🤖 Chatbot:', chatbot.nombre);
    console.log('');
    
    // 2. Crear API de ejemplo
    const endpointId = uuidv4();
    
    const apiConfig = {
      empresaId: empresaId,
      nombre: 'API iCenter',
      descripcion: 'API de servicios de iCenter',
      tipo: 'rest',
      baseUrl: 'https://api.icenter.com.ar',
      version: '1.0',
      estado: 'activo',
      endpoints: [
        {
          id: endpointId,
          nombre: 'Listar Sucursales',
          descripcion: 'Obtiene todas las sucursales',
          metodo: 'GET',
          path: '/sucursales',
          activo: true,
          parametros: {
            query: [],
            path: [],
            headers: {}
          },
          respuestaEsperada: {
            tipo: 'json',
            estructura: {
              sucursales: 'array'
            }
          }
        }
      ],
      autenticacion: {
        tipo: 'none'
      },
      configuracion: {
        timeout: 30000,
        reintentos: 3
      },
      chatbotIntegration: {
        habilitado: true,
        chatbotId: chatbotId,
        keywords: [
          {
            palabra: 'sucursal',
            endpointId: endpointId,
            descripcion: 'Consultar sucursales',
            extraerParametros: false,
            parametrosConfig: [],
            respuestaTemplate: `📍 *Sucursales iCenter*

{{#sucursales}}
🏢 *{{nombre}}*
📍 {{direccion}}
📞 Teléfono: {{telefono}}
⏰ Horario: {{horario}}

{{/sucursales}}

💡 _¿Necesitás más información?_`,
            ejemplos: ['sucursal', 'sucursales']
          },
          {
            palabra: 'sucursales',
            endpointId: endpointId,
            descripcion: 'Consultar sucursales',
            extraerParametros: false,
            parametrosConfig: [],
            respuestaTemplate: `📍 *Sucursales iCenter*

{{#sucursales}}
🏢 *{{nombre}}*
📍 {{direccion}}
📞 Teléfono: {{telefono}}
⏰ Horario: {{horario}}

{{/sucursales}}

💡 _¿Necesitás más información?_`,
            ejemplos: ['sucursal', 'sucursales']
          }
        ],
        mensajeAyuda: 'Podés consultar: sucursales'
      },
      estadisticas: {
        totalLlamadas: 0,
        llamadasExitosas: 0,
        llamadasFallidas: 0,
        tiempoPromedioRespuesta: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 3. Insertar en BD
    const result = await db.collection('apiconfigurations').insertOne(apiConfig);
    
    console.log('✅ API creada exitosamente!');
    console.log('   ID:', result.insertedId.toString());
    console.log('   Nombre:', apiConfig.nombre);
    console.log('   Endpoints:', apiConfig.endpoints.length);
    console.log('   Keywords:', apiConfig.chatbotIntegration.keywords.map(k => k.palabra).join(', '));
    console.log('');
    console.log('🧪 Ahora prueba enviando por WhatsApp:');
    console.log('   "sucursal" o "sucursales"');
    console.log('');
    console.log('⚠️ IMPORTANTE: Reinicia el backend en Render para que tome los cambios');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAPI();
