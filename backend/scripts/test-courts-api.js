import axios from 'axios';

const API_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function testCourtsAPI() {
  console.log('🧪 TESTEANDO API DE COURTS\n');

  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`
  };

  // 1. Obtener lista de canchas
  console.log('═══════════════════════════════════════════════════════');
  console.log('1️⃣ GET /courts (obtener todas las canchas)');
  console.log('═══════════════════════════════════════════════════════\n');

  let courts = [];
  try {
    const res1 = await axios.get(`${API_URL}/courts`, { headers });
    console.log('✅ Status:', res1.status);
    console.log('📦 Data:', JSON.stringify(res1.data, null, 2));
    
    if (res1.data.data && Array.isArray(res1.data.data)) {
      courts = res1.data.data;
      console.log(`\n✅ ${courts.length} canchas encontradas`);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n\n');

  // 2. Si hay canchas, consultar disponibilidad de la primera
  if (courts.length > 0) {
    const court = courts[0];
    console.log('═══════════════════════════════════════════════════════');
    console.log(`2️⃣ GET /courts/${court.id}/availability?date=2025-12-26`);
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      const res2 = await axios.get(`${API_URL}/courts/${court.id}/availability`, {
        params: { date: '2025-12-26' },
        headers
      });
      console.log('✅ Status:', res2.status);
      console.log('📦 Data:', JSON.stringify(res2.data, null, 2));
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }

  console.log('\n\n');

  // 3. Probar con diferentes variantes de la URL
  console.log('═══════════════════════════════════════════════════════');
  console.log('3️⃣ Probando variantes de endpoints');
  console.log('═══════════════════════════════════════════════════════\n');

  const endpoints = [
    '/courts',
    '/canchas',
    '/courts?sport=paddle',
    '/courts?sport=futbol',
    '/courts?deporte=1',
    '/courts?deporte=2'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📍 Probando: ${endpoint}`);
      const res = await axios.get(`${API_URL}${endpoint}`, { headers });
      console.log(`   ✅ ${res.status} - ${JSON.stringify(res.data).substring(0, 100)}...`);
    } catch (error) {
      console.log(`   ❌ ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('📊 CONCLUSIÓN');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('El endpoint correcto es:');
  console.log('  1. GET /courts → Obtener lista de canchas');
  console.log('  2. GET /courts/:courtId/availability?date=YYYY-MM-DD → Disponibilidad');
  console.log('');
  console.log('El workflow debe:');
  console.log('  1. Llamar a /courts para obtener canchas del deporte');
  console.log('  2. Filtrar por deporte (paddle/futbol)');
  console.log('  3. Para cada cancha, consultar /courts/:id/availability');
  console.log('  4. Matchear horarios disponibles con hora_preferida y duración');
}

testCourtsAPI();
