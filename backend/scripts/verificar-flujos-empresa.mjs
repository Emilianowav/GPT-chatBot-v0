import fetch from 'node-fetch';

async function verificarFlujosEmpresa() {
  try {
    const apiUrl = 'http://localhost:3000';
    
    console.log('🔍 VERIFICANDO FLUJOS POR EMPRESA\n');
    
    // Probar diferentes variaciones del empresaId
    const empresaIds = ['Veo Veo', '6940a9a181b92bfce970fdb5', 'veo veo'];
    
    for (const empresaId of empresaIds) {
      console.log(`\n📋 Buscando con empresaId: "${empresaId}"`);
      const response = await fetch(`${apiUrl}/api/flows?empresaId=${encodeURIComponent(empresaId)}`);
      const data = await response.json();
      const flows = Array.isArray(data) ? data : (data.flows || []);
      
      console.log(`   Flujos encontrados: ${flows.length}`);
      flows.forEach(flow => {
        console.log(`   - ${flow.nombre} (${flow._id}) - ${flow.activo ? '🟢' : '⏸️'}`);
        console.log(`     empresaId: ${flow.empresaId}`);
      });
    }
    
    // También buscar TODOS los flujos sin filtro
    console.log('\n\n📋 TODOS LOS FLUJOS (sin filtro):');
    const allResponse = await fetch(`${apiUrl}/api/flows`);
    const allData = await allResponse.json();
    const allFlows = Array.isArray(allData) ? allData : (allData.flows || []);
    
    console.log(`   Total: ${allFlows.length} flujos`);
    allFlows.forEach(flow => {
      console.log(`   - ${flow.nombre}`);
      console.log(`     ID: ${flow._id}`);
      console.log(`     empresaId: ${flow.empresaId}`);
      console.log(`     activo: ${flow.activo ? '🟢' : '⏸️'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verificarFlujosEmpresa();
