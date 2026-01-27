import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars!!';

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

async function crearApiConfigWooCommerce() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const apiConfigsCollection = db.collection('api_configs');
    const flowsCollection = db.collection('flows');

    console.log('🔧 CREANDO API CONFIG DE WOOCOMMERCE PARA VEO VEO\n');
    console.log('═'.repeat(70));

    // Credenciales de WooCommerce según documentación
    const consumerKey = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
    const consumerSecret = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';
    const baseUrl = 'https://www.veoveolibros.com.ar/wp-json/wc/v3';

    console.log('📋 DATOS DE LA API:');
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Consumer Key: ${consumerKey.substring(0, 20)}...`);
    console.log(`   Consumer Secret: ${consumerSecret.substring(0, 20)}...`);
    console.log('');

    // Encriptar credenciales
    console.log('🔐 Encriptando credenciales...');
    const usernameEncrypted = encrypt(consumerKey);
    const passwordEncrypted = encrypt(consumerSecret);
    console.log('✅ Credenciales encriptadas');
    console.log('');

    // Crear API Config
    const apiConfig = {
      empresaId: 'Veo Veo',
      nombre: 'WooCommerce API - Veo Veo',
      tipo: 'woocommerce',
      baseUrl: baseUrl,
      autenticacion: {
        tipo: 'basic',
        configuracion: {
          username: usernameEncrypted,
          password: passwordEncrypted
        }
      },
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Insertando API Config en BD...');
    const result = await apiConfigsCollection.insertOne(apiConfig);
    const apiConfigId = result.insertedId;
    
    console.log('✅ API Config creada:');
    console.log(`   ID: ${apiConfigId}`);
    console.log('');

    // Actualizar nodo WooCommerce en el flujo
    console.log('🔧 Actualizando nodo WooCommerce en el flujo...');
    
    const flow = await flowsCollection.findOne({ 
      empresaId: 'Veo Veo', 
      nombre: 'WooCommerce Flow' 
    });

    if (flow) {
      await flowsCollection.updateOne(
        { empresaId: 'Veo Veo', nombre: 'WooCommerce Flow' },
        {
          $set: {
            'nodes.$[node].data.config.apiConfigId': apiConfigId.toString(),
            updatedAt: new Date()
          }
        },
        {
          arrayFilters: [{ 'node.id': 'woocommerce' }]
        }
      );

      console.log('✅ Nodo WooCommerce actualizado con nuevo apiConfigId');
    } else {
      console.log('⚠️  Flujo no encontrado, actualizar manualmente');
    }

    console.log('');
    console.log('═'.repeat(70));
    console.log('✅ API CONFIG CREADA EXITOSAMENTE');
    console.log('═'.repeat(70));
    console.log('');
    console.log('📋 CONFIGURACIÓN:');
    console.log(`   ID: ${apiConfigId}`);
    console.log(`   Empresa: Veo Veo`);
    console.log(`   Tipo: woocommerce`);
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Autenticación: Basic Auth (encriptada)`);
    console.log('');
    console.log('🔧 NODO WOOCOMMERCE:');
    console.log('   ✅ apiConfigId actualizado');
    console.log('   ✅ Parámetros configurados:');
    console.log('      - search: {{titulo}}');
    console.log('      - category: {{categoria}}');
    console.log('      - per_page: 10');
    console.log('');
    console.log('🧪 TESTEAR:');
    console.log('   1. Limpiar: node scripts/limpiar-mi-numero.js');
    console.log('   2. Buscar: "Estoy buscando harry potter"');
    console.log('   3. Buscar: "Tenés novelas?"');
    console.log('   4. DEBE mostrar productos de WooCommerce');
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

crearApiConfigWooCommerce();
