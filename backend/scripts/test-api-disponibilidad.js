import axios from 'axios';

const API_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function testDisponibilidad() {
  console.log('🧪 TESTEANDO API DE DISPONIBILIDAD\n');

  // Test 1: Con los parámetros que envía el workflow
  console.log('📋 TEST 1: Parámetros del workflow');
  console.log('   fecha: 2025-12-26');
  console.log('   deporte: 2');
  console.log('   hora: 15:00');
  console.log('   duracion: 60\n');

  try {
    const response1 = await axios.get(`${API_URL}/disponibilidad`, {
      params: {
        fecha: '2025-12-26',
        deporte: '2',
        hora: '15:00',
        duracion: 60
      },
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    console.log('✅ Respuesta:', JSON.stringify(response1.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n\n');

  // Test 2: Sin hora ni duración (traer todas las canchas del día)
  console.log('📋 TEST 2: Solo fecha y deporte (sin hora ni duración)');
  console.log('   fecha: 2025-12-26');
  console.log('   deporte: 2\n');

  try {
    const response2 = await axios.get(`${API_URL}/disponibilidad`, {
      params: {
        fecha: '2025-12-26',
        deporte: '2'
      },
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    console.log('✅ Respuesta:', JSON.stringify(response2.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n\n');

  // Test 3: Sin parámetros (ver qué devuelve)
  console.log('📋 TEST 3: Sin parámetros\n');

  try {
    const response3 = await axios.get(`${API_URL}/disponibilidad`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    console.log('✅ Respuesta:', JSON.stringify(response3.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDisponibilidad();
