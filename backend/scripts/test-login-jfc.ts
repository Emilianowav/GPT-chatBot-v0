import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('🧪 Probando login de JFC Techno...\n');

    const API_URL = 'http://localhost:3001';
    
    // Test 1: Login con credenciales correctas
    console.log('📋 Test 1: Login con credenciales correctas');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    
    const response1 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin_jfc',
        password: 'jfc2024!'
      })
    });

    const data1 = await response1.json();
    console.log('   Status:', response1.status);
    console.log('   Response:', JSON.stringify(data1, null, 2));

    if (response1.ok) {
      console.log('   ✅ Login exitoso!');
      console.log('   Token:', data1.token?.substring(0, 50) + '...');
    } else {
      console.log('   ❌ Login fallido');
    }

    // Test 2: Login con contraseña incorrecta
    console.log('\n📋 Test 2: Login con contraseña incorrecta');
    const response2 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin_jfc',
        password: 'wrong_password'
      })
    });

    const data2 = await response2.json();
    console.log('   Status:', response2.status);
    console.log('   Response:', JSON.stringify(data2, null, 2));

    // Test 3: Verificar que el servidor está corriendo
    console.log('\n📋 Test 3: Verificar servidor');
    try {
      const healthResponse = await fetch(`${API_URL}/health`);
      console.log('   Health check status:', healthResponse.status);
      if (healthResponse.ok) {
        console.log('   ✅ Servidor corriendo correctamente');
      }
    } catch (error) {
      console.log('   ❌ Servidor no responde');
      console.log('   Error:', error.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 RESUMEN:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('API URL:', API_URL);
    console.log('Endpoint:', '/api/auth/login');
    console.log('Username: admin_jfc');
    console.log('Password: jfc2024!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

testLogin();
