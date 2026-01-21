import fetch from 'node-fetch';

async function fixFlujoOriginal() {
  try {
    const apiUrl = 'http://localhost:3000';
    const flujoOriginalId = '695a156681f6d67f0ae9cf40';
    
    console.log('🔧 CORRIGIENDO FLUJO ORIGINAL\n');
    
    // Obtener flujo completo
    const response = await fetch(`${apiUrl}/api/flows/by-id/${flujoOriginalId}`);
    const flow = await response.json();
    
    console.log(`Flujo: ${flow.nombre}`);
    console.log(`empresaId actual: ${flow.empresaId}`);
    console.log(`id actual: ${flow.id}`);
    
    // Preparar datos de actualización
    const updateData = {
      nombre: flow.nombre,
      empresaId: 'Veo Veo',
      activo: flow.activo,
      nodes: flow.nodes,
      edges: flow.edges,
      config: flow.config || {},
      descripcion: flow.descripcion || 'Flujo original de WooCommerce'
    };
    
    // NO incluir el campo 'id' para evitar conflicto de índice
    
    console.log('\nActualizando flujo...');
    
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
    console.log(`   empresaId: ${updated.empresaId}`);
    
    // Verificar que ambos flujos aparezcan
    console.log('\n📋 Verificando flujos con empresaId "Veo Veo":');
    const verifyResponse = await fetch(`${apiUrl}/api/flows?empresaId=Veo Veo`);
    const data = await verifyResponse.json();
    const flows = Array.isArray(data) ? data : (data.flows || []);
    
    console.log(`\n✅ Total de flujos encontrados: ${flows.length}\n`);
    flows.forEach((f, i) => {
      console.log(`${i + 1}. ${f.nombre}`);
      console.log(`   ID: ${f._id}`);
      console.log(`   Estado: ${f.activo ? '🟢 ACTIVO' : '⏸️ PAUSADO'}`);
      console.log('');
    });
    
    console.log('💡 Ahora ambos flujos aparecerán en el frontend');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixFlujoOriginal();
