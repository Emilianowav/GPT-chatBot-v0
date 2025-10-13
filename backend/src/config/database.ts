// 🗄️ Configuración de MongoDB
import mongoose from 'mongoose';

let MONGODB_URI = process.env.MONGODB_URI || '';

function verificarMongoDBURI() {
  MONGODB_URI = process.env.MONGODB_URI || '';
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI no está definida en las variables de entorno');
    console.error('📋 Variables de entorno disponibles:', Object.keys(process.env).filter(k => k.includes('MONGO')));
    process.exit(1);
  }
  return MONGODB_URI;
}

export const connectDB = async (): Promise<void> => {
  try {
    const uri = verificarMongoDBURI();
    await mongoose.connect(uri, {
      dbName: 'neural_chatbot', // Nombre de la base de datos
    });
    
    console.log('✅ MongoDB conectado exitosamente');
    console.log(`📊 Base de datos: ${mongoose.connection.db?.databaseName || 'neural_chatbot'}`);
    
    // Eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB desconectado');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
    });
    
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('👋 MongoDB desconectado');
  } catch (error) {
    console.error('❌ Error al desconectar MongoDB:', error);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});
