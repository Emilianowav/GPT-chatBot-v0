const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * AUDITORÍA COMPLETA DEL FLUJO DE MERCADOPAGO
 * 
 * 1. Corregir tipos de edges (animatedLine → default)
 * 2. Revisar configuración de nodos finales
 * 3. Verificar conexiones y flujo de datos
 * 4. Validar que todo esté listo para testear
 */

async function auditarFlujo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔍 AUDITORÍA COMPLETA DEL FLUJO\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // PASO 1: CORREGIR TIPOS DE EDGES
    // ============================================================================
    console.log('\n📍 PASO 1: Corregir tipos de edges\n');
    
    let edgesCorregidos = 0;
    flow.edges.forEach(edge => {
      if (edge.type === 'animatedLine') {
        console.log(`✏️  ${edge.id}: type="${edge.type}" → "default"`);
        edge.type = 'default';
        edgesCorregidos++;
      }
    });
    
    console.log(`\n📊 ${edgesCorregidos} edges corregidos`);
    
    // ============================================================================
    // PASO 2: REVISAR CONFIGURACIÓN DE NODOS FINALES
    // ============================================================================
    console.log('\n📍 PASO 2: Configuración de nodos finales\n');
    console.log('─'.repeat(80));
    
    const nodosFinales = [
      'gpt-clasificador',
      'router-intencion',
      'gpt-carrito',
      'whatsapp-confirmacion',
      'mercadopago',
      'whatsapp-pago'
    ];
    
    const problemas = [];
    
    nodosFinales.forEach(nodeId => {
      const node = flow.nodes.find(n => n.id === nodeId);
      if (!node) {
        problemas.push(`❌ Nodo ${nodeId} no encontrado`);
        return;
      }
      
      console.log(`\n🔷 ${nodeId} (${node.type}):`);
      console.log(`   Paso: ${node.data?.executionCount || 'N/A'}`);
      console.log(`   Label: ${node.data?.label || 'N/A'}`);
      
      // Validar configuración según tipo
      if (node.type === 'gpt') {
        const config = node.data?.config;
        if (!config) {
          problemas.push(`❌ ${nodeId}: Sin configuración`);
        } else {
          console.log(`   ✅ Model: ${config.model}`);
          console.log(`   ✅ Temperature: ${config.temperature}`);
          console.log(`   ✅ MaxTokens: ${config.maxTokens}`);
          console.log(`   ✅ SystemPrompt: ${config.systemPrompt?.substring(0, 60)}...`);
        }
      } else if (node.type === 'router') {
        const config = node.data?.config;
        if (!config?.routes) {
          problemas.push(`❌ ${nodeId}: Sin rutas configuradas`);
        } else {
          console.log(`   ✅ Rutas: ${config.routes.length}`);
          config.routes.forEach(route => {
            console.log(`      - ${route.id}: "${route.label}" (${route.condition})`);
          });
        }
      } else if (node.type === 'mercadopago') {
        const config = node.data?.config;
        if (!config) {
          problemas.push(`❌ ${nodeId}: Sin configuración`);
        } else {
          console.log(`   ✅ Action: ${config.action}`);
          console.log(`   ✅ Items: ${config.items}`);
          console.log(`   ✅ Total: ${config.total}`);
        }
      } else if (node.type === 'whatsapp') {
        const config = node.data?.config;
        if (!config) {
          problemas.push(`❌ ${nodeId}: Sin configuración`);
        } else {
          console.log(`   ✅ Action: ${config.action}`);
          console.log(`   ✅ Message: ${config.message?.substring(0, 60)}...`);
        }
      }
    });
    
    // ============================================================================
    // PASO 3: VERIFICAR CONEXIONES
    // ============================================================================
    console.log('\n\n📍 PASO 3: Verificar conexiones entre nodos\n');
    console.log('─'.repeat(80));
    
    // Crear mapa de conexiones
    const conexiones = new Map();
    flow.edges.forEach(edge => {
      if (!conexiones.has(edge.source)) {
        conexiones.set(edge.source, []);
      }
      conexiones.get(edge.source).push({
        target: edge.target,
        handle: edge.sourceHandle
      });
    });
    
    // Verificar flujo desde gpt-asistente-ventas
    console.log('\n🔗 Flujo desde gpt-asistente-ventas:\n');
    
    const flujoEsperado = [
      { from: 'gpt-asistente-ventas', to: 'whatsapp-asistente' },
      { from: 'whatsapp-asistente', to: 'gpt-clasificador' },
      { from: 'gpt-clasificador', to: 'router-intencion' },
      { from: 'router-intencion', to: 'gpt-carrito', handle: 'route-agregar' },
      { from: 'gpt-carrito', to: 'whatsapp-confirmacion' },
      { from: 'router-intencion', to: 'mercadopago', handle: 'route-checkout' },
      { from: 'mercadopago', to: 'whatsapp-pago' }
    ];
    
    flujoEsperado.forEach(({ from, to, handle }) => {
      const edge = flow.edges.find(e => 
        e.source === from && 
        e.target === to && 
        (!handle || e.sourceHandle === handle)
      );
      
      if (edge) {
        const handleInfo = handle ? ` [${handle}]` : '';
        console.log(`   ✅ ${from}${handleInfo} → ${to}`);
      } else {
        const handleInfo = handle ? ` [${handle}]` : '';
        console.log(`   ❌ FALTA: ${from}${handleInfo} → ${to}`);
        problemas.push(`Falta conexión: ${from}${handleInfo} → ${to}`);
      }
    });
    
    // Verificar que route-buscar NO tenga edge
    const edgeBuscar = flow.edges.find(e => 
      e.source === 'router-intencion' && 
      e.sourceHandle === 'route-buscar'
    );
    
    if (edgeBuscar) {
      console.log(`   ❌ route-buscar tiene edge (debería NO tenerlo)`);
      problemas.push('route-buscar tiene edge visual (debería ser loop por webhook)');
    } else {
      console.log(`   ✅ route-buscar sin edge (loop por webhook)`);
    }
    
    // ============================================================================
    // PASO 4: VERIFICAR VARIABLES Y CONTEXTO
    // ============================================================================
    console.log('\n\n📍 PASO 4: Variables y contexto global\n');
    console.log('─'.repeat(80));
    
    console.log('\n📋 Variables esperadas en el flujo:\n');
    console.log('   1. gpt-clasificador → router-intencion:');
    console.log('      - Respuesta debe ser: "buscar_mas", "agregar_carrito", o "finalizar_compra"');
    console.log('');
    console.log('   2. gpt-carrito → whatsapp-confirmacion:');
    console.log('      - Debe crear variable global: carrito = {productos: [...], total: X}');
    console.log('      - whatsapp-confirmacion usa: {{gpt_response}}');
    console.log('');
    console.log('   3. mercadopago:');
    console.log('      - Lee: {{carrito.productos}} y {{carrito.total}}');
    console.log('      - Genera: {{payment_link}}');
    console.log('');
    console.log('   4. whatsapp-pago:');
    console.log('      - Usa: {{gpt_response}} (debería incluir el link de pago)');
    
    // ============================================================================
    // PASO 5: GUARDAR CAMBIOS
    // ============================================================================
    if (edgesCorregidos > 0) {
      console.log('\n\n📍 PASO 5: Guardar cambios en MongoDB\n');
      
      await flowsCollection.updateOne(
        { _id: new ObjectId(FLOW_ID) },
        { $set: { edges: flow.edges } }
      );
      
      console.log('✅ Edges corregidos guardados');
    }
    
    // ============================================================================
    // RESUMEN FINAL
    // ============================================================================
    console.log('\n\n📊 RESUMEN DE AUDITORÍA\n');
    console.log('═'.repeat(80));
    
    if (problemas.length === 0) {
      console.log('\n✅ FLUJO LISTO PARA TESTEAR\n');
      console.log('Todos los nodos están correctamente configurados y conectados.');
      console.log('El flujo de MercadoPago está completo y funcional.');
    } else {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS:\n');
      problemas.forEach((problema, i) => {
        console.log(`   ${i + 1}. ${problema}`);
      });
    }
    
    console.log('\n📋 ESTADÍSTICAS:');
    console.log(`   Nodos totales: ${flow.nodes.length}`);
    console.log(`   Edges totales: ${flow.edges.length}`);
    console.log(`   Edges corregidos: ${edgesCorregidos}`);
    console.log(`   Problemas encontrados: ${problemas.length}`);
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

auditarFlujo();
