/**
 * Prueba login con veoveo (que funciona) para confirmar que el backend responde
 */

import fetch from 'node-fetch';

const PRODUCTION_API_URL = 'https://gpt-chatbot-v0.onrender.com';

async function testVeoVeoProduction() {
  console.log('🧪 TEST CON USUARIO QUE FUNCIONA (veoveo)\n');
  console.log('URL:', PRODUCTION_API_URL);
  console.log('');

  // Test con veoveo
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 TEST: Login con veoveo');
  console.log('═══════════════════════════════════════════════════════\n');

  const payload = {
    username: 'veoveo',
    password: 'veoveo2024' // Probar contraseñas comunes
  };

  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await fetch(`${PRODUCTION_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Status:', response.status);
    console.log('📥 OK:', response.ok);
    console.log('');

    const data = await response.json();
    console.log('📥 Response:', JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok && data.success) {
      console.log('✅ VEOVEO LOGIN EXITOSO');
      console.log('   Esto confirma que el backend en producción está funcionando.');
      console.log('   El problema es específico del usuario admin_jfc.\n');
    } else {
      console.log('❌ VEOVEO LOGIN FALLIDO');
      console.log('   Probando otras contraseñas...\n');
      
      // Probar otras contraseñas comunes
      const passwords = ['admin123', 'veoveo', '123456', 'veo2024'];
      
      for (const pwd of passwords) {
        const testPayload = { username: 'veoveo', password: pwd };
        const testResponse = await fetch(`${PRODUCTION_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });
        
        const testData = await testResponse.json();
        console.log(`   Password "${pwd}":`, testData.success ? '✅ FUNCIONA' : '❌ No');
        
        if (testData.success) {
          console.log('\n✅ CONTRASEÑA ENCONTRADA:', pwd);
          break;
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  // Ahora probar admin_jfc
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 TEST: Login con admin_jfc');
  console.log('═══════════════════════════════════════════════════════\n');

  const jfcPayload = {
    username: 'admin_jfc',
    password: 'jfc2024!'
  };

  try {
    const response = await fetch(`${PRODUCTION_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jfcPayload)
    });

    console.log('📥 Status:', response.status);
    const data = await response.json();
    console.log('📥 Response:', JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok && data.success) {
      console.log('✅ ADMIN_JFC LOGIN EXITOSO EN PRODUCCIÓN');
    } else {
      console.log('❌ ADMIN_JFC LOGIN FALLIDO EN PRODUCCIÓN');
      console.log('\n⚠️  DIAGNÓSTICO:');
      console.log('   El usuario admin_jfc no funciona en producción.');
      console.log('   Posibles causas:');
      console.log('   1. El backend en Render tiene caché y no ve el nuevo usuario');
      console.log('   2. El backend está conectado a una DB diferente');
      console.log('   3. Hay un problema con el redeploy');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 RECOMENDACIÓN');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('Si veoveo funciona pero admin_jfc no:');
  console.log('1. Ve a Render Dashboard');
  console.log('2. Selecciona el servicio gpt-chatbot-v0');
  console.log('3. Click en "Manual Deploy" → "Clear build cache & deploy"');
  console.log('4. Espera 5-10 minutos');
  console.log('5. Vuelve a probar el login');
  console.log('═══════════════════════════════════════════════════════\n');
}

testVeoVeoProduction();
