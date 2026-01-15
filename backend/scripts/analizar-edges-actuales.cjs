const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function analizarEdges() {
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
    
    console.log('\n🔍 ANÁLISIS DE CONEXIONES ACTUALES\n');
    console.log('═'.repeat(80));
    
    // Analizar cada nodo
    const analisis = {};
    
    flow.nodes.forEach(node => {
      const incomingEdges = flow.edges.filter(e => e.target === node.id);
      const outgoingEdges = flow.edges.filter(e => e.source === node.id);
      
      analisis[node.id] = {
        type: node.type,
        label: node.data?.label || node.id,
        incoming: incomingEdges.length,
        outgoing: outgoingEdges.length,
        incomingFrom: incomingEdges.map(e => e.source),
        outgoingTo: outgoingEdges.map(e => ({ target: e.target, handle: e.sourceHandle }))
      };
    });
    
    console.log('\n📊 NODOS CON PROBLEMAS:\n');
    
    Object.entries(analisis).forEach(([nodeId, data]) => {
      const problemas = [];
      
      // Nodos normales (no routers) NO deberían tener múltiples salidas
      if (data.type !== 'router' && data.outgoing > 1) {
        problemas.push(`❌ ${data.outgoing} salidas (debería tener 1)`);
      }
      
      // Nodos normales (excepto webhook) NO deberían tener múltiples entradas
      if (data.type !== 'router' && data.type !== 'webhook' && data.incoming > 1) {
        problemas.push(`❌ ${data.incoming} entradas (debería tener 1)`);
      }
      
      if (problemas.length > 0) {
        console.log(`\n🔴 ${nodeId} (${data.type})`);
        console.log(`   Label: ${data.label}`);
        problemas.forEach(p => console.log(`   ${p}`));
        console.log(`   Entradas desde: ${data.incomingFrom.join(', ')}`);
        console.log(`   Salidas hacia:`);
        data.outgoingTo.forEach(o => console.log(`     → ${o.target} ${o.handle ? `(${o.handle})` : ''}`));
      }
    });
    
    console.log('\n\n📋 TODOS LOS EDGES:\n');
    flow.edges.forEach(edge => {
      console.log(`${edge.source} ${edge.sourceHandle ? `[${edge.sourceHandle}]` : ''} → ${edge.target}`);
    });
    
    console.log('\n✅ Análisis completado\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

analizarEdges();
