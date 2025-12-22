/**
 * Test directo contra la API de PRODUCCIÓN
 * Para verificar que el login funciona en el servidor desplegado
 */

import fetch from 'node-fetch';

// URL de producción desde VERCEL_SETUP.md
const PRODUCTION_API_URL = process.env.PRODUCTION_API_URL || 'https://gpt-chatbot-v0.onrender.com';

async function testProductionAPI() {
  console.log('🌐 TEST DE API EN PRODUCCIÓN\n');
  console.log('URL de producción:', PRODUCTION_API_URL);
  console.log('');

  // Test 1: Health check
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 TEST 1: Health Check');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const healthResponse = await fetch(`${PRODUCTION_API_URL}/health`, {
      method: 'GET',
    });
    
    console.log('Status:', healthResponse.status);
    console.log('OK:', healthResponse.ok);
    
    if (healthResponse.ok) {
      const text = await healthResponse.text();
      console.log('Response:', text);
      console.log('✅ Servidor respondiendo correctamente\n');
    } else {
      console.log('❌ Servidor no responde correctamente\n');
    }
  } catch (error: any) {
    console.error('❌ Error en health check:', error.message);
    console.log('⚠️  Verifica que la URL de producción sea correcta\n');
  }

  // Test 2: Login con admin_jfc
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 TEST 2: Login admin_jfc');
  console.log('═══════════════════════════════════════════════════════\n');

  const loginPayload = {
    username: 'admin_jfc',
    password: 'jfc2024!'
  };

  console.log('📤 Enviando:', JSON.stringify(loginPayload, null, 2));
  console.log('📍 Endpoint:', `${PRODUCTION_API_URL}/api/auth/login`);
  console.log('');

  try {
    const loginResponse = await fetch(`${PRODUCTION_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginPayload)
    });

    console.log('📥 Status:', loginResponse.status);
    console.log('📥 Status Text:', loginResponse.statusText);
    console.log('📥 OK:', loginResponse.ok);
    console.log('');

    const responseText = await loginResponse.text();
    console.log('📥 Response (raw):', responseText);
    console.log('');

    try {
      const data = JSON.parse(responseText);
      console.log('📥 Response (parsed):', JSON.stringify(data, null, 2));
      console.log('');

      if (loginResponse.ok && data.success) {
        console.log('✅ LOGIN EXITOSO EN PRODUCCIÓN');
        console.log('   Token:', data.token?.substring(0, 50) + '...');
        console.log('   Username:', data.user?.username);
        console.log('   Empresa:', data.user?.empresaNombre);
        console.log('   Role:', data.user?.role);
      } else {
        console.log('❌ LOGIN FALLIDO EN PRODUCCIÓN');
        console.log('   Mensaje:', data.message);
        console.log('');
        console.log('⚠️  POSIBLES CAUSAS:');
        console.log('   1. El usuario no existe en la DB de producción');
        console.log('   2. La contraseña es incorrecta');
        console.log('   3. El usuario está inactivo (activo: false)');
        console.log('   4. Problema con el hash de la contraseña');
      }
    } catch (parseError) {
      console.log('❌ Error parseando JSON. Response no es JSON válido.');
      console.log('   Esto puede indicar un error 500 o HTML de error.');
    }

  } catch (error: any) {
    console.error('❌ Error en request:', error.message);
    console.log('');
    console.log('⚠️  POSIBLES CAUSAS:');
    console.log('   1. URL de producción incorrecta');
    console.log('   2. Servidor de producción caído');
    console.log('   3. Problema de red/CORS');
    console.log('   4. Backend no desplegado correctamente');
  }

  // Test 3: Comparar con un usuario que SÍ funciona
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 TEST 3: Comparación con Usuario que Funciona');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Si tienes las credenciales de SanJose u otro usuario que funciona,');
  console.log('prueba hacer login con ese usuario y compara los resultados.\n');

  console.log('Ejemplo:');
  console.log('  const sanjosePayload = {');
  console.log('    username: "usuario_sanjose",');
  console.log('    password: "contraseña_sanjose"');
  console.log('  };\n');

  // Resumen
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 INSTRUCCIONES PARA EJECUTAR ESTE SCRIPT');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('1. Edita este archivo y cambia PRODUCTION_API_URL por tu URL real');
  console.log('   Ejemplo: https://tu-backend.onrender.com');
  console.log('   O: https://tu-backend.railway.app');
  console.log('');
  console.log('2. Ejecuta:');
  console.log('   PRODUCTION_API_URL="https://tu-url.com" npx tsx scripts/test-production-api.ts');
  console.log('');
  console.log('3. Si el login falla, ejecuta el script de setup en producción:');
  console.log('   npx tsx scripts/setup-jfc-techno-production.ts');
  console.log('═══════════════════════════════════════════════════════\n');
}

testProductionAPI();
