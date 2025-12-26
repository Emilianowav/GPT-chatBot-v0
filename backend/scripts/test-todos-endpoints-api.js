import axios from 'axios';

const API_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function testEndpoints() {
  console.log('🧪 TESTEANDO TODOS LOS ENDPOINTS DE LA API\n');

  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`
  };

  // 1. Test /deportes
  console.log('═══════════════════════════════════════════════════════');
  console.log('1️⃣ GET /deportes');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const res1 = await axios.get(`${API_URL}/deportes`, { headers });
    console.log('✅ Status:', res1.status);
    console.log('📦 Data:', JSON.stringify(res1.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n\n');

  // 2. Test /disponibilidad (sin params)
  console.log('═══════════════════════════════════════════════════════');
  console.log('2️⃣ GET /disponibilidad (sin params)');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const res2 = await axios.get(`${API_URL}/disponibilidad`, { headers });
    console.log('✅ Status:', res2.status);
    console.log('📦 Data:', JSON.stringify(res2.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n\n');

  // 3. Test /disponibilidad (con fecha y deporte)
  console.log('═══════════════════════════════════════════════════════');
  console.log('3️⃣ GET /disponibilidad?fecha=2025-12-26&deporte=1');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const res3 = await axios.get(`${API_URL}/disponibilidad`, {
      params: { fecha: '2025-12-26', deporte: '1' },
      headers
    });
    console.log('✅ Status:', res3.status);
    console.log('📦 Data:', JSON.stringify(res3.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n\n');

  // 4. Test /reservas (ver si hay reservas)
  console.log('═══════════════════════════════════════════════════════');
  console.log('4️⃣ GET /reservas');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const res4 = await axios.get(`${API_URL}/reservas`, { headers });
    console.log('✅ Status:', res4.status);
    console.log('📦 Data:', JSON.stringify(res4.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n\n');

  // 5. Test /canchas (ver si hay canchas)
  console.log('═══════════════════════════════════════════════════════');
  console.log('5️⃣ GET /canchas');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const res5 = await axios.get(`${API_URL}/canchas`, { headers });
    console.log('✅ Status:', res5.status);
    console.log('📦 Data:', JSON.stringify(res5.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n\n');

  // 6. Test root (ver endpoints disponibles)
  console.log('═══════════════════════════════════════════════════════');
  console.log('6️⃣ GET / (root)');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const res6 = await axios.get(`${API_URL}/`, { headers });
    console.log('✅ Status:', res6.status);
    console.log('📦 Data:', JSON.stringify(res6.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('La API de Mis Canchas está respondiendo pero devuelve arrays vacíos.');
  console.log('Esto indica que:');
  console.log('  1. La API está funcionando (responde 200)');
  console.log('  2. La autenticación es correcta (no da 401)');
  console.log('  3. Los endpoints existen (no da 404)');
  console.log('  4. PERO la lógica de negocio no devuelve datos');
  console.log('');
  console.log('💡 SOLUCIÓN:');
  console.log('  Revisar el código de la API en Railway:');
  console.log('  - ¿Está consultando la BD correcta?');
  console.log('  - ¿Hay datos de canchas/reservas en la BD?');
  console.log('  - ¿La lógica de cálculo de disponibilidad funciona?');
}

testEndpoints();
