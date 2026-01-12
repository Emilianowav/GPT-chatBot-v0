const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('📋 FLUJO ACTUAL: ' + flow.nombre);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Mapear nodos por ID
    const nodesMap = {};
    flow.nodes.forEach(n => {
      nodesMap[n.id] = n;
    });

    // Encontrar el camino desde WooCommerce
    const wooNode = flow.nodes.find(n => n.type === 'woocommerce');
    
    if (wooNode) {
      console.log('🔍 CAMINO DESDE WOOCOMMERCE:\n');
      
      let currentId = wooNode.id;
      let visited = new Set();
      let step = 1;
      
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const node = nodesMap[currentId];
        
        if (!node) break;
        
        console.log(`${step}. [${node.type}] ${node.data?.label || node.id}`);
        if (node.data?.subtitle) {
          console.log(`   Subtítulo: ${node.data.subtitle}`);
        }
        if (node.type === 'whatsapp' && node.data?.config?.message) {
          console.log(`   Mensaje: ${node.data.config.message.substring(0, 80)}...`);
        }
        if (node.type === 'gpt' && node.data?.config?.systemPrompt) {
          console.log(`   Prompt: ${node.data.config.systemPrompt.substring(0, 80)}...`);
        }
        console.log('');
        
        // Buscar siguiente nodo
        const nextEdge = flow.edges.find(e => e.source === currentId);
        currentId = nextEdge?.target;
        step++;
        
        if (step > 20) break; // Evitar loops infinitos
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE NODOS:\n');
    
    const nodesByType = {};
    flow.nodes.forEach(n => {
      if (!nodesByType[n.type]) nodesByType[n.type] = [];
      nodesByType[n.type].push(n.data?.label || n.id);
    });
    
    Object.keys(nodesByType).forEach(type => {
      console.log(`${type}:`);
      nodesByType[type].forEach(label => {
        console.log(`  - ${label}`);
      });
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 FLUJO DESEADO:\n');
    console.log('1. WooCommerce (busca productos)');
    console.log('   ↓');
    console.log('2. GPT Ventas (muestra productos + pregunta si agregar)');
    console.log('   ↓');
    console.log('3. WhatsApp (envía mensaje)');
    console.log('   ↓');
    console.log('4. [USUARIO RESPONDE]');
    console.log('   ↓');
    console.log('5. Router (detecta intención)');
    console.log('   ↓');
    console.log('   ├─ "Agregar" → GPT confirma → WhatsApp → Pregunta "¿Algo más?"');
    console.log('   │                                           ↓');
    console.log('   │                                    Router (Sí/No)');
    console.log('   │                                           ↓');
    console.log('   │                              ┌────────────┴────────────┐');
    console.log('   │                              ↓                         ↓');
    console.log('   │                          "Sí" (loop)              "No" → Mercado Pago');
    console.log('   │');
    console.log('   └─ "Buscar más" → Loop a GPT Conversacional');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  PROBLEMA ACTUAL:\n');
    console.log('- Se envían 2 mensajes (gpt-resultados + gpt-asistente)');
    console.log('- No hay Router para detectar intención del usuario');
    console.log('- No hay camino a Mercado Pago');
    console.log('- El loop no está bien definido');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
