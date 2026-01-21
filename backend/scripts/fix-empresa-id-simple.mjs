import fetch from 'node-fetch';

async function fixEmpresaId() {
  try {
    const apiUrl = 'http://localhost:3000';
    const flujoOriginalId = '695a156681f6d67f0ae9cf40';
    
    console.log('🔧 ACTUALIZANDO EMPRESA ID DEL FLUJO ORIGINAL\n');
    
    // Obtener flujo completo
    const response = await fetch(`${apiUrl}/api/flows/by-id/${flujoOriginalId}`);
    const flow = await response.json();
    
    console.log(`Flujo: ${flow.nombre}`);
    console.log(`empresaId actual: ${flow.empresaId}`);
    
    // Actualizar solo empresaId manteniendo todo lo demás igual
    const updateData = {
      ...flow,
      empresaId: 'Veo Veo',
      updatedAt: new Date()
    };
    
    // Remover campos que MongoDB agrega automáticamente
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    
    console.log('\nActualizando...');
    
    const updateResponse = await fetch(`${apiUrl}/api/flows/${flujoOriginalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${updateResponse.status}`);
    }
    
    console.log('✅ Actualizado exitosamente');
    
    // Verificar
    const verifyResponse = await fetch(`${apiUrl}/api/flows?empresaId=Veo Veo`);
    const data = await verifyResponse.json();
    const flows = Array.isArray(data) ? data : (data.flows || []);
    
    console.log(`\n✅ Flujos encontrados: ${flows.length}`);
    flows.forEach(f => console.log(`   - ${f.nombre}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixEmpresaId();
