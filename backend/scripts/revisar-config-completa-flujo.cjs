const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revisarConfigCompleta() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    const apisCollection = db.collection('apis');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 REVISIÓN COMPLETA - FLUJO WOOCOMMERCE (14 NODOS)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Flujo esperado hasta el envío del mensaje
    const flujoPrincipal = [
      'webhook-whatsapp',
      'gpt-formateador',
      'router',
      'woocommerce',
      'gpt-asistente-ventas',
      'whatsapp-asistente'
    ];
    
    flujoPrincipal.forEach((nodeId, index) => {
      const nodo = flow.nodes.find(n => n.id === nodeId);
      
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`PASO ${index + 1}: ${nodo.data.label || nodeId}`);
      console.log(`${'═'.repeat(70)}`);
      console.log(`ID: ${nodeId}`);
      console.log(`Tipo: ${nodo.type}\n`);
      
      const config = nodo.data.config || {};
      
      // CONFIGURACIÓN ESPECÍFICA POR NODO
      switch(nodeId) {
        case 'webhook-whatsapp':
          console.log('📥 CONFIGURACIÓN:');
          console.log(`   Webhook Type: ${config.webhookType || 'whatsapp'}`);
          console.log('\n   📋 Mapeo de variables:');
          if (config.mapping) {
            Object.entries(config.mapping).forEach(([key, value]) => {
              console.log(`      ${key} ← ${value}`);
            });
          } else {
            console.log('      ⚠️  No hay mapeo configurado');
          }
          
          console.log('\n✅ VALIDACIÓN:');
          console.log('   ✓ Punto de entrada del flujo');
          console.log('   ✓ Debe mapear mensaje del usuario a variable global');
          break;
          
        case 'gpt-formateador':
          console.log('🤖 CONFIGURACIÓN GPT:');
          console.log(`   Tipo: ${config.tipo}`);
          console.log(`   Modelo: ${config.modelo}`);
          
          console.log('\n   📋 EXTRACTION CONFIG:');
          console.log(`      Enabled: ${config.extractionConfig?.enabled}`);
          console.log(`      Method: ${config.extractionConfig?.method}`);
          console.log(`      Context Source: ${config.extractionConfig?.contextSource}`);
          
          console.log('\n   📝 VARIABLES A EXTRAER:');
          if (config.extractionConfig?.variables) {
            config.extractionConfig.variables.forEach((v, i) => {
              const status = v.requerido ? '🔴 REQUERIDO' : '⚪ OPCIONAL';
              console.log(`      ${i + 1}. ${v.nombre} (${v.tipo}) - ${status}`);
              console.log(`         Descripción: "${v.descripcion}"`);
            });
          }
          
          console.log('\n   💬 SYSTEM PROMPT (primeros 300 chars):');
          const prompt = config.extractionConfig?.systemPrompt || 'NO CONFIGURADO ❌';
          console.log(`      ${prompt.substring(0, 300)}...`);
          
          console.log('\n✅ VALIDACIÓN:');
          console.log(`   ${config.extractionConfig?.enabled ? '✓' : '✗'} extractionConfig.enabled`);
          console.log(`   ${config.extractionConfig?.variables?.length > 0 ? '✓' : '✗'} Variables configuradas`);
          console.log(`   ${config.extractionConfig?.systemPrompt ? '✓' : '✗'} System prompt configurado`);
          break;
          
        case 'router':
          console.log('🔀 CONFIGURACIÓN ROUTER:');
          
          const routerEdges = flow.edges.filter(e => e.source === nodeId);
          console.log(`   Rutas: ${routerEdges.length}\n`);
          
          routerEdges.forEach((edge, i) => {
            console.log(`   RUTA ${i + 1}: ${edge.data?.label || edge.id}`);
            console.log(`      Target: ${edge.target}`);
            console.log(`      Condición: ${edge.data?.condition || 'SIN CONDICIÓN ❌'}`);
            console.log('');
          });
          
          console.log('✅ VALIDACIÓN:');
          const route1 = routerEdges.find(e => e.target === 'gpt-pedir-datos');
          const route2 = routerEdges.find(e => e.target === 'woocommerce');
          console.log(`   ${route1?.data?.condition ? '✓' : '✗'} Ruta 1 (pedir datos) tiene condición`);
          console.log(`   ${route2?.data?.condition ? '✓' : '✗'} Ruta 2 (woocommerce) tiene condición`);
          break;
          
        case 'woocommerce':
          console.log('🛍️  CONFIGURACIÓN WOOCOMMERCE:');
          console.log(`   API Config ID: ${config.apiConfigId || 'NO CONFIGURADO ❌'}`);
          console.log(`   Módulo: ${config.module}`);
          
          console.log('\n   📦 Parámetros:');
          if (config.params) {
            Object.entries(config.params).forEach(([key, value]) => {
              console.log(`      ${key}: ${value}`);
            });
          }
          
          console.log('\n✅ VALIDACIÓN:');
          console.log(`   ${config.apiConfigId ? '✓' : '✗'} API Config ID configurado`);
          console.log(`   ${config.module ? '✓' : '✗'} Módulo configurado`);
          console.log(`   ${config.params?.search ? '✓' : '✗'} Parámetro de búsqueda configurado`);
          break;
          
        case 'gpt-asistente-ventas':
          console.log('🤖 CONFIGURACIÓN GPT:');
          console.log(`   Tipo: ${config.tipo}`);
          console.log(`   Modelo: ${config.modelo}`);
          
          console.log('\n   💬 SYSTEM PROMPT (primeros 400 chars):');
          const promptAsistente = config.systemPrompt || 'NO CONFIGURADO ❌';
          console.log(`      ${promptAsistente.substring(0, 400)}...`);
          
          console.log('\n✅ VALIDACIÓN:');
          console.log(`   ${config.tipo === 'conversacional' ? '✓' : '✗'} Tipo conversacional`);
          console.log(`   ${config.systemPrompt ? '✓' : '✗'} System prompt configurado`);
          console.log(`   ${config.systemPrompt?.includes('{{woocommerce.productos}}') ? '✓' : '✗'} Usa variable woocommerce.productos`);
          break;
          
        case 'whatsapp-asistente':
          console.log('📱 CONFIGURACIÓN WHATSAPP:');
          console.log(`   Acción: ${config.action}`);
          console.log(`   Mensaje: ${config.message || config.mensaje}`);
          
          console.log('\n✅ VALIDACIÓN:');
          console.log(`   ${config.action === 'send_message' ? '✓' : '✗'} Acción send_message`);
          console.log(`   ${config.message?.includes('{{gpt-asistente-ventas.respuesta_gpt}}') ? '✓' : '✗'} Usa respuesta del GPT asistente`);
          break;
      }
      
      // Mostrar edges de salida
      const outgoingEdges = flow.edges.filter(e => e.source === nodeId);
      if (outgoingEdges.length > 0) {
        console.log('\n📤 CONEXIONES DE SALIDA:');
        outgoingEdges.forEach(edge => {
          const targetNode = flow.nodes.find(n => n.id === edge.target);
          console.log(`   → ${targetNode?.data?.label || edge.target}`);
          if (edge.data?.condition) {
            console.log(`      Condición: ${edge.data.condition}`);
          }
        });
      } else {
        console.log('\n⚠️  SIN CONEXIONES DE SALIDA - Fin del flujo');
      }
    });
    
    // VERIFICAR API DE WOOCOMMERCE
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICACIÓN DE API WOOCOMMERCE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const wooNode = flow.nodes.find(n => n.id === 'woocommerce');
    const apiId = wooNode?.data?.config?.apiConfigId;
    
    if (apiId) {
      const api = await apisCollection.findOne({ _id: new ObjectId(apiId) });
      
      if (api) {
        console.log('✅ API encontrada:');
        console.log(`   Nombre: ${api.nombre}`);
        console.log(`   Base URL: ${api.baseUrl}`);
        console.log(`   Activo: ${api.activo}`);
        console.log(`   Autenticación: ${api.autenticacion?.tipo}`);
        console.log(`   Endpoints: ${api.endpoints?.length || 0}`);
        
        if (api.endpoints && api.endpoints.length > 0) {
          console.log('\n   📡 Endpoints disponibles:');
          api.endpoints.forEach((ep, i) => {
            console.log(`      ${i + 1}. ${ep.nombre} (${ep.id})`);
            console.log(`         ${ep.method} ${ep.path}`);
          });
        }
      } else {
        console.log('❌ API NO encontrada en la BD');
      }
    } else {
      console.log('❌ Nodo WooCommerce no tiene apiConfigId configurado');
    }
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN DE VALIDACIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const checks = [
      { name: 'Webhook configurado', ok: flow.nodes.find(n => n.id === 'webhook-whatsapp') },
      { name: 'Formateador con extractionConfig', ok: flow.nodes.find(n => n.id === 'gpt-formateador')?.data?.config?.extractionConfig?.enabled },
      { name: 'Router con condiciones', ok: flow.edges.find(e => e.source === 'router' && e.data?.condition) },
      { name: 'WooCommerce con API', ok: wooNode?.data?.config?.apiConfigId },
      { name: 'GPT asistente usa productos', ok: flow.nodes.find(n => n.id === 'gpt-asistente-ventas')?.data?.config?.systemPrompt?.includes('{{woocommerce.productos}}') },
      { name: 'WhatsApp envía respuesta GPT', ok: flow.nodes.find(n => n.id === 'whatsapp-asistente')?.data?.config?.message?.includes('{{gpt-asistente-ventas.respuesta_gpt}}') },
      { name: 'Flujo se detiene después de WhatsApp', ok: flow.edges.filter(e => e.source === 'whatsapp-asistente').length === 0 }
    ];
    
    checks.forEach(check => {
      console.log(`   ${check.ok ? '✅' : '❌'} ${check.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
  }
}

revisarConfigCompleta();
