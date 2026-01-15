require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function eliminarEdge() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 FLUJO:', flow.nombre);
    console.log('═══════════════════════════════════════\n');

    // Buscar y eliminar el edge incorrecto
    const edgeIncorrecto = flow.edges.find(e => e.id === 'edge-pedir-datos-completo');

    if (!edgeIncorrecto) {
      console.log('✅ El edge incorrecto no existe, todo bien');
      return;
    }

    console.log('🗑️  ELIMINANDO EDGE INCORRECTO:');
    console.log(`   ID: ${edgeIncorrecto.id}`);
    console.log(`   ${edgeIncorrecto.source} → ${edgeIncorrecto.target}`);
    console.log(`   Condition: ${edgeIncorrecto.data?.condition}\n`);

    // Eliminar el edge
    flow.edges = flow.edges.filter(e => e.id !== 'edge-pedir-datos-completo');

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );

    console.log('✅ Edge eliminado exitosamente\n');
    console.log('📊 EDGES FINALES desde gpt-pedir-datos:');
    
    const edgesFinales = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    edgesFinales.forEach(e => {
      console.log(`   - ${e.id}: ${e.source} → ${e.target}`);
      console.log(`     Condition: ${e.data?.condition || 'Sin condición'}`);
    });
    console.log('');
    console.log('🎯 Total edges en el flujo:', flow.edges.length);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

eliminarEdge();
