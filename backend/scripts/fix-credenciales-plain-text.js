import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function fixCredenciales() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Credenciales en texto plano (sin encriptar)
    const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
    const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

    console.log('🔑 Actualizando credenciales en texto plano...');

    const result = await db.collection('api_configurations').updateOne(
      { nombre: /veo veo/i },
      {
        $set: {
          'autenticacion.configuracion.username': CONSUMER_KEY,
          'autenticacion.configuracion.password': CONSUMER_SECRET,
          'autenticacion.configuracion.plainText': true, // Flag para indicar que no están encriptadas
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Credenciales actualizadas:');
    console.log('   - username:', CONSUMER_KEY);
    console.log('   - password:', CONSUMER_SECRET.substring(0, 10) + '...');
    console.log('   - plainText: true');
    console.log('   - Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCredenciales();
