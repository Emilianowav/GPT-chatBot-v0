import fetch from 'node-fetch';

async function listarTodosFlujos() {
  try {
    const apiUrl = 'http://localhost:3000';
    
    console.log('📋 LISTANDO TODOS LOS FLUJOS\n');
    
    // Obtener todos los flujos sin filtro
    const response = await fetch(`${apiUrl}/api/flows?empresaId=Veo Veo`);
    const data = await response.json();
    const flows = Array.isArray(data) ? data : (data.flows || []);
    
    console.log(`Total de flujos encontrados: ${flows.length}\n`);
    
    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Estado: ${flow.activo ? '🟢 ACTIVO' : '⏸️ PAUSADO'}`);
      console.log(`   Descripción: ${flow.descripcion || 'Sin descripción'}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   Edges: ${flow.edges?.length || 0}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listarTodosFlujos();
