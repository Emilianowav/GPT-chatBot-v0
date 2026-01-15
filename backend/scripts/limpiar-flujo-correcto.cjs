const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * LIMPIAR Y DEJAR SOLO EL FLUJO CORRECTO
 * 
 * Eliminar:
 * - gpt-mercadopago (duplicado)
 * - Edges duplicados
 * 
 * Dejar:
 * - mercadopago (nodo de tipo mercadopago para generar link)
 */

async function limpiarFlujo() {
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
    
    console.log('\n🧹 LIMPIANDO FLUJO\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // PASO 1: ELIMINAR NODO DUPLICADO (gpt-mercadopago)
    // ============================================================================
    console.log('\n📍 PASO 1: Eliminar nodo duplicado\n');
    
    const nodosOriginales = flow.nodes.length;
    flow.nodes = flow.nodes.filter(node => node.id !== 'gpt-mercadopago');
    
    console.log(`✅ Eliminado: gpt-mercadopago`);
    console.log(`📊 Nodos: ${nodosOriginales} → ${flow.nodes.length}`);
    
    // ============================================================================
    // PASO 2: LIMPIAR EDGES DUPLICADOS Y REFERENCIAS A gpt-mercadopago
    // ============================================================================
    console.log('\n📍 PASO 2: Limpiar edges\n');
    
    const edgesOriginales = flow.edges.length;
    
    // Eliminar edges duplicados y referencias a gpt-mercadopago
    const edgesUnicos = [];
    const edgesVistos = new Set();
    
    flow.edges.forEach(edge => {
      // Saltar edges que referencian gpt-mercadopago
      if (edge.source === 'gpt-mercadopago' || edge.target === 'gpt-mercadopago') {
        console.log(`❌ Eliminando edge: ${edge.source} → ${edge.target}`);
        return;
      }
      
      // Crear clave única para detectar duplicados
      const clave = `${edge.source}|${edge.sourceHandle || ''}|${edge.target}`;
      
      if (!edgesVistos.has(clave)) {
        edgesVistos.add(clave);
        edgesUnicos.push(edge);
      } else {
        console.log(`❌ Eliminando edge duplicado: ${edge.source} → ${edge.target}`);
      }
    });
    
    flow.edges = edgesUnicos;
    
    console.log(`\n📊 Edges: ${edgesOriginales} → ${flow.edges.length}`);
    
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
    console.log('\n📊 FLUJO LIMPIO:\n');
    console.log('─'.repeat(80));
    
    console.log('\nNODOS:');
    flow.nodes.forEach((node, i) => {
      console.log(`  ${i + 1}. ${node.id} (${node.type})`);
    });
    
    console.log('\nEDGES:');
    flow.edges.forEach((edge, i) => {
      const sourceHandle = edge.sourceHandle ? ` [${edge.sourceHandle}]` : '';
      console.log(`  ${i + 1}. ${edge.source}${sourceHandle} → ${edge.target}`);
    });
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    console.log('\n✅ Flujo limpiado\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

limpiarFlujo();
