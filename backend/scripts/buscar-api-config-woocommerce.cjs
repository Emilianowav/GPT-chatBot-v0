require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

async function buscarApiConfig() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const apiConfigsCollection = db.collection('apiconfigurations');

    const configs = await apiConfigsCollection.find({}).toArray();

    console.log(`📊 TOTAL API CONFIGS: ${configs.length}\n`);
    console.log('═══════════════════════════════════════\n');

    configs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${config._id}`);
      console.log(`   Tipo: ${config.tipo}`);
      console.log(`   Base URL: ${config.baseUrl}`);
      if (config.autenticacion?.configuracion?.username) {
        console.log(`   Username: ${config.autenticacion.configuracion.username}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Desconectado');
  }
}

buscarApiConfig();
