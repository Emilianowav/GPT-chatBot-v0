require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verRouter() {
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

    // Buscar el nodo router
    const router = flow.nodes.find(n => n.id === 'router');

    if (!router) {
      console.log('❌ Router no encontrado');
      return;
    }

    console.log('🔀 NODO ROUTER:');
    console.log(`   ID: ${router.id}`);
    console.log(`   Type: ${router.type}`);
    console.log(`   Label: ${router.data?.label}\n`);

    console.log('📋 CONFIGURACIÓN:');
    console.log(JSON.stringify(router.data?.config, null, 2));
    console.log('');

    console.log('🔗 EDGES DESDE ROUTER:');
    const edgesFromRouter = flow.edges.filter(e => e.source === 'router');
    
    edgesFromRouter.forEach((edge, index) => {
      console.log(`\n${index + 1}. Edge ID: ${edge.id}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   SourceHandle: ${edge.sourceHandle || 'undefined'}`);
      console.log(`   Label: ${edge.data?.label || 'Sin label'}`);
      console.log(`   Condition: ${edge.data?.condition || 'Sin condición'}`);
      console.log(`   RouteId: ${edge.data?.routeId || 'undefined'}`);
    });

    console.log('\n\n🎯 ANÁLISIS:');
    console.log('El router debe tener 2 rutas:');
    console.log('1. "Falta título" (route-1): cuando gpt-conversacional.variables_faltantes not_empty');
    console.log('2. "Búsqueda Inicial" (route-2): cuando gpt-conversacional.variables_faltantes is_empty');
    console.log('');
    console.log('Cuando variables_completas = true, variables_faltantes debe estar vacío,');
    console.log('entonces debe tomar la ruta 2 hacia WooCommerce.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

verRouter();
