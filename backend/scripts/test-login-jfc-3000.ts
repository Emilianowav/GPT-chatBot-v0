import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function testLoginDirecto() {
  try {
    console.log('🧪 Test de Login Directo - JFC Techno\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // Importar el servicio de auth
    const { login } = await import('../src/services/authService.js');

    // Test 1: Login correcto
    console.log('📋 Test 1: Login con credenciales correctas');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!\n');

    const result1 = await login('admin_jfc', 'jfc2024!');
    
    console.log('   Resultado:', JSON.stringify(result1, null, 2));

    if (result1.success) {
      console.log('\n   ✅ LOGIN EXITOSO!');
      console.log('   Token generado:', result1.token?.substring(0, 50) + '...');
      console.log('   Usuario:', result1.user?.username);
      console.log('   Empresa:', result1.user?.empresaNombre);
      console.log('   Role:', result1.user?.role);
    } else {
      console.log('\n   ❌ LOGIN FALLIDO');
      console.log('   Mensaje:', result1.message);
    }

    // Test 2: Login con contraseña incorrecta
    console.log('\n\n📋 Test 2: Login con contraseña incorrecta');
    const result2 = await login('admin_jfc', 'wrong_password');
    console.log('   Success:', result2.success);
    console.log('   Mensaje:', result2.message);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 CONFIGURACIÓN DEL SERVIDOR:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Puerto configurado en .env:', process.env.PORT || '3000');
    console.log('');
    console.log('📋 CREDENCIALES VÁLIDAS:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    console.log('   URL Backend: http://localhost:' + (process.env.PORT || '3000'));
    console.log('   Endpoint: /api/auth/login');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testLoginDirecto();
