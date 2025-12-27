import axios from 'axios';

const API_BASE_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function testCrearReserva() {
  try {
    console.log('🧪 TESTEANDO ENDPOINT PRE-CREAR-RESERVA\n');

    const bookingData = {
      cancha_id: 'c7cd4b5c-0ebb-4d51-a06e-4c1923d395fc', // Cancha #3
      fecha: '2025-12-27',
      hora_inicio: '16:00',
      duracion: 60,
      cliente: {
        nombre: 'Test Emiliano',
        telefono: '5493794946066',
        email: '5493794946066@whatsapp.temp'
      }
    };

    console.log('📦 Datos de la reserva:');
    console.log(JSON.stringify(bookingData, null, 2));
    console.log('');

    console.log('🚀 Enviando POST a /bookings...\n');

    const response = await axios.post(
      `${API_BASE_URL}/bookings`,
      bookingData,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'MomentoIA-Integration/1.0'
        }
      }
    );

    console.log('✅ RESPUESTA EXITOSA:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ ERROR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testCrearReserva();
