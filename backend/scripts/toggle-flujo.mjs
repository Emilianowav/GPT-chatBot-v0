import fetch from 'node-fetch';

async function toggleFlujo(flowId) {
  try {
    const apiUrl = 'http://localhost:3000';
    
    console.log(`🔄 Cambiando estado del flujo ${flowId}...\n`);
    
    // Obtener estado actual
    const getResponse = await fetch(`${apiUrl}/api/flows/by-id/${flowId}`);
    const flow = await getResponse.json();
    
    console.log(`📋 Flujo: ${flow.nombre}`);
    console.log(`📊 Estado actual: ${flow.activo ? '🟢 ACTIVO' : '⏸️ PAUSADO'}`);
    
    // Toggle estado
    const toggleResponse = await fetch(`${apiUrl}/api/flows/${flowId}/toggle`, {
      method: 'PATCH'
    });
    
    if (!toggleResponse.ok) {
      throw new Error(`HTTP error! status: ${toggleResponse.status}`);
    }
    
    const result = await toggleResponse.json();
    
    console.log(`\n✅ Estado cambiado a: ${result.activo ? '🟢 ACTIVO' : '⏸️ PAUSADO'}`);
    console.log(`💬 ${result.message}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Obtener flowId del argumento o usar el flujo v2 por defecto
const flowId = process.argv[2] || '696aef0863e98384f9248968';
toggleFlujo(flowId);
