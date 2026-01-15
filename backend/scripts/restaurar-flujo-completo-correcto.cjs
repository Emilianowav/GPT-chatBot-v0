const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * FLUJO COMPLETO DEL CÍRCULO ROJO (CORRECTO)
 * 
 * webhook → gpt-conversacional → gpt-formateador → router
 *   ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar → woocommerce
 *   └─ route-2 → woocommerce
 *     → gpt-asistente-ventas → whatsapp-asistente
 */

async function restaurarFlujoCompletoCorrect() {
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
    
    console.log('\n🔴 RESTAURANDO FLUJO COMPLETO DEL CÍRCULO ROJO\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // NODOS DEL FLUJO COMPLETO
    // ============================================================================
    const nodosCompletos = [
      'webhook-whatsapp',
      'gpt-conversacional',
      'gpt-formateador',
      'router',
      'gpt-pedir-datos',
      'whatsapp-preguntar',
      'woocommerce',
      'gpt-asistente-ventas',
      'whatsapp-asistente'
    ];
    
    console.log('\n📍 Nodos del flujo completo:\n');
    nodosCompletos.forEach(id => console.log(`  ✅ ${id}`));
    
    // Verificar si faltan nodos y restaurarlos
    const nodosExistentes = flow.nodes.map(n => n.id);
    
    if (!nodosExistentes.includes('gpt-pedir-datos')) {
      flow.nodes.push({
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
      console.log('\n✅ Restaurado: gpt-pedir-datos');
    }
    
    if (!nodosExistentes.includes('whatsapp-preguntar')) {
      flow.nodes.push({
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
      console.log('✅ Restaurado: whatsapp-preguntar');
    }
    
    // Filtrar solo los nodos del flujo completo
    flow.nodes = flow.nodes.filter(node => nodosCompletos.includes(node.id));
    
    console.log(`\n📊 Nodos totales: ${flow.nodes.length}`);
    
    // ============================================================================
    // EDGES DEL FLUJO COMPLETO
    // ============================================================================
    console.log('\n📍 Definiendo edges del flujo completo\n');
    
    const edgesCompletos = [
      // Flujo principal
      { id: 'edge-1', source: 'webhook-whatsapp', target: 'gpt-conversacional', type: 'default' },
      { id: 'edge-2', source: 'gpt-conversacional', target: 'gpt-formateador', type: 'default' },
      { id: 'edge-3', source: 'gpt-formateador', target: 'router', type: 'default' },
      
      // Router con 2 caminos
      { id: 'edge-4', source: 'router', sourceHandle: 'route-1', target: 'gpt-pedir-datos', type: 'default' },
      { id: 'edge-5', source: 'gpt-pedir-datos', target: 'whatsapp-preguntar', type: 'default' },
      { id: 'edge-6', source: 'whatsapp-preguntar', target: 'woocommerce', type: 'default' },
      { id: 'edge-7', source: 'router', sourceHandle: 'route-2', target: 'woocommerce', type: 'default' },
      
      // Continuación
      { id: 'edge-8', source: 'woocommerce', target: 'gpt-asistente-ventas', type: 'default' },
      { id: 'edge-9', source: 'gpt-asistente-ventas', target: 'whatsapp-asistente', type: 'default' }
    ];
    
    flow.edges = edgesCompletos;
    console.log(`✅ ${edgesCompletos.length} edges definidos`);
    
    // ============================================================================
    // ACTUALIZAR ROUTER (2 rutas)
    // ============================================================================
    console.log('\n📍 Actualizando router\n');
    
    const router = flow.nodes.find(n => n.id === 'router');
    if (router && router.data) {
      router.data.config = {
        routes: [
          { id: 'route-1', label: 'Pedir Datos', condition: 'necesita_datos' },
          { id: 'route-2', label: 'Buscar Directo', condition: 'buscar_directo' }
        ]
      };
      console.log('✅ Router configurado con 2 rutas');
    }
    
    // ============================================================================
    // GUARDAR EN MONGODB
    // ============================================================================
    console.log('\n📍 Guardando en MongoDB\n');
    
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
    // RESUMEN
    // ============================================================================
    console.log('\n\n🎯 FLUJO COMPLETO RESTAURADO:\n');
    console.log('webhook-whatsapp');
    console.log('  → gpt-conversacional');
    console.log('  → gpt-formateador');
    console.log('  → router (2 salidas):');
    console.log('      ├─ route-1 → gpt-pedir-datos → whatsapp-preguntar → woocommerce');
    console.log('      └─ route-2 → woocommerce');
    console.log('  → gpt-asistente-ventas');
    console.log('  → whatsapp-asistente');
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    console.log(`   Routers: 1 (con 2 rutas)`);
    
    console.log('\n✅ Este es el flujo COMPLETO del círculo rojo\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

restaurarFlujoCompletoCorrect();
