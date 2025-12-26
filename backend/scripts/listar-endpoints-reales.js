import axios from 'axios';

const API_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function listarEndpoints() {
  console.log('🔍 BUSCANDO ENDPOINTS REALES DE LA API\n');

  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`
  };

  // Lista de posibles endpoints
  const posiblesEndpoints = [
    // Deportes
    '/deportes',
    '/sports',
    
    // Canchas
    '/canchas',
    '/courts',
    '/fields',
    
    // Disponibilidad
    '/disponibilidad',
    '/availability',
    
    // Reservas
    '/reservas',
    '/bookings',
    '/reservations',
    
    // Precios
    '/precios',
    '/prices',
    '/pricing',
    
    // Horarios
    '/horarios',
    '/schedules',
    '/slots',
    
    // Turnos
    '/turnos',
    '/shifts',
    
    // Health check
    '/health',
    '/status',
    '/',
    ''
  ];

  const endpointsExistentes = [];
  const endpointsNoExistentes = [];

  for (const endpoint of posiblesEndpoints) {
    try {
      const url = endpoint === '' ? API_URL.replace('/api/v1', '') : `${API_URL}${endpoint}`;
      const res = await axios.get(url, { 
        headers,
        validateStatus: (status) => status < 500 // Aceptar 4xx como respuesta válida
      });
      
      if (res.status === 200) {
        console.log(`✅ ${endpoint || '/'} → ${res.status}`);
        endpointsExistentes.push({
          endpoint: endpoint || '/',
          status: res.status,
          data: res.data
        });
      } else if (res.status === 400) {
        console.log(`⚠️  ${endpoint || '/'} → ${res.status} (existe pero requiere params)`);
        endpointsExistentes.push({
          endpoint: endpoint || '/',
          status: res.status,
          data: res.data
        });
      } else {
        console.log(`❌ ${endpoint || '/'} → ${res.status}`);
        endpointsNoExistentes.push(endpoint || '/');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ ${endpoint || '/'} → 404 (no existe)`);
        endpointsNoExistentes.push(endpoint || '/');
      } else if (error.response?.status === 400) {
        console.log(`⚠️  ${endpoint || '/'} → 400 (existe pero requiere params)`);
        endpointsExistentes.push({
          endpoint: endpoint || '/',
          status: 400,
          data: error.response.data
        });
      } else {
        console.log(`⚠️  ${endpoint || '/'} → ${error.response?.status || 'Error'}`);
      }
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('📊 ENDPOINTS QUE EXISTEN');
  console.log('═══════════════════════════════════════════════════════\n');

  endpointsExistentes.forEach(({ endpoint, status, data }) => {
    console.log(`\n🔹 ${endpoint}`);
    console.log(`   Status: ${status}`);
    console.log(`   Data:`, JSON.stringify(data, null, 2).substring(0, 200));
  });

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('💡 CONCLUSIÓN');
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (endpointsExistentes.length > 0) {
    console.log('Endpoints disponibles:');
    endpointsExistentes.forEach(({ endpoint }) => {
      console.log(`  - ${endpoint}`);
    });
  } else {
    console.log('❌ No se encontraron endpoints disponibles');
    console.log('La API puede estar usando rutas diferentes o requiere autenticación especial');
  }
}

listarEndpoints();
