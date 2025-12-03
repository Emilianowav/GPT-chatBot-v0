// Verificar si el token de la API está encriptado correctamente
const mongoose = require('./backend/node_modules/mongoose');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.client.db('neural_chatbot');
    
    // Buscar API de iCenter
    const api = await db.collection('apiconfigurations').findOne({
      _id: new mongoose.Types.ObjectId('6917126a03862ac8bb3fd4f2')
    });
    
    if (!api) {
      console.log('❌ API no encontrada');
      process.exit(1);
    }
    
    console.log('📋 API:', api.nombre);
    console.log('🔐 Autenticación:');
    console.log('   Tipo:', api.autenticacion?.tipo);
    console.log('   Token (primeros 20 chars):', api.autenticacion?.configuracion?.token?.substring(0, 20));
    console.log('   Token length:', api.autenticacion?.configuracion?.token?.length);
    console.log('');
    
    // Verificar si está encriptado (los tokens encriptados tienen formato específico)
    const token = api.autenticacion?.configuracion?.token;
    
    if (!token) {
      console.log('❌ No hay token configurado');
      process.exit(1);
    }
    
    // Los tokens encriptados tienen el formato: iv:encryptedData
    const isEncrypted = token.includes(':');
    
    console.log('🔍 Análisis del token:');
    console.log('   ¿Parece encriptado?:', isEncrypted ? 'Sí (contiene ":")' : 'No (texto plano)');
    console.log('');
    
    if (isEncrypted) {
      console.log('✅ El token ESTÁ encriptado');
      console.log('⚠️ Necesitas ENCRYPTION_KEY en Render para desencriptarlo');
      console.log('');
      console.log('📝 ENCRYPTION_KEY que debes usar en Render:');
      console.log(process.env.ENCRYPTION_KEY);
      console.log('');
      console.log('🔧 Pasos en Render:');
      console.log('   1. Dashboard → gpt-chatbot-v0');
      console.log('   2. Environment');
      console.log('   3. Add Environment Variable');
      console.log('   4. Key: ENCRYPTION_KEY');
      console.log('   5. Value: (copia la key de arriba)');
      console.log('   6. Save Changes');
      console.log('   7. Manual Deploy → Deploy latest commit');
    } else {
      console.log('⚠️ El token NO está encriptado (está en texto plano)');
      console.log('');
      console.log('💡 Opciones:');
      console.log('   A) Encriptar el token (recomendado para producción)');
      console.log('   B) Usar texto plano (más simple, menos seguro)');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verify();
