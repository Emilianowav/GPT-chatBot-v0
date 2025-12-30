import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!!';

function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function fixAuth() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
    const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

    console.log('🔐 Encriptando credenciales...');
    const usernameEncrypted = encrypt(CONSUMER_KEY);
    const passwordEncrypted = encrypt(CONSUMER_SECRET);

    // Actualizar API para usar query string (WooCommerce)
    const result = await db.collection('api_configurations').updateOne(
      { nombre: /veo veo/i },
      {
        $set: {
          'autenticacion.configuracion.username': usernameEncrypted,
          'autenticacion.configuracion.password': passwordEncrypted,
          'autenticacion.configuracion.useQueryString': true,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Autenticación actualizada:');
    console.log('   - Credenciales re-encriptadas');
    console.log('   - useQueryString: true (para WooCommerce)');
    console.log('   - Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAuth();
