// Script para habilitar manualmente la integración de API con chatbot
const mongoose = require('./backend/node_modules/mongoose');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

async function enableIntegration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.client.db('neural_chatbot');
    
    // 1. Buscar empresa iCenter
    const empresa = await db.collection('empresas').findOne({ nombre: 'iCenter' });
    const empresaId = empresa._id.toString();
    
    // 2. Buscar chatbot
    const chatbot = await db.collection('chatbots').findOne({ empresaId });
    const chatbotId = chatbot._id.toString();
    
    console.log('🏢 Empresa:', empresa.nombre, '→', empresaId);
    console.log('🤖 Chatbot:', chatbot.nombre, '→', chatbotId);
    console.log('');
    
    // 3. Buscar API de iCenter
    const api = await db.collection('apiconfigurations').findOne({
      empresaId: empresaId,
      nombre: /iCenter/i
    });
    
    if (!api) {
      console.log('❌ No se encontró API de iCenter');
      process.exit(1);
    }
    
    console.log('📋 API encontrada:', api.nombre);
    console.log('   Endpoints:', api.endpoints?.length || 0);
    
    // Buscar endpoint de sucursales
    const sucursalesEndpoint = api.endpoints?.find(ep => 
      ep.nombre.toLowerCase().includes('sucursal')
    );
    
    if (!sucursalesEndpoint) {
      console.log('❌ No se encontró endpoint de sucursales');
      console.log('   Endpoints disponibles:');
      api.endpoints?.forEach(ep => {
        console.log(`   - ${ep.nombre} (${ep.id})`);
      });
      process.exit(1);
    }
    
    console.log('✅ Endpoint encontrado:', sucursalesEndpoint.nombre);
    console.log('   ID:', sucursalesEndpoint.id);
    console.log('');
    
    // 4. Configurar integración
    const chatbotIntegration = {
      habilitado: true,
      chatbotId: chatbotId,
      keywords: [
        {
          palabra: 'sucursal',
          endpointId: sucursalesEndpoint.id,
          descripcion: 'Consultar sucursales disponibles',
          extraerParametros: false,
          parametrosConfig: [],
          respuestaTemplate: `📍 *Sucursales iCenter*

{{#sucursales}}
🏢 *{{nombre}}*
📍 {{direccion}}
📞 {{telefono}}
⏰ {{horario}}

{{/sucursales}}

💡 _¿Necesitás más información? Preguntame!_`,
          ejemplos: ['sucursal', 'sucursales', 'donde están']
        },
        {
          palabra: 'sucursales',
          endpointId: sucursalesEndpoint.id,
          descripcion: 'Consultar sucursales disponibles',
          extraerParametros: false,
          parametrosConfig: [],
          respuestaTemplate: `📍 *Sucursales iCenter*

{{#sucursales}}
🏢 *{{nombre}}*
📍 {{direccion}}
📞 {{telefono}}
⏰ {{horario}}

{{/sucursales}}

💡 _¿Necesitás más información? Preguntame!_`,
          ejemplos: ['sucursal', 'sucursales', 'donde están']
        }
      ],
      mensajeAyuda: 'Podés consultar: sucursales, productos, horarios'
    };
    
    // 5. Actualizar API
    const result = await db.collection('apiconfigurations').updateOne(
      { _id: api._id },
      { $set: { chatbotIntegration } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Integración habilitada exitosamente!');
      console.log('');
      console.log('📝 Configuración:');
      console.log('   Keywords:', chatbotIntegration.keywords.map(k => k.palabra).join(', '));
      console.log('   Endpoint:', sucursalesEndpoint.nombre);
      console.log('   Chatbot:', chatbot.nombre);
      console.log('');
      console.log('🧪 Prueba enviando por WhatsApp:');
      console.log('   "sucursal" o "sucursales"');
    } else {
      console.log('⚠️ No se modificó nada (quizás ya estaba configurado)');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enableIntegration();
