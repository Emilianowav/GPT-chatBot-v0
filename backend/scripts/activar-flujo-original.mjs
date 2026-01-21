import fetch from 'node-fetch';

async function activarFlujoOriginal() {
  try {
    const flowId = '695a156681f6d67f0ae9cf40'; // Flujo original
    const apiUrl = 'http://localhost:3000';
    
    console.log('🔍 VERIFICANDO FLUJO ORIGINAL\n');
    
    // Intentar obtener el flujo original
    const response = await fetch(`${apiUrl}/api/flows/by-id/${flowId}`);
    
    if (response.ok) {
      const flow = await response.json();
      console.log(`✅ Flujo encontrado: ${flow.nombre}`);
      console.log(`   Estado: ${flow.activo ? '🟢 ACTIVO' : '⏸️ PAUSADO'}`);
      
      // Si está inactivo, activarlo
      if (!flow.activo) {
        console.log('\n📝 Activando flujo...');
        const toggleResponse = await fetch(`${apiUrl}/api/flows/${flowId}/toggle`, {
          method: 'PATCH'
        });
        
        if (toggleResponse.ok) {
          const result = await toggleResponse.json();
          console.log(`✅ Flujo activado: ${result.activo ? '🟢 ACTIVO' : '⏸️ PAUSADO'}`);
        }
      } else {
        console.log('\n✅ El flujo ya está activo');
      }
    } else {
      console.log('❌ Flujo original no encontrado en la base de datos');
      console.log('   Esto es normal si solo creaste el flujo v2');
      console.log('\n💡 Solución: Usa el flujo v2 para testear');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

activarFlujoOriginal();
