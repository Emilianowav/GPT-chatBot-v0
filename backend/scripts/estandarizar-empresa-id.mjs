import fetch from 'node-fetch';

async function estandarizarEmpresaId() {
  try {
    const apiUrl = 'http://localhost:3000';
    const flujoOriginalId = '695a156681f6d67f0ae9cf40';
    
    console.log('🔧 ESTANDARIZANDO EMPRESA ID\n');
    
    // Obtener flujo original
    console.log('1️⃣ Obteniendo flujo original...');
    const response = await fetch(`${apiUrl}/api/flows/by-id/${flujoOriginalId}`);
    const flow = await response.json();
    
    console.log(`   ✅ Flujo: ${flow.nombre}`);
    console.log(`   📊 empresaId actual: ${flow.empresaId}`);
    
    // Actualizar empresaId a "Veo Veo"
    console.log('\n2️⃣ Actualizando empresaId a "Veo Veo"...');
    flow.empresaId = 'Veo Veo';
    
    const updateResponse = await fetch(`${apiUrl}/api/flows/${flujoOriginalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: flow.nombre,
        empresaId: 'Veo Veo',
        activo: flow.activo,
        nodes: flow.nodes,
        edges: flow.edges,
        config: flow.config
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`HTTP error! status: ${updateResponse.status}`);
    }
    
    const updatedFlow = await updateResponse.json();
    console.log('   ✅ empresaId actualizado');
    
    // Verificar
    console.log('\n3️⃣ Verificando cambios...');
    const verifyResponse = await fetch(`${apiUrl}/api/flows?empresaId=Veo Veo`);
    const data = await verifyResponse.json();
    const flows = Array.isArray(data) ? data : (data.flows || []);
    
    console.log(`\n✅ Flujos con empresaId "Veo Veo": ${flows.length}`);
    flows.forEach(f => {
      console.log(`   - ${f.nombre} (${f._id})`);
    });
    
    console.log('\n💡 Ahora ambos flujos aparecerán en el frontend');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

estandarizarEmpresaId();
