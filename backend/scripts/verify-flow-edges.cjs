require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function verifyFlowEdges() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN DE EDGES DEL FLUJO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`📋 Total de nodos: ${flow.nodes.length}`);
    console.log(`🔗 Total de edges: ${flow.edges.length}\n`);
    
    // Mapear nodos por ID
    const nodeMap = {};
    flow.nodes.forEach(node => {
      nodeMap[node.id] = node.data.label;
    });
    
    console.log('📊 FLUJO DE EJECUCIÓN ESPERADO:\n');
    
    // Encontrar nodo trigger
    const triggerNode = flow.nodes.find(n => n.category === 'trigger');
    if (!triggerNode) {
      console.log('❌ No se encontró nodo trigger');
      return;
    }
    
    console.log(`1. INICIO: ${triggerNode.data.label} (${triggerNode.id})`);
    
    // Seguir los edges
    let currentNodeId = triggerNode.id;
    let step = 2;
    const visited = new Set();
    
    while (currentNodeId && step < 20) {
      if (visited.has(currentNodeId)) {
        console.log(`   ⚠️  Loop detectado en ${nodeMap[currentNodeId]}`);
        break;
      }
      visited.add(currentNodeId);
      
      const outgoingEdges = flow.edges.filter(e => e.source === currentNodeId);
      
      if (outgoingEdges.length === 0) {
        console.log(`   ✅ FIN (no hay más edges desde ${nodeMap[currentNodeId]})`);
        break;
      }
      
      if (outgoingEdges.length === 1) {
        const edge = outgoingEdges[0];
        const targetNode = nodeMap[edge.target];
        console.log(`${step}. ${targetNode} (${edge.target})`);
        currentNodeId = edge.target;
        step++;
      } else {
        // Múltiples edges (Router)
        console.log(`${step}. ROUTER - Múltiples rutas:`);
        outgoingEdges.forEach(edge => {
          const targetNode = nodeMap[edge.target];
          const routeLabel = edge.data?.routeLabel || edge.sourceHandle || 'N/A';
          console.log(`   → ${routeLabel}: ${targetNode} (${edge.target})`);
        });
        
        // Seguir la primera ruta para continuar el análisis
        currentNodeId = outgoingEdges[0].target;
        step++;
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('ANÁLISIS DE EDGES POR NODO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    flow.nodes.forEach((node, index) => {
      const incoming = flow.edges.filter(e => e.target === node.id);
      const outgoing = flow.edges.filter(e => e.source === node.id);
      
      console.log(`${index + 1}. ${node.data.label} (${node.id})`);
      
      if (incoming.length > 0) {
        console.log(`   📥 Entrantes: ${incoming.length}`);
        incoming.forEach(e => {
          const sourceLabel = nodeMap[e.source];
          console.log(`      ← ${sourceLabel}`);
          if (e.sourceHandle) console.log(`        Handle: ${e.sourceHandle}`);
          if (e.data?.routeId) console.log(`        Ruta: ${e.data.routeLabel} (${e.data.routeId})`);
        });
      } else {
        console.log(`   📥 Entrantes: 0 ${node.category === 'trigger' ? '(TRIGGER)' : '⚠️ NODO AISLADO'}`);
      }
      
      if (outgoing.length > 0) {
        console.log(`   📤 Salientes: ${outgoing.length}`);
        outgoing.forEach(e => {
          const targetLabel = nodeMap[e.target];
          console.log(`      → ${targetLabel}`);
          if (e.sourceHandle) console.log(`        Handle: ${e.sourceHandle}`);
          if (e.data?.routeId) console.log(`        Ruta: ${e.data.routeLabel} (${e.data.routeId})`);
        });
      } else {
        console.log(`   📤 Salientes: 0 (NODO FINAL)`);
      }
      
      console.log('');
    });
    
    // Verificar problemas
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN DE PROBLEMAS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let hasProblems = false;
    
    // Nodos sin edges entrantes (excepto trigger)
    const isolated = flow.nodes.filter(n => {
      const incoming = flow.edges.filter(e => e.target === n.id);
      return incoming.length === 0 && n.category !== 'trigger';
    });
    
    if (isolated.length > 0) {
      hasProblems = true;
      console.log('⚠️  NODOS AISLADOS (sin edges entrantes):');
      isolated.forEach(n => {
        console.log(`   - ${n.data.label} (${n.id})`);
      });
      console.log('');
    }
    
    // Nodos sin edges salientes (excepto finales)
    const deadEnds = flow.nodes.filter(n => {
      const outgoing = flow.edges.filter(e => e.source === n.id);
      return outgoing.length === 0 && n.type !== 'whatsapp';
    });
    
    if (deadEnds.length > 0) {
      hasProblems = true;
      console.log('⚠️  NODOS SIN SALIDA (pueden interrumpir el flujo):');
      deadEnds.forEach(n => {
        console.log(`   - ${n.data.label} (${n.id})`);
      });
      console.log('');
    }
    
    if (!hasProblems) {
      console.log('✅ No se detectaron problemas en la estructura de edges');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyFlowEdges();
