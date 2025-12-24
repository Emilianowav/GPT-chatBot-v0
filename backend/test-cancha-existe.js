import axios from 'axios';

const apiKey = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';
const baseURL = 'https://web-production-934d4.up.railway.app/api/v1';

console.log('🔍 Verificando si la cancha existe en la API...\n');

// 1. Obtener disponibilidad para ver si la cancha aparece
console.log('📅 Test 1: Consultar disponibilidad para hoy');
axios.get(`${baseURL}/disponibilidad`, {
  params: {
    fecha: '2025-12-24',
    deporte: 'paddle'
  },
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
})
.then(r => {
  console.log('✅ Disponibilidad obtenida');
  const canchas = r.data?.data?.disponibilidad || [];
  console.log(`   Total de canchas disponibles: ${canchas.length}`);
  
  const canchaTarget = 'c7cd4b5c-0ebb-4d51-a06e-4c1923d395fc';
  const canchaEncontrada = canchas.find(c => c.id === canchaTarget);
  
  if (canchaEncontrada) {
    console.log(`   ✅ Cancha ${canchaTarget} ENCONTRADA:`);
    console.log(`      Nombre: ${canchaEncontrada.nombre}`);
    console.log(`      Tipo: ${canchaEncontrada.tipo}`);
    console.log(`      Horarios disponibles: ${canchaEncontrada.horarios?.length || 0}`);
  } else {
    console.log(`   ❌ Cancha ${canchaTarget} NO ENCONTRADA en disponibilidad`);
    console.log('   Canchas disponibles:');
    canchas.slice(0, 3).forEach(c => {
      console.log(`      - ${c.id} (${c.nombre})`);
    });
  }
  
  // 2. Intentar crear reserva con datos mínimos
  console.log('\n📝 Test 2: Intentar crear reserva con datos exactos del dashboard');
  return axios.post(`${baseURL}/reservas/pre-crear`, {
    cancha_id: 'c7cd4b5c-0ebb-4d51-a06e-4c1923d395fc',
    fecha: '2025-12-24',
    hora_inicio: '15:00',
    duracion: 60,
    cliente: {
      nombre: 'Emiliano',
      telefono: '5493794946066'
    }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });
})
.then(r => {
  console.log('✅ Reserva creada exitosamente!');
  console.log(JSON.stringify(r.data, null, 2));
})
.catch(e => {
  console.error('❌ Error al crear reserva:');
  console.error('   Status:', e.response?.status);
  console.error('   Error:', JSON.stringify(e.response?.data, null, 2));
  
  if (e.response?.status === 500) {
    console.log('\n💡 El error 500 indica un problema en el servidor de Mis Canchas.');
    console.log('   Posibles causas:');
    console.log('   - La cancha_id no existe en la BD');
    console.log('   - Validación de fecha/hora fallando');
    console.log('   - Conflicto con reserva existente');
    console.log('   - Error en el código del backend de Mis Canchas');
    console.log('\n   Necesitás revisar los logs de Railway de la API de Mis Canchas para ver el error exacto.');
  }
});
