import fetch from 'node-fetch';

async function renombrarFlujoOriginal() {
  try {
    const apiUrl = 'http://localhost:3000';
    const flujoOriginalId = '695a156681f6d67f0ae9cf40';
    
    console.log('🔧 RENOMBRANDO Y ACTUALIZANDO FLUJO ORIGINAL\n');
    
    // Obtener flujo completo
    const response = await fetch(`${apiUrl}/api/flows/by-id/${flujoOriginalId}`);
    const flow = await response.json();
    
    console.log(`Flujo actual: ${flow.nombre}`);
    console.log(`empresaId actual: ${flow.empresaId}`);
    
    // Cambiar nombre para diferenciarlo
    const updateData = {
      nombre: 'Veo Veo - Librería Original',
      empresaId: 'Veo Veo',
      activo: flow.activo,
      nodes: flow.nodes || [],
      edges: flow.edges || [],
      config: flow.config || {},
      descripcion: 'Flujo original de atención al cliente y gestión de productos'
    };
    
    console.log(`\nNuevo nombre: ${updateData.nombre}`);
    console.log('Actualizando...');
    
    const updateResponse = await fetch(`${apiUrl}/api/flows/${flujoOriginalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Error:', errorText);
      throw new Error(`HTTP error! status: ${updateResponse.status}`);
    }
    
    const updated = await updateResponse.json();
    console.log('✅ Flujo actualizado exitosamente');
    
    // Verificar
    console.log('\n📋 Verificando flujos:');
    const verifyResponse = await fetch(`${apiUrl}/api/flows?empresaId=Veo Veo`);
    const data = await verifyResponse.json();
    const flows = Array.isArray(data) ? data : (data.flows || []);
    
    console.log(`\n✅ Total: ${flows.length} flujos\n`);
    flows.forEach((f, i) => {
      console.log(`${i + 1}. ${f.nombre}`);
      console.log(`   Estado: ${f.activo ? '🟢 ACTIVO' : '⏸️ PAUSADO'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

renombrarFlujoOriginal();
