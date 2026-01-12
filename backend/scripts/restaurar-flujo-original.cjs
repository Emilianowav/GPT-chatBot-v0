const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * RESTAURAR FLUJO ORIGINAL + CORREGIR SOLO LAS CONEXIONES
 * 
 * OBJETIVO: Mantener TODOS los nodos originales, solo arreglar las conexiones
 * para que cada nodo normal tenga máximo 1 entrada y 1 salida.
 * 
 * PROBLEMA IDENTIFICADO:
 * - gpt-asistente-ventas tenía 4 entradas (loops desde routers)
 * 
 * SOLUCIÓN:
 * - Los routers con "loops" (buscar_mas, seguir_comprando) NO deben tener edges visuales
 * - Esos casos se manejan a nivel de lógica de negocio (el backend reinicia la conversación)
 * - Solo mantener edges para los caminos que avanzan hacia adelante
 */

async function restaurarFlujoOriginal() {
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
    
    console.log('\n🔄 RESTAURANDO FLUJO ORIGINAL + CORRIGIENDO CONEXIONES\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // PASO 1: RESTAURAR NODOS ELIMINADOS
    // ============================================================================
    console.log('\n📍 PASO 1: Restaurar nodos eliminados\n');
    
    const nodosExistentes = flow.nodes.map(n => n.id);
    const nodosARestaurar = [];
    
    // Restaurar router-inicial (renombrado de 'router')
    if (!nodosExistentes.includes('router')) {
      nodosARestaurar.push({
        id: 'router',
        type: 'router',
        position: { x: 850, y: 200 },
        data: {
          label: 'Router',
          subtitle: 'Búsqueda Inicial',
          config: {
            routes: [
              { id: 'route-1', label: 'Pedir Datos', condition: 'necesita_datos' },
              { id: 'route-2', label: 'Buscar Directo', condition: 'buscar_directo' }
            ]
          }
        }
      });
      console.log('✅ Restaurando: router');
    }
    
    // Restaurar gpt-pedir-datos
    if (!nodosExistentes.includes('gpt-pedir-datos')) {
      nodosARestaurar.push({
        id: 'gpt-pedir-datos',
        type: 'gpt',
        position: { x: 1100, y: 50 },
        data: {
          label: 'OpenAI (ChatGPT, Sera...',
          subtitle: 'conversacional',
          config: {
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 500,
            systemPrompt: 'Eres un asistente de Veo Veo Libros. Ayudas a los clientes a encontrar libros.',
            topicHandling: 'none'
          }
        }
      });
      console.log('✅ Restaurando: gpt-pedir-datos');
    }
    
    // Restaurar whatsapp-preguntar
    if (!nodosExistentes.includes('whatsapp-preguntar')) {
      nodosARestaurar.push({
        id: 'whatsapp-preguntar',
        type: 'whatsapp',
        position: { x: 1350, y: 50 },
        data: {
          label: 'WhatsApp Business Clo...',
          subtitle: 'Send a Message',
          config: {
            action: 'send_message',
            message: '{{gpt_response}}'
          }
        }
      });
      console.log('✅ Restaurando: whatsapp-preguntar');
    }
    
    flow.nodes.push(...nodosARestaurar);
    console.log(`\n✅ ${nodosARestaurar.length} nodos restaurados`);
    
    // ============================================================================
    // PASO 2: DEFINIR EDGES CORRECTOS (SIN LOOPS VISUALES)
    // ============================================================================
    console.log('\n📍 PASO 2: Definir edges correctos\n');
    
    const edgesCorrectos = [
      // FASE 1: Conversación Inicial
      { id: 'edge-1', source: 'webhook-whatsapp', target: 'gpt-conversacional' },
      { id: 'edge-2', source: 'gpt-conversacional', target: 'gpt-formateador' },
      { id: 'edge-3', source: 'gpt-formateador', target: 'router' },
      
      // FASE 2: Búsqueda (2 caminos)
      { id: 'router-route-1-gpt-pedir-datos', source: 'router', sourceHandle: 'route-1', target: 'gpt-pedir-datos' },
      { id: 'edge-4', source: 'gpt-pedir-datos', target: 'whatsapp-preguntar' },
      { id: 'edge-5', source: 'whatsapp-preguntar', target: 'woocommerce' },
      { id: 'router-route-2-woocommerce', source: 'router', sourceHandle: 'route-2', target: 'woocommerce' },
      
      // FASE 3: Presentación
      { id: 'edge-6', source: 'woocommerce', target: 'gpt-asistente-ventas' },
      { id: 'edge-7', source: 'gpt-asistente-ventas', target: 'whatsapp-asistente' },
      { id: 'edge-8', source: 'whatsapp-asistente', target: 'gpt-clasificador-intencion' },
      { id: 'edge-9', source: 'gpt-clasificador-intencion', target: 'router-intencion' },
      
      // FASE 4: Router Intención (solo 2 caminos con edges, route-buscar-mas sin edge)
      { id: 'edge-router-to-confirmacion', source: 'router-intencion', sourceHandle: 'route-agregar', target: 'gpt-confirmacion-carrito' },
      { id: 'edge-router-to-checkout', source: 'router-intencion', sourceHandle: 'route-checkout', target: 'gpt-mercadopago' },
      // NOTA: route-buscar-mas NO tiene edge (se maneja por lógica)
      
      // FASE 5: Confirmación Carrito
      { id: 'edge-10', source: 'gpt-confirmacion-carrito', target: 'whatsapp-confirmacion-carrito' },
      { id: 'edge-11', source: 'whatsapp-confirmacion-carrito', target: 'gpt-clasificador-continuar' },
      { id: 'edge-12', source: 'gpt-clasificador-continuar', target: 'router-continuar' },
      
      // FASE 6: Router Continuar (solo 1 camino con edge, route-seguir sin edge)
      { id: 'edge-continuar-to-mercadopago', source: 'router-continuar', sourceHandle: 'route-finalizar', target: 'gpt-mercadopago' },
      // NOTA: route-seguir NO tiene edge (se maneja por lógica)
      
      // FASE 7: Checkout Final
      { id: 'edge-13', source: 'gpt-mercadopago', target: 'whatsapp-mercadopago' }
    ];
    
    flow.edges = edgesCorrectos;
    console.log(`✅ ${edgesCorrectos.length} edges definidos`);
    
    // ============================================================================
    // PASO 3: GUARDAR EN MONGODB
    // ============================================================================
    console.log('\n📍 PASO 3: Guardar en MongoDB\n');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    
    // ============================================================================
    // VERIFICACIÓN
    // ============================================================================
    console.log('\n📊 VERIFICACIÓN\n');
    console.log('─'.repeat(80));
    
    let errores = 0;
    
    flow.nodes.forEach(node => {
      const incoming = flow.edges.filter(e => e.target === node.id).length;
      const outgoing = flow.edges.filter(e => e.source === node.id).length;
      
      if (node.type !== 'router' && node.type !== 'webhook' && incoming > 1) {
        if (node.id === 'gpt-mercadopago' && incoming === 2) {
          console.log(`⚠️  ${node.id}: ${incoming} entradas (válido - checkout dual)`);
        } else if (node.id === 'woocommerce' && incoming === 2) {
          console.log(`⚠️  ${node.id}: ${incoming} entradas (válido - 2 caminos de búsqueda)`);
        } else {
          console.log(`❌ ${node.id}: ${incoming} entradas (debería tener 1)`);
          errores++;
        }
      }
      
      if (node.type !== 'router' && outgoing > 1) {
        console.log(`❌ ${node.id}: ${outgoing} salidas (debería tener 1)`);
        errores++;
      }
    });
    
    if (errores === 0) {
      console.log('✅ Todas las conexiones son válidas');
    }
    
    console.log('\n\n🎯 FLUJO RESTAURADO:\n');
    console.log('webhook → conversacional → formateador → router');
    console.log('  ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar → woocommerce');
    console.log('  └─ route-2 → woocommerce');
    console.log('    → gpt-asistente-ventas → whatsapp → clasificador → router-intencion');
    console.log('      ├─ route-agregar → confirmacion → whatsapp → clasificador → router-continuar');
    console.log('      │                                                 └─ route-finalizar → mercadopago → whatsapp');
    console.log('      ├─ route-buscar-mas → [SIN EDGE - manejo por lógica]');
    console.log('      └─ route-checkout → mercadopago → whatsapp');
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    console.log('\n✅ Restauración completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

restaurarFlujoOriginal();
