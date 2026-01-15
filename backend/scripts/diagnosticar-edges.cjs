const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function diagnosticarEdges() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flow = await db.collection('flows').findOne({ 
      _id: new mongoose.Types.ObjectId(FLOW_ID) 
    });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);

    console.log('🔗 EDGES Y SUS MAPPINGS:\n');

    flow.edges.forEach((edge, index) => {
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      
      console.log(`${index + 1}. ${sourceNode?.data?.label || edge.source} → ${targetNode?.data?.label || edge.target}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   Mapping:`, JSON.stringify(edge.data?.mapping || {}, null, 2));
      console.log('');
    });

    console.log('\n🔍 PROBLEMA DETECTADO:');
    console.log('Si los edges NO tienen mapping, el input será {} vacío');
    console.log('Esto causa que userMessage = JSON.stringify({}) = "{}"');
    console.log('Y por eso el historial guarda "{}" en lugar del mensaje real\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnosticarEdges();
