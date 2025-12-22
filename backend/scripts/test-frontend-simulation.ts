/**
 * Simula exactamente lo que hace el frontend al hacer login
 * Para identificar diferencias entre lo que funciona (backend directo) y lo que falla (frontend)
 */

import fetch from 'node-fetch';

// Usar la URL de producción o local según necesites
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testFrontendSimulation() {
  try {
    console.log('🧪 SIMULACIÓN EXACTA DEL FRONTEND\n');
    console.log('API URL:', API_URL);
    console.log('');

    // Test 1: admin_jfc (JFC Techno) - El que NO funciona en producción
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 TEST 1: admin_jfc (JFC Techno)');
    console.log('═══════════════════════════════════════════════════════\n');

    const payload1 = {
      username: 'admin_jfc',
      password: 'jfc2024!'
    };

    console.log('📤 Payload enviado:', JSON.stringify(payload1, null, 2));
    console.log('📍 Endpoint:', `${API_URL}/api/auth/login`);
    console.log('');

    try {
      const response1 = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload1)
      });

      console.log('📥 Response Status:', response1.status);
      console.log('📥 Response OK:', response1.ok);
      console.log('📥 Response Headers:', Object.fromEntries(response1.headers.entries()));
      console.log('');

      const data1 = await response1.json();
      console.log('📥 Response Body:', JSON.stringify(data1, null, 2));
      console.log('');

      if (response1.ok && data1.success) {
        console.log('✅ LOGIN EXITOSO');
        console.log('   Token:', data1.token?.substring(0, 50) + '...');
        console.log('   User:', data1.user?.username);
        console.log('   Empresa:', data1.user?.empresaNombre);
      } else {
        console.log('❌ LOGIN FALLIDO');
        console.log('   Mensaje:', data1.message);
      }
    } catch (error: any) {
      console.error('❌ Error en request:', error.message);
    }

    // Test 2: Probar con username en minúsculas (por si acaso)
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 TEST 2: admin_jfc (lowercase forzado)');
    console.log('═══════════════════════════════════════════════════════\n');

    const payload2 = {
      username: 'admin_jfc'.toLowerCase(),
      password: 'jfc2024!'
    };

    console.log('📤 Payload enviado:', JSON.stringify(payload2, null, 2));

    try {
      const response2 = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload2)
      });

      console.log('📥 Response Status:', response2.status);
      const data2 = await response2.json();
      console.log('📥 Response:', JSON.stringify(data2, null, 2));
      console.log('');

      if (response2.ok && data2.success) {
        console.log('✅ LOGIN EXITOSO');
      } else {
        console.log('❌ LOGIN FALLIDO');
      }
    } catch (error: any) {
      console.error('❌ Error en request:', error.message);
    }

    // Test 3: Probar con espacios (por si el frontend está enviando espacios)
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 TEST 3: Detectar espacios en username/password');
    console.log('═══════════════════════════════════════════════════════\n');

    const testCases = [
      { username: ' admin_jfc', password: 'jfc2024!', desc: 'Espacio al inicio del username' },
      { username: 'admin_jfc ', password: 'jfc2024!', desc: 'Espacio al final del username' },
      { username: 'admin_jfc', password: ' jfc2024!', desc: 'Espacio al inicio del password' },
      { username: 'admin_jfc', password: 'jfc2024! ', desc: 'Espacio al final del password' },
    ];

    for (const testCase of testCases) {
      console.log(`Probando: ${testCase.desc}`);
      console.log(`  Username: "${testCase.username}" (length: ${testCase.username.length})`);
      console.log(`  Password: "${testCase.password}" (length: ${testCase.password.length})`);

      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase)
        });

        const data = await response.json();
        console.log(`  Resultado: ${data.success ? '✅ EXITOSO' : '❌ FALLIDO'}`);
        if (!data.success) {
          console.log(`  Mensaje: ${data.message}`);
        }
      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
      }
      console.log('');
    }

    // Test 4: Verificar si el servidor está respondiendo correctamente
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 TEST 4: Health Check del Servidor');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      const healthResponse = await fetch(`${API_URL}/health`);
      console.log('Health endpoint status:', healthResponse.status);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.text();
        console.log('Health response:', healthData);
      }
    } catch (error: any) {
      console.log('❌ Health check falló:', error.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 RESUMEN DE TESTS');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('API URL:', API_URL);
    console.log('Endpoint: /api/auth/login');
    console.log('');
    console.log('🔐 CREDENCIALES CORRECTAS:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    console.log('');
    console.log('⚠️  Si el login falla en el frontend pero funciona aquí,');
    console.log('   el problema puede ser:');
    console.log('   1. CORS (el navegador bloquea la petición)');
    console.log('   2. URL incorrecta en el frontend (.env)');
    console.log('   3. El frontend está enviando datos adicionales');
    console.log('   4. Problema con el token JWT en localStorage');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testFrontendSimulation();
