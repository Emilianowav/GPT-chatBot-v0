import fetch from 'node-fetch';

async function corregirFlujoV2() {
  try {
    const flowId = '696aef0863e98384f9248968';
    const apiUrl = 'http://localhost:3000';
    
    console.log('🔧 CORRIGIENDO FLUJO VEO VEO V2\n');
    
    // 1. Obtener flujo actual
    console.log('1️⃣ Obteniendo flujo actual...');
    const response = await fetch(`${apiUrl}/api/flows/by-id/${flowId}`);
    const flow = await response.json();
    
    console.log(`   ✅ Flujo obtenido: ${flow.nombre}`);
    console.log(`   📊 Nodos: ${flow.nodes.length}, Edges: ${flow.edges.length}`);
    
    // 2. ELIMINAR edges incorrectos
    console.log('\n2️⃣ Eliminando edges incorrectos...');
    const edgesToRemove = ['edge-router-solicitar', 'edge-solicitar-woocommerce'];
    flow.edges = flow.edges.filter(e => !edgesToRemove.includes(e.id));
    console.log(`   ✅ Eliminados: ${edgesToRemove.join(', ')}`);
    
    // 3. ELIMINAR nodo whatsapp-solicitar-datos
    console.log('\n3️⃣ Eliminando nodo whatsapp-solicitar-datos...');
    flow.nodes = flow.nodes.filter(n => n.id !== 'whatsapp-solicitar-datos');
    console.log('   ✅ Nodo eliminado');
    
    // 4. AGREGAR edge correcto: router → woocommerce
    console.log('\n4️⃣ Agregando edge correcto: router → woocommerce...');
    const newEdge = {
      id: 'edge-router-woocommerce',
      source: 'router',
      target: 'woocommerce',
      sourceHandle: 'route-2',
      type: 'default'
    };
    flow.edges.push(newEdge);
    console.log('   ✅ Edge agregado');
    
    // 5. GUARDAR cambios
    console.log('\n5️⃣ Guardando cambios...');
    const updateResponse = await fetch(`${apiUrl}/api/flows/${flowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: flow.nombre,
        empresaId: flow.empresaId,
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
    console.log('   ✅ Flujo actualizado');
    
    // 6. VERIFICAR resultado
    console.log('\n📋 VERIFICANDO CAMBIOS...\n');
    
    const routerEdges = updatedFlow.edges.filter(e => e.source === 'router');
    console.log('Edges desde router:');
    routerEdges.forEach(e => {
      const target = updatedFlow.nodes.find(n => n.id === e.target);
      console.log(`  - ${e.sourceHandle || 'default'} → ${e.target} (${target?.type})`);
    });
    
    const wooEdges = updatedFlow.edges.filter(e => e.target === 'woocommerce');
    console.log('\nEdges hacia woocommerce:');
    wooEdges.forEach(e => {
      const source = updatedFlow.nodes.find(n => n.id === e.source);
      console.log(`  - ${e.source} (${source?.type}) → woocommerce`);
    });
    
    console.log('\n✅ FLUJO CORREGIDO EXITOSAMENTE');
    console.log('\n📝 RESUMEN:');
    console.log('   ❌ Eliminado: router → whatsapp-solicitar-datos → woocommerce');
    console.log('   ✅ Agregado: router (route-2) → woocommerce');
    console.log('\n💡 Ahora el formateador envía el JSON directamente a WooCommerce');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

corregirFlujoV2();
