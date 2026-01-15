const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * NORMALIZAR NÚMEROS DE PASOS EN EL FLUJO
 * 
 * Reglas:
 * 1. Los números de paso deben reflejar la posición en el flujo, no el orden de creación
 * 2. Nodos en paralelo (después de un router) deben tener el mismo número de paso
 * 3. Calcular profundidad desde el inicio del flujo
 */

async function normalizarPasos() {
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
    
    console.log('\n🔢 NORMALIZANDO NÚMEROS DE PASOS\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // PASO 1: MOSTRAR CONFIGURACIÓN ACTUAL DE NODOS FINALES
    // ============================================================================
    console.log('\n📍 PASO 1: Configuración actual de nodos finales\n');
    
    const nodosFinales = ['gpt-clasificador', 'router-intencion', 'gpt-carrito', 'whatsapp-confirmacion', 'mercadopago', 'whatsapp-pago'];
    
    nodosFinales.forEach(nodeId => {
      const node = flow.nodes.find(n => n.id === nodeId);
      if (node) {
        console.log(`${nodeId}:`);
        console.log(`  - Tipo: ${node.type}`);
        console.log(`  - Label: ${node.data?.label || 'N/A'}`);
        console.log(`  - ExecutionCount: ${node.data?.executionCount || 'N/A'}`);
        if (node.data?.config) {
          console.log(`  - Config:`, JSON.stringify(node.data.config, null, 2));
        }
        console.log('');
      }
    });
    
    // ============================================================================
    // PASO 2: CALCULAR PROFUNDIDAD DE CADA NODO (BFS)
    // ============================================================================
    console.log('\n📍 PASO 2: Calcular profundidad de cada nodo\n');
    
    // Encontrar nodo inicial (webhook)
    const nodoInicial = flow.nodes.find(n => n.type === 'webhook');
    if (!nodoInicial) {
      console.log('❌ No se encontró nodo inicial (webhook)');
      return;
    }
    
    // Crear mapa de adyacencia
    const adjacencyMap = new Map();
    flow.edges.forEach(edge => {
      if (!adjacencyMap.has(edge.source)) {
        adjacencyMap.set(edge.source, []);
      }
      adjacencyMap.get(edge.source).push(edge.target);
    });
    
    // BFS para calcular profundidad
    const depths = new Map();
    const queue = [[nodoInicial.id, 1]]; // [nodeId, depth]
    depths.set(nodoInicial.id, 1);
    
    while (queue.length > 0) {
      const [currentId, currentDepth] = queue.shift();
      const neighbors = adjacencyMap.get(currentId) || [];
      
      neighbors.forEach(neighborId => {
        if (!depths.has(neighborId)) {
          depths.set(neighborId, currentDepth + 1);
          queue.push([neighborId, currentDepth + 1]);
        } else {
          // Si ya tiene profundidad, usar la menor (para nodos con múltiples entradas)
          const existingDepth = depths.get(neighborId);
          if (currentDepth + 1 < existingDepth) {
            depths.set(neighborId, currentDepth + 1);
          }
        }
      });
    }
    
    console.log('Profundidades calculadas:');
    flow.nodes.forEach(node => {
      const depth = depths.get(node.id) || 0;
      console.log(`  ${node.id}: paso ${depth}`);
    });
    
    // ============================================================================
    // PASO 3: ACTUALIZAR executionCount EN TODOS LOS NODOS
    // ============================================================================
    console.log('\n📍 PASO 3: Actualizar executionCount en todos los nodos\n');
    
    let cambios = 0;
    
    flow.nodes.forEach(node => {
      const nuevoPaso = depths.get(node.id) || 1;
      const pasoActual = node.data?.executionCount;
      
      if (pasoActual !== nuevoPaso) {
        console.log(`✏️  ${node.id}: ${pasoActual} → ${nuevoPaso}`);
        
        if (!node.data) {
          node.data = {};
        }
        node.data.executionCount = nuevoPaso;
        cambios++;
      }
    });
    
    console.log(`\n📊 ${cambios} nodos actualizados`);
    
    // ============================================================================
    // PASO 4: VERIFICAR NODOS PARALELOS
    // ============================================================================
    console.log('\n📍 PASO 4: Verificar nodos paralelos (después de routers)\n');
    
    const routers = flow.nodes.filter(n => n.type === 'router');
    
    routers.forEach(router => {
      const routerDepth = depths.get(router.id);
      const children = adjacencyMap.get(router.id) || [];
      
      console.log(`\nRouter: ${router.id} (paso ${routerDepth})`);
      console.log(`  Hijos (todos deberían tener paso ${routerDepth + 1}):`);
      
      children.forEach(childId => {
        const childDepth = depths.get(childId);
        console.log(`    - ${childId}: paso ${childDepth} ${childDepth === routerDepth + 1 ? '✅' : '❌'}`);
      });
    });
    
    // ============================================================================
    // PASO 5: GUARDAR EN MONGODB
    // ============================================================================
    console.log('\n📍 PASO 5: Guardar en MongoDB\n');
    
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ Cambios guardados');
    
    // ============================================================================
    // RESUMEN
    // ============================================================================
    console.log('\n📊 RESUMEN:\n');
    console.log('─'.repeat(80));
    
    const pasosPorNivel = new Map();
    flow.nodes.forEach(node => {
      const paso = node.data?.executionCount || 0;
      if (!pasosPorNivel.has(paso)) {
        pasosPorNivel.set(paso, []);
      }
      pasosPorNivel.get(paso).push(node.id);
    });
    
    const niveles = Array.from(pasosPorNivel.keys()).sort((a, b) => a - b);
    niveles.forEach(nivel => {
      const nodos = pasosPorNivel.get(nivel);
      console.log(`Paso ${nivel}: ${nodos.join(', ')}`);
    });
    
    console.log('\n✅ Números de pasos normalizados\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

normalizarPasos();
