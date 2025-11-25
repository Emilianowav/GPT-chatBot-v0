// Script para actualizar la API existente de iCenter con integración de chatbot
const mongoose = require('./backend/node_modules/mongoose');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

async function updateAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.client.db('neural_chatbot');
    
    // 1. Buscar chatbot de iCenter
    const empresa = await db.collection('empresas').findOne({ nombre: 'iCenter' });
    const chatbot = await db.collection('chatbots').findOne({ 
      empresaId: empresa._id.toString() 
    });
    
    console.log('🤖 Chatbot:', chatbot.nombre);
    console.log('   ID:', chatbot._id.toString());
    console.log('');
    
    // 2. Buscar la API existente por empresaId (como string)
    const api = await db.collection('apiconfigurations').findOne({
      empresaId: empresa._id.toString()
    });
    
    if (!api) {
      console.log('❌ API no encontrada');
      process.exit(1);
    }
    
    console.log('📋 API encontrada:', api.nombre);
    console.log('   Endpoints:', api.endpoints.length);
    api.endpoints.forEach(ep => {
      console.log(`   - ${ep.nombre} (${ep.id})`);
    });
    console.log('');
    
    // 3. Configurar integración con chatbot
    const chatbotIntegration = {
      habilitado: true,
      chatbotId: chatbot._id.toString(),
      keywords: [
        {
          palabra: 'sucursales',
          endpointId: '55a183e9f3532e0c9ca7eaae7b429598', // Obtener Sucursales
          descripcion: 'Consultar sucursales disponibles',
          extraerParametros: false,
          parametrosConfig: [],
          respuestaTemplate: '📍 *Sucursales iCenter*\n\n{{#locations}}\n🏢 *{{name}}*\n📍 {{address}}\n{{#phone}}📞 {{phone}}{{/phone}}\n{{#hours}}⏰ {{hours}}{{/hours}}\n\n{{/locations}}\n\n💡 _¿Necesitás más información? ¡Preguntame!_',
          ejemplos: ['sucursales', 'donde están', 'ubicaciones']
        },
        {
          palabra: 'productos',
          endpointId: '7d241efb331128acf953d19c4a5cbf86', // Obtener Productos
          descripcion: 'Buscar productos en el catálogo',
          extraerParametros: true,
          parametrosConfig: [
            {
              nombre: 'search',
              extraerDe: 'mensaje',
              regex: 'productos?\\s+(.+)',
              descripcion: 'Término de búsqueda'
            },
            {
              nombre: 'per_page',
              extraerDe: 'fijo',
              valorFijo: '5'
            }
          ],
          respuestaTemplate: '🛍️ *Productos encontrados*\n\n{{#products}}\n📦 *{{name}}*\n💰 Precio: ${{price}}\n{{#stock}}📊 Stock: {{stock}} unidades{{/stock}}\n{{#sku}}🔖 SKU: {{sku}}{{/sku}}\n\n{{/products}}\n\n{{^products}}\n❌ No encontré productos con ese término.\n{{/products}}\n\n💡 _Escribí "productos [nombre]" para buscar_',
          ejemplos: ['productos', 'productos notebook', 'buscar celular']
        },
        {
          palabra: 'categorias',
          endpointId: '50444a472917bf0ab3ea1faae063772e', // Obtener Categorías
          descripcion: 'Ver todas las categorías',
          extraerParametros: false,
          parametrosConfig: [],
          respuestaTemplate: '📂 *Categorías Disponibles*\n\n{{#categories}}\n▪️ {{name}}\n{{/categories}}\n\n💡 _Escribí el nombre de una categoría para ver productos_',
          ejemplos: ['categorias', 'categorías', 'que venden']
        }
      ],
      mensajeAyuda: '🤖 *Comandos disponibles:*\n\n📍 *sucursales* - Ver nuestras ubicaciones\n🛍️ *productos [nombre]* - Buscar productos\n📂 *categorias* - Ver categorías\n\n_¡Estoy para ayudarte!_'
    };
    
    // 4. Actualizar la API
    const result = await db.collection('apiconfigurations').updateOne(
      { _id: api._id },
      { 
        $set: { 
          chatbotIntegration,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ API actualizada con integración de chatbot!');
      console.log('');
      console.log('🔑 Keywords configuradas:');
      chatbotIntegration.keywords.forEach((kw, i) => {
        console.log(`   ${i + 1}. "${kw.palabra}" → ${kw.descripcion}`);
      });
      console.log('');
      console.log('🧪 Prueba enviando por WhatsApp:');
      console.log('   - "sucursales"');
      console.log('   - "productos notebook"');
      console.log('   - "categorias"');
      console.log('');
      console.log('⚠️ IMPORTANTE: Reinicia el backend en Render');
    } else {
      console.log('⚠️ No se modificó (quizás ya estaba configurado)');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAPI();
