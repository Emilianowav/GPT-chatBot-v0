import fetch from 'node-fetch';

async function agregarWebhookConfirmacion() {
  try {
    const flowId = '696aef0863e98384f9248968';
    const apiUrl = 'http://localhost:3000';
    
    console.log('🔧 AGREGANDO WEBHOOK Y CONFIRMACIÓN AL FLUJO V2\n');
    
    // 1. Obtener flujo actual
    console.log('1️⃣ Obteniendo flujo actual...');
    const response = await fetch(`${apiUrl}/api/flows/by-id/${flowId}`);
    const flow = await response.json();
    
    console.log(`   ✅ Flujo obtenido: ${flow.nombre}`);
    
    // 2. AGREGAR nodo webhook-notificacion-pago
    console.log('\n2️⃣ Agregando nodo Webhook Notificación Pago...');
    const webhookNode = {
      id: 'webhook-notificacion-pago',
      type: 'webhook',
      position: { x: 1100, y: 350 },
      data: {
        label: 'Webhook Notificación Pago',
        subtitle: 'Watch Events',
        config: {
          module: 'watch-events',
          webhookUrl: '/webhook/mercadopago-notification'
        },
        hasConnection: true
      }
    };
    flow.nodes.push(webhookNode);
    console.log('   ✅ Nodo webhook agregado');
    
    // 3. AGREGAR nodo whatsapp-confirmacion-compra
    console.log('\n3️⃣ Agregando nodo WhatsApp Confirmación Compra...');
    const whatsappConfirmacionNode = {
      id: 'whatsapp-confirmacion-compra',
      type: 'whatsapp',
      position: { x: 1300, y: 350 },
      data: {
        label: 'WhatsApp Confirmación Compra',
        subtitle: 'Send a Message',
        config: {
          module: 'send-message',
          message: '✅ ¡Pago confirmado!\n\nGracias por tu compra {{cliente.nombre}}.\n\nDetalles:\n{{pedido.detalle}}\n\nTotal: ${{pedido.total}}\n\n📦 Tu pedido será procesado en breve.',
          to: '{{1.from}}'
        },
        hasConnection: false
      }
    };
    flow.nodes.push(whatsappConfirmacionNode);
    console.log('   ✅ Nodo WhatsApp confirmación agregado');
    
    // 4. AGREGAR edge: webhook → router-carrito
    console.log('\n4️⃣ Agregando edge: webhook → router-carrito...');
    const edgeWebhookRouter = {
      id: 'edge-webhook-router-carrito',
      source: 'webhook-notificacion-pago',
      target: 'router-carrito',
      type: 'default'
    };
    flow.edges.push(edgeWebhookRouter);
    console.log('   ✅ Edge agregado');
    
    // 5. AGREGAR edge: router-carrito → whatsapp-confirmacion
    console.log('\n5️⃣ Agregando edge: router-carrito → whatsapp-confirmacion...');
    
    // Primero, actualizar routeHandles del router-carrito
    const routerCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    if (routerCarrito) {
      if (!routerCarrito.data.routeHandles) {
        routerCarrito.data.routeHandles = [];
      }
      // Agregar nuevo handle para confirmación
      if (!routerCarrito.data.routeHandles.includes('route-confirmacion')) {
        routerCarrito.data.routeHandles.push('route-confirmacion');
      }
      
      // Actualizar config.routes
      if (!routerCarrito.data.config.routes) {
        routerCarrito.data.config.routes = [];
      }
      routerCarrito.data.config.routes.push({
        id: 'route-confirmacion',
        condition: 'equals',
        value: 'approved',
        label: '✅ Pago Aprobado'
      });
    }
    
    const edgeRouterWhatsapp = {
      id: 'edge-router-confirmacion',
      source: 'router-carrito',
      target: 'whatsapp-confirmacion-compra',
      sourceHandle: 'route-confirmacion',
      type: 'default'
    };
    flow.edges.push(edgeRouterWhatsapp);
    console.log('   ✅ Edge agregado');
    
    // 6. GUARDAR cambios
    console.log('\n6️⃣ Guardando cambios...');
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
    
    // 7. VERIFICAR resultado
    console.log('\n📋 VERIFICANDO CAMBIOS...\n');
    
    const routerCarritoEdges = updatedFlow.edges.filter(e => e.source === 'router-carrito');
    console.log('Edges desde router-carrito:');
    routerCarritoEdges.forEach(e => {
      const target = updatedFlow.nodes.find(n => n.id === e.target);
      console.log(`  - ${e.sourceHandle || 'default'} → ${e.target} (${target?.type})`);
    });
    
    const webhookEdges = updatedFlow.edges.filter(e => e.source === 'webhook-notificacion-pago');
    console.log('\nEdges desde webhook-notificacion-pago:');
    webhookEdges.forEach(e => {
      const target = updatedFlow.nodes.find(n => n.id === e.target);
      console.log(`  - ${e.source} → ${e.target} (${target?.type})`);
    });
    
    console.log('\n✅ WEBHOOK Y CONFIRMACIÓN AGREGADOS EXITOSAMENTE');
    console.log('\n📝 RESUMEN:');
    console.log('   ✅ Agregado: Webhook Notificación Pago');
    console.log('   ✅ Agregado: WhatsApp Confirmación Compra');
    console.log('   ✅ Conexión: webhook → router-carrito');
    console.log('   ✅ Conexión: router-carrito (route-confirmacion) → whatsapp-confirmacion');
    console.log('\n💡 Ahora el flujo maneja la confirmación de pago de MercadoPago');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

agregarWebhookConfirmacion();
