import axios from 'axios';

const API_BASE_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

const bookingData = {
  cancha_id: 'c7cd4b5c-0ebb-4d51-a06e-4c1923d395fc',
  fecha: '2025-12-27',
  hora_inicio: '16:00',
  duracion: 60,
  cliente: {
    nombre: 'Test Emiliano',
    telefono: '5493794946066',
    email: '5493794946066@whatsapp.temp'
  }
};

const rutasPosibles = [
  '/bookings',
  '/reservas',
  '/reserva',
  '/booking',
  '/crear-reserva',
  '/pre-crear-reserva',
  '/reservas/crear',
  '/bookings/create'
];

async function testRuta(ruta) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${ruta}`,
      bookingData,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'MomentoIA-Integration/1.0'
        },
        timeout: 5000
      }
    );

    console.log(`✅ ${ruta}: ${response.status}`);
    console.log('   Respuesta:', JSON.stringify(response.data, null, 2).substring(0, 200));
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ ${ruta}: ${error.response.status} - ${error.response.data?.error || error.response.data?.message || 'Error'}`);
    } else {
      console.log(`❌ ${ruta}: ${error.message}`);
    }
    return false;
  }
}

async function testearRutas() {
  console.log('🧪 TESTEANDO RUTAS POSIBLES PARA CREAR RESERVA\n');
  console.log('📦 Datos de prueba:', JSON.stringify(bookingData, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');

  for (const ruta of rutasPosibles) {
    await testRuta(ruta);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Probando también con GET para ver qué endpoints existen:\n');

  const rutasGET = ['/bookings', '/reservas', '/courts'];
  
  for (const ruta of rutasGET) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}${ruta}`,
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'User-Agent': 'MomentoIA-Integration/1.0'
          },
          timeout: 5000
        }
      );
      console.log(`✅ GET ${ruta}: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ GET ${ruta}: ${error.response.status}`);
      } else {
        console.log(`❌ GET ${ruta}: ${error.message}`);
      }
    }
  }
}

testearRutas();
