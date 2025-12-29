import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!!';

// Función de encriptación (igual que en el código)
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

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    // Encriptar credenciales
    const username = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
    const password = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

    // Actualizar autenticación al formato correcto
    api.autenticacion = {
      tipo: 'basic',
      configuracion: {
        username: encrypt(username),
        password: encrypt(password)
      }
    };

    // Guardar
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { autenticacion: api.autenticacion } }
    );

    console.log('✅ Autenticación de Veo Veo actualizada correctamente');
    console.log('   Tipo: basic');
    console.log('   Username encriptado: ✓');
    console.log('   Password encriptado: ✓');

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAuth();
