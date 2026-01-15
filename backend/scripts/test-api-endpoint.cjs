const fetch = require('node-fetch');

async function testEndpoint() {
  try {
    const flowId = '695a156681f6d67f0ae9cf40';
    const url = `http://localhost:3000/api/flows/detail/${flowId}`;
    
    console.log('🔍 Testeando endpoint:', url);
    console.log('');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 RESPUESTA DEL API:');
    console.log('   Status:', response.status);
    console.log('   Nombre:', data.nombre);
    console.log('   Nodos:', data.nodes?.length);
    console.log('   Edges:', data.edges?.length);
    console.log('');
    console.log('📋 IDs de nodos:');
    data.nodes?.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.id} (${n.type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEndpoint();
