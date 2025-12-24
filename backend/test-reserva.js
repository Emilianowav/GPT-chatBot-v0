import axios from 'axios';

const body = {
  cancha_id: 'c7cd4b5c-0ebb-4d51-a06e-4c1923d395fc',
  fecha: '2025-12-24',
  hora_inicio: '15:00',
  duracion: 60,
  cliente: {
    nombre: 'Emiliano',
    telefono: '5493794946066'
  }
};

const apiKey = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

console.log('🧪 Test 1: X-API-Key (uppercase)');
axios.post('https://web-production-934d4.up.railway.app/api/v1/reservas/pre-crear', body, {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  }
})
.then(r => console.log('✅ Success:', JSON.stringify(r.data, null, 2)))
.catch(e => {
  console.error('❌ Error:', e.response?.status, e.response?.statusText);
  console.error('   Data:', JSON.stringify(e.response?.data, null, 2));
  
  console.log('\n🧪 Test 2: x-api-key (lowercase)');
  return axios.post('https://web-production-934d4.up.railway.app/api/v1/reservas/pre-crear', body, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    }
  });
})
.then(r => {
  if (r) {
    console.log('✅ Success:', JSON.stringify(r.data, null, 2));
  }
})
.catch(e => {
  console.error('❌ Error:', e.response?.status, e.response?.statusText);
  console.error('   Data:', JSON.stringify(e.response?.data, null, 2));
  
  console.log('\n🧪 Test 3: apikey (sin guiones)');
  return axios.post('https://web-production-934d4.up.railway.app/api/v1/reservas/pre-crear', body, {
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey
    }
  });
})
.then(r => {
  if (r) {
    console.log('✅ Success:', JSON.stringify(r.data, null, 2));
  }
})
.catch(e => {
  console.error('❌ Error:', e.response?.status, e.response?.statusText);
  console.error('   Data:', JSON.stringify(e.response?.data, null, 2));
  
  console.log('\n🧪 Test 4: Authorization Bearer');
  return axios.post('https://web-production-934d4.up.railway.app/api/v1/reservas/pre-crear', body, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });
})
.then(r => {
  if (r) {
    console.log('✅ Success:', JSON.stringify(r.data, null, 2));
  }
})
.catch(e => {
  console.error('❌ Error:', e.response?.status, e.response?.statusText);
  console.error('   Data:', JSON.stringify(e.response?.data, null, 2));
  console.log('\n❌ Todos los tests fallaron');
});
