import axios from 'axios';

const API_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function buscarEndpoint() {
  console.log('🔍 BUSCANDO ENDPOINT QUE TRAIGA TODAS LAS CANCHAS Y HORARIOS\n');

  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`
  };

  const posiblesEndpoints = [
    // Variantes de disponibilidad
    { url: '/disponibilidad', params: { fecha: '2025-12-26', deporte: 'paddle' } },
    { url: '/disponibilidad', params: { fecha: '2025-12-26', deporte: 'futbol' } },
    { url: '/disponibilidad', params: { fecha: '2025-12-26', deporte: '1' } },
    { url: '/disponibilidad', params: { fecha: '2025-12-26', deporte: '2' } },
    
    // Variantes de canchas
    { url: '/canchas', params: { fecha: '2025-12-26', deporte: 'paddle' } },
    { url: '/canchas', params: { deporte: 'paddle' } },
    { url: '/canchas', params: {} },
    
    // Variantes de horarios
    { url: '/horarios', params: { fecha: '2025-12-26', deporte: 'paddle' } },
    { url: '/horarios', params: { fecha: '2025-12-26' } },
    
    // Variantes de turnos
    { url: '/turnos', params: { fecha: '2025-12-26', deporte: 'paddle' } },
    { url: '/turnos/disponibles', params: { fecha: '2025-12-26', deporte: 'paddle' } },
    
    // Variantes de slots
    { url: '/slots', params: { fecha: '2025-12-26', deporte: 'paddle' } },
    { url: '/slots/disponibles', params: { fecha: '2025-12-26', deporte: 'paddle' } },
    
    // Disponibilidad completa
    { url: '/disponibilidad/completa', params: { fecha: '2025-12-26', deporte: 'paddle' } },
    { url: '/disponibilidad/all', params: { fecha: '2025-12-26', deporte: 'paddle' } },
    { url: '/disponibilidad/todas', params: { fecha: '2025-12-26', deporte: 'paddle' } },
  ];

  for (const { url, params } of posiblesEndpoints) {
    try {
      const queryString = new URLSearchParams(params).toString();
      console.log(`📍 Probando: ${url}?${queryString}`);
      
      const res = await axios.get(`${API_URL}${url}`, {
        params,
        headers,
        validateStatus: (status) => status < 500
      });
      
      if (res.status === 200) {
        console.log(`   ✅ ${res.status}`);
        console.log(`   📦 Data:`, JSON.stringify(res.data).substring(0, 200));
        
        // Si tiene datos, mostrar más detalle
        if (res.data.canchas_disponibles?.length > 0 || 
            res.data.data?.length > 0 || 
            res.data.horarios?.length > 0) {
          console.log('\n   🎯 ¡ENCONTRADO! Este endpoint devuelve datos:');
          console.log(JSON.stringify(res.data, null, 2));
          console.log('\n');
        }
      } else if (res.status === 400) {
        console.log(`   ⚠️  ${res.status} - ${res.data.error?.message || 'Requiere params'}`);
      } else {
        console.log(`   ❌ ${res.status}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`   ❌ 404 - No existe`);
      } else {
        console.log(`   ⚠️  ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
      }
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('📊 PROBANDO /disponibilidad CON DIFERENTES COMBINACIONES');
  console.log('═══════════════════════════════════════════════════════\n');

  const combinaciones = [
    { fecha: '2025-12-26', deporte: 'paddle' },
    { fecha: '2025-12-26', deporte: 'futbol' },
    { fecha: '2025-12-26', deporte: '1' },
    { fecha: '2025-12-26', deporte: '2' },
    { fecha: '2025-12-26' },
    { deporte: 'paddle' },
  ];

  for (const params of combinaciones) {
    try {
      const queryString = new URLSearchParams(params).toString();
      console.log(`📍 /disponibilidad?${queryString}`);
      
      const res = await axios.get(`${API_URL}/disponibilidad`, {
        params,
        headers,
        validateStatus: (status) => status < 500
      });
      
      console.log(`   Status: ${res.status}`);
      console.log(`   Data:`, JSON.stringify(res.data, null, 2));
      console.log('');
    } catch (error) {
      console.log(`   ❌ ${error.response?.status || 'Error'}`);
      console.log(`   ${JSON.stringify(error.response?.data, null, 2)}`);
      console.log('');
    }
  }
}

buscarEndpoint();
