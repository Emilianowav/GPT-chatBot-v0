import fetch from 'node-fetch';

async function verFlujoCompleto() {
  try {
    const response = await fetch('http://localhost:3000/api/flows/by-id/696aef0863e98384f9248968');
    const flow = await response.json();
    
    console.log('📋 FLUJO:', flow.nombre);
    console.log('\n=== NODOS ===\n');
    
    flow.nodes.forEach(node => {
      console.log(`${node.id}`);
      console.log(`  Tipo: ${node.type}`);
      console.log(`  Label: ${node.data.label}`);
      if (node.type === 'router') {
        console.log(`  Rutas: ${node.data.handles?.length || 0}`);
      }
    });
    
    console.log('\n=== CONEXIONES ===\n');
    
    flow.edges.forEach(edge => {
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      
      console.log(`${sourceNode?.data.label || edge.source}`);
      console.log(`  → (${edge.sourceHandle || 'default'})`);
      console.log(`  → ${targetNode?.data.label || edge.target}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verFlujoCompleto();
