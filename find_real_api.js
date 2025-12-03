// Buscar la API real de iCenter
const mongoose = require('./backend/node_modules/mongoose');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

async function find() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.client.db('neural_chatbot');
    
    // Buscar todas las APIs
    const apis = await db.collection('apiconfigurations').find({}).toArray();
    
    console.log(`Total APIs: ${apis.length}\n`);
    
    apis.forEach((api, i) => {
      console.log(`${i+1}. ${api.nombre}`);
      console.log(`   _id: ${api._id}`);
      console.log(`   empresaId: ${api.empresaId} (tipo: ${typeof api.empresaId})`);
      console.log(`   chatbotIntegration: ${api.chatbotIntegration ? 'Sí' : 'No'}`);
      if (api.chatbotIntegration) {
        console.log(`   keywords: ${api.chatbotIntegration.keywords?.length || 0}`);
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

find();
