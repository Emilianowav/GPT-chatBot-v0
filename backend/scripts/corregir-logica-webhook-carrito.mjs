import fetch from 'node-fetch';

async function corregirLogicaWebhookCarrito() {
  try {
    const flowId = '696aef0863e98384f9248968';
    const apiUrl = 'http://localhost:3000';
    
    console.log('🔧 CORRIGIENDO LÓGICA WEBHOOK → GPT → ROUTER\n');
    
    // 1. Obtener flujo actual
    console.log('1️⃣ Obteniendo flujo actual...');
    const response = await fetch(`${apiUrl}/api/flows/by-id/${flowId}`);
    const flow = await response.json();
    
    console.log(`   ✅ Flujo obtenido: ${flow.nombre}`);
    
    // 2. ELIMINAR edge incorrecto: webhook → router-carrito
    console.log('\n2️⃣ Eliminando edge incorrecto: webhook → router-carrito...');
    flow.edges = flow.edges.filter(e => e.id !== 'edge-webhook-router-carrito');
    console.log('   ✅ Edge eliminado');
    
    // 3. AGREGAR edge correcto: webhook → gpt-armar-carrito
    console.log('\n3️⃣ Agregando edge correcto: webhook → gpt-armar-carrito...');
    const edgeWebhookGPT = {
      id: 'edge-webhook-armar-carrito',
      source: 'webhook-notificacion-pago',
      target: 'gpt-armar-carrito',
      type: 'default'
    };
    flow.edges.push(edgeWebhookGPT);
    console.log('   ✅ Edge agregado');
    
    // 4. VERIFICAR que gpt-armar-carrito → router-carrito ya existe
    console.log('\n4️⃣ Verificando edge: gpt-armar-carrito → router-carrito...');
    const edgeGPTRouter = flow.edges.find(e => 
      e.source === 'gpt-armar-carrito' && e.target === 'router-carrito'
    );
    if (edgeGPTRouter) {
      console.log('   ✅ Edge ya existe:', edgeGPTRouter.id);
    } else {
      console.log('   ⚠️  Edge no existe, agregándolo...');
      flow.edges.push({
        id: 'edge-armar-router-carrito',
        source: 'gpt-armar-carrito',
        target: 'router-carrito',
        type: 'default'
      });
      console.log('   ✅ Edge agregado');
    }
    
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
    console.log('\n📋 VERIFICANDO FLUJO CORRECTO...\n');
    
    const webhookEdges = updatedFlow.edges.filter(e => e.source === 'webhook-notificacion-pago');
    console.log('Edges desde webhook-notificacion-pago:');
    webhookEdges.forEach(e => {
      const target = updatedFlow.nodes.find(n => n.id === e.target);
      console.log(`  - webhook → ${e.target} (${target?.type})`);
    });
    
    const gptCarritoEdges = updatedFlow.edges.filter(e => e.source === 'gpt-armar-carrito');
    console.log('\nEdges desde gpt-armar-carrito:');
    gptCarritoEdges.forEach(e => {
      const target = updatedFlow.nodes.find(n => n.id === e.target);
      console.log(`  - gpt-armar-carrito → ${e.target} (${target?.type})`);
    });
    
    const routerCarritoEdges = updatedFlow.edges.filter(e => e.source === 'router-carrito');
    console.log('\nEdges desde router-carrito:');
    routerCarritoEdges.forEach(e => {
      const target = updatedFlow.nodes.find(n => n.id === e.target);
      console.log(`  - ${e.sourceHandle || 'default'} → ${e.target} (${target?.type})`);
    });
    
    console.log('\n✅ LÓGICA CORREGIDA EXITOSAMENTE');
    console.log('\n📝 FLUJO CORRECTO:');
    console.log('   Webhook Notificación Pago');
    console.log('          ↓');
    console.log('   GPT Armar Carrito');
    console.log('          ↓');
    console.log('   Router Carrito');
    console.log('      ↓         ↓');
    console.log('  MercadoPago  WhatsApp Confirmación');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

corregirLogicaWebhookCarrito();
