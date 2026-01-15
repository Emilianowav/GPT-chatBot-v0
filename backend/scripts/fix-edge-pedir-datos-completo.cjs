require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixEdge() {
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

    // Verificar edges actuales desde gpt-pedir-datos
    const edgesFromPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    
    console.log('🔍 EDGES ACTUALES desde gpt-pedir-datos:');
    edgesFromPedirDatos.forEach(e => {
      console.log(`   - ${e.id}: ${e.source} → ${e.target}`);
      console.log(`     Condition: ${e.data?.condition || 'Sin condición'}`);
    });
    console.log('');

    // Verificar si ya existe el edge hacia router/woocommerce
    const edgeCompleto = edgesFromPedirDatos.find(e => 
      e.data?.condition?.includes('variables_completas') && 
      e.data?.condition?.includes('true')
    );

    if (edgeCompleto) {
      console.log('✅ Ya existe un edge para variables_completas = true');
      console.log(`   Target: ${edgeCompleto.target}`);
      return;
    }

    console.log('🔧 CREANDO EDGE: gpt-pedir-datos → router (cuando variables_completas = true)\n');

    const nuevoEdge = {
      id: 'edge-pedir-datos-completo',
      source: 'gpt-pedir-datos',
      target: 'router',
      sourceHandle: 'complete',
      targetHandle: null,
      type: 'default',
      data: {
        label: 'Variables completas',
        condition: '{{gpt-pedir-datos.variables_completas}} equals true'
      }
    };

    console.log('📋 Configuración del nuevo edge:');
    console.log(JSON.stringify(nuevoEdge, null, 2));
    console.log('');

    // Agregar el edge
    flow.edges.push(nuevoEdge);

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );

    console.log('✅ Edge creado exitosamente\n');
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

fixEdge();
