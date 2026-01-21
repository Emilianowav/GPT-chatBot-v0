const { MongoClient } = require('mongodb');

// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'bot_crm';

async function buscarApiKey() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db(DB_NAME);
    
    // Buscar en colección de configuraciones de API
    const apiConfigsCollection = db.collection('api_configs');
    
    const intercapitalConfig = await apiConfigsCollection.findOne({
      tipo: 'intercapital'
    });

    if (intercapitalConfig) {
      console.log('\n📋 Configuración de Intercapital encontrada:');
      console.log('  ID:', intercapitalConfig._id);
      console.log('  Nombre:', intercapitalConfig.nombre);
      console.log('  Tipo:', intercapitalConfig.tipo);
      console.log('  Activo:', intercapitalConfig.activo);
      console.log('  Base URL:', intercapitalConfig.configuracion?.baseUrl);
      console.log('  API Key:', intercapitalConfig.configuracion?.apiKey ? '***' + intercapitalConfig.configuracion.apiKey.slice(-4) : 'No configurada');
      
      return intercapitalConfig.configuracion?.apiKey;
    }

    // Si no existe en api_configs, buscar en variables de entorno o flows
    const flowsCollection = db.collection('flows');
    const flow = await flowsCollection.findOne({
      empresaId: 'Intercapital',
      activo: true
    });

    if (flow && flow.config && flow.config.api_keys && flow.config.api_keys.intercapital) {
      console.log('\n📋 API Key encontrada en flow config');
      return flow.config.api_keys.intercapital;
    }

    console.log('\n⚠️  No se encontró configuración de API Key de Intercapital en la BD');
    console.log('💡 Opciones:');
    console.log('  1. Configurar en backend/.env: INTERCAPITAL_API_KEY=tu_api_key');
    console.log('  2. Crear documento en colección api_configs');
    console.log('  3. Usar la API Key del documento de integración');

    return null;

  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  } finally {
    await client.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
buscarApiKey().then(apiKey => {
  if (apiKey) {
    console.log('\n✅ API Key disponible para usar en configuración');
  }
});
