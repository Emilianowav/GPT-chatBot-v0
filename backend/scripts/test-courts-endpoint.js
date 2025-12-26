import axios from 'axios';

const API_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function testCourtsEndpoint() {
  console.log('🧪 TESTEANDO ENDPOINT /courts/:courtId/availability\n');

  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`
  };

  // Primero necesitamos obtener IDs de canchas
  // Probemos con el ID del ejemplo que diste
  const courtId = '550e8400-e29b-41d4-a716-446655440001';
  const date = '2025-12-26';

  console.log('═══════════════════════════════════════════════════════');
  console.log(`1️⃣ GET /courts/${courtId}/availability?date=${date}`);
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const res = await axios.get(`${API_URL}/courts/${courtId}/availability`, {
      params: { date },
      headers
    });
    console.log('✅ Status:', res.status);
    console.log('📦 Data:', JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n\n');

  // Probar con diferentes IDs
  console.log('═══════════════════════════════════════════════════════');
  console.log('2️⃣ Probando con diferentes court IDs');
  console.log('═══════════════════════════════════════════════════════\n');

  const possibleIds = [
    '550e8400-e29b-41d4-a716-446655440001',
    'c7cd4b5c-0ebb-4d51-a06e-4c1923d395fc', // Del endpoint /precios
    '1',
    '2',
    'paddle-1',
    'futbol-1'
  ];

  for (const id of possibleIds) {
    try {
      console.log(`📍 Probando courtId: ${id}`);
      const res = await axios.get(`${API_URL}/courts/${id}/availability`, {
        params: { date },
        headers
      });
      console.log(`   ✅ ${res.status} - Slots disponibles: ${res.data.data?.availableSlots?.length || 0}`);
      if (res.data.data?.availableSlots?.length > 0) {
        console.log(`   📊 Primer slot:`, res.data.data.availableSlots[0]);
      }
    } catch (error) {
      console.log(`   ❌ ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('📊 CONCLUSIÓN');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('Para que el workflow funcione necesitamos:');
  console.log('  1. Un endpoint para obtener la lista de canchas (courts)');
  console.log('  2. O los IDs de las canchas hardcodeados por deporte');
  console.log('  3. Luego consultar /courts/:id/availability para cada una');
}

testCourtsEndpoint();
