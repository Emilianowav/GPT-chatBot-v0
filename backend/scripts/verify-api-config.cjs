require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function verifyApiConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const apisCollection = db.collection('apis');
    
    const apiConfigId = new ObjectId('695320fda03785dacc8d950b');
    const apiConfig = await apisCollection.findOne({ _id: apiConfigId });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICAR CONFIGURACIÓN DE API');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (!apiConfig) {
      console.log('❌ Configuración de API no encontrada');
      console.log(`   ID buscado: ${apiConfigId}`);
      console.log('');
      console.log('El nodo WooCommerce está configurado para usar apiConfigId,');
      console.log('pero esa configuración no existe en la colección "apis".');
      console.log('');
      console.log('SOLUCIÓN:');
      console.log('1. Crear la configuración de API en la colección "apis"');
      console.log('2. O cambiar el nodo para usar conexión directa de WooCommerce');
      return;
    }
    
    console.log('✅ Configuración de API encontrada\n');
    console.log('📋 Nombre:', apiConfig.nombre);
    console.log('🏢 Empresa:', apiConfig.empresaId);
    console.log('🔗 Base URL:', apiConfig.baseUrl);
    console.log('🔐 Autenticación:', apiConfig.auth?.type || 'Ninguna');
    console.log('');
    
    console.log('📡 ENDPOINTS CONFIGURADOS:\n');
    if (apiConfig.endpoints && apiConfig.endpoints.length > 0) {
      apiConfig.endpoints.forEach((endpoint, index) => {
        console.log(`${index + 1}. ${endpoint.nombre} (${endpoint.id})`);
        console.log(`   Método: ${endpoint.method}`);
        console.log(`   Path: ${endpoint.path}`);
        console.log(`   Descripción: ${endpoint.descripcion || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No hay endpoints configurados');
    }
    
    // Buscar el endpoint específico
    const endpointId = 'buscar-productos';
    const endpoint = apiConfig.endpoints?.find(e => e.id === endpointId);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`ENDPOINT USADO POR EL NODO: ${endpointId}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (endpoint) {
      console.log('✅ Endpoint encontrado\n');
      console.log('📋 Configuración:');
      console.log(JSON.stringify(endpoint, null, 2));
      console.log('');
      console.log('🔗 URL completa:', `${apiConfig.baseUrl}${endpoint.path}`);
      console.log('');
      
      if (apiConfig.auth?.type === 'basic') {
        console.log('🔐 Autenticación Basic configurada');
        console.log('   Username:', apiConfig.auth.username ? '✅' : '❌');
        console.log('   Password:', apiConfig.auth.password ? '✅' : '❌');
      } else if (apiConfig.auth?.type === 'bearer') {
        console.log('🔐 Autenticación Bearer configurada');
        console.log('   Token:', apiConfig.auth.token ? '✅' : '❌');
      } else if (apiConfig.auth?.type === 'oauth') {
        console.log('🔐 Autenticación OAuth configurada');
        console.log('   Consumer Key:', apiConfig.auth.consumerKey ? '✅' : '❌');
        console.log('   Consumer Secret:', apiConfig.auth.consumerSecret ? '✅' : '❌');
      } else {
        console.log('⚠️  No hay autenticación configurada');
      }
    } else {
      console.log('❌ Endpoint no encontrado');
      console.log(`   ID buscado: ${endpointId}`);
      console.log('');
      console.log('El nodo está configurado para usar este endpoint,');
      console.log('pero no existe en la configuración de la API.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyApiConfig();
