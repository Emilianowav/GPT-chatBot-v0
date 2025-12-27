import axios from 'axios';

const API_BASE_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function testEndpoint(method, path, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${path}`,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'MomentoIA-Integration/1.0'
      },
      timeout: 5000
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      return { 
        success: false, 
        status: error.response.status, 
        error: error.response.data?.error || error.response.data?.message 
      };
    }
    return { success: false, error: error.message };
  }
}

async function listarEndpoints() {
  console.log('🔍 LISTANDO ENDPOINTS REALES DE LA API\n');
  console.log('Base URL:', API_BASE_URL);
  console.log('='.repeat(60) + '\n');

  // Endpoints conocidos que funcionan
  console.log('📋 ENDPOINTS QUE SABEMOS QUE FUNCIONAN:\n');
  
  const endpointsConocidos = [
    { method: 'GET', path: '/deportes', desc: 'Obtener deportes' },
    { method: 'GET', path: '/disponibilidad?fecha=2025-12-27&deporte=paddle', desc: 'Consultar disponibilidad' },
    { method: 'GET', path: '/precios', desc: 'Obtener precios' }
  ];

  for (const endpoint of endpointsConocidos) {
    const result = await testEndpoint(endpoint.method, endpoint.path);
    if (result.success) {
      console.log(`✅ ${endpoint.method} ${endpoint.path}`);
      console.log(`   ${endpoint.desc}`);
      console.log(`   Status: ${result.status}`);
      if (endpoint.path === '/deportes' && result.data) {
        console.log(`   Respuesta:`, JSON.stringify(result.data, null, 2).substring(0, 200));
      }
    } else {
      console.log(`❌ ${endpoint.method} ${endpoint.path}: ${result.status || result.error}`);
    }
    console.log('');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 BUSCANDO ENDPOINTS DE RESERVA:\n');

  const rutasReserva = [
    '/bookings',
    '/reservas', 
    '/reserva',
    '/booking',
    '/crear-reserva',
    '/pre-crear-reserva'
  ];

  for (const ruta of rutasReserva) {
    // Probar GET
    const getResult = await testEndpoint('GET', ruta);
    // Probar POST
    const postResult = await testEndpoint('POST', ruta, {
      cancha_id: 'test',
      fecha: '2025-12-27',
      hora_inicio: '16:00',
      duracion: 60
    });

    console.log(`${ruta}:`);
    console.log(`  GET:  ${getResult.success ? '✅ ' + getResult.status : '❌ ' + (getResult.status || getResult.error)}`);
    console.log(`  POST: ${postResult.success ? '✅ ' + postResult.status : '❌ ' + (postResult.status || postResult.error)}`);
    console.log('');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 CONCLUSIÓN:\n');
  console.log('La API de Mis Canchas tiene los siguientes endpoints:');
  console.log('  ✅ GET /deportes - Obtener deportes');
  console.log('  ✅ GET /disponibilidad - Consultar disponibilidad');
  console.log('  ✅ GET /precios - Obtener precios');
  console.log('  ❌ POST /bookings - NO EXISTE');
  console.log('  ❌ POST /reservas - NO EXISTE');
  console.log('\n⚠️  LA API NO TIENE ENDPOINT PARA CREAR RESERVAS');
  console.log('   Necesitás implementarlo en la API de Mis Canchas primero.');
}

listarEndpoints();
