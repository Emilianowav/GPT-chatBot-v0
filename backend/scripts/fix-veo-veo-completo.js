import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!!';

// Función de encriptación
function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function fixVeoVeoCompleto() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Credenciales WooCommerce
    const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
    const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

    console.log('🔐 Encriptando credenciales...');
    const usernameEncrypted = encrypt(CONSUMER_KEY);
    const passwordEncrypted = encrypt(CONSUMER_SECRET);
    console.log('✅ Credenciales encriptadas\n');

    // Buscar API de Veo Veo
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('📡 API encontrada:', api.nombre);
    console.log('');

    // Actualizar API con todas las correcciones
    const update = {
      $set: {
        // Corregir autenticación
        'autenticacion.configuracion.username': usernameEncrypted,
        'autenticacion.configuracion.password': passwordEncrypted,
        
        // Agregar método a cada endpoint
        'endpoints.0.method': 'GET',
        'endpoints.1.method': 'GET',
        'endpoints.2.method': 'GET',
        'endpoints.3.method': 'GET',
        'endpoints.4.method': 'GET',
        'endpoints.5.method': 'POST',
        'endpoints.6.method': 'POST',
        
        // Agregar ID al workflow
        'workflows.0.id': 'veo-veo-compra-libros',
        
        // Cambiar validación de email a texto
        'workflows.0.steps.5.validacion.tipo': 'texto',
        
        updatedAt: new Date()
      }
    };

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      update
    );

    console.log('✅ API actualizada con:');
    console.log('   - Credenciales re-encriptadas correctamente');
    console.log('   - Método HTTP agregado a todos los endpoints');
    console.log('   - ID agregado al workflow');
    console.log('   - Validación de email cambiada a texto');
    console.log('');

    // Verificar
    const apiActualizada = await db.collection('api_configurations').findOne({
      _id: api._id
    });

    console.log('📋 Verificación:');
    console.log('   Endpoints con method:');
    apiActualizada.endpoints.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.nombre}: ${ep.method || 'FALTA'}`);
    });
    console.log('');
    console.log('   Workflow ID:', apiActualizada.workflows[0].id || 'FALTA');
    console.log('   Validación paso 6 (email):', apiActualizada.workflows[0].steps[5].validacion.tipo);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixVeoVeoCompleto();
