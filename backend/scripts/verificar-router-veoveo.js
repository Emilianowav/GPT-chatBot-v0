import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarRouter() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');
    
    const db = mongoose.connection.db;
    
    // Buscar el flujo de VeoVeo
    const flow = await db.collection('flows').findOne({ 
      activo: true,
      $or: [
        { nombre: /veo veo/i },
        { id: /veo-veo/i },
        { empresaId: /veo veo/i }
      ]
    });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo de VeoVeo');
      return;
    }
    
    console.log(`✅ Flujo encontrado: ${flow.nombre || flow.id}\n`);
    
    // Buscar el router que viene después de gpt-formateador
    const routerNode = flow.nodes.find(n => n.id === 'router');
    
    if (!routerNode) {
      console.log('❌ No se encontró el nodo router');
      return;
    }
    
    console.log('📊 NODO ROUTER:');
    console.log(`   ID: ${routerNode.id}`);
    console.log(`   Type: ${routerNode.type}`);
    console.log(`   Config:`, JSON.stringify(routerNode.data?.config, null, 2));
    
    // Buscar edges que salen del router
    const routerEdges = flow.edges.filter(e => e.source === 'router');
    
    console.log(`\n🔗 EDGES DESDE ROUTER: ${routerEdges.length}`);
    routerEdges.forEach((edge, i) => {
      console.log(`\n   Edge ${i + 1}:`);
      console.log(`   - ID: ${edge.id}`);
      console.log(`   - Source: ${edge.source}`);
      console.log(`   - SourceHandle: ${edge.sourceHandle}`);
      console.log(`   - Target: ${edge.target}`);
      console.log(`   - Condition: ${edge.data?.condition || 'SIN CONDICIÓN'}`);
      console.log(`   - Label: ${edge.data?.label || 'Sin label'}`);
    });
    
    console.log('\n🔍 ANÁLISIS:');
    
    const edgeToWooCommerce = routerEdges.find(e => e.target === 'woocommerce');
    const edgeToPedirDatos = routerEdges.find(e => e.target === 'gpt-pedir-datos');
    
    if (edgeToWooCommerce) {
      console.log(`\n✅ Edge a WooCommerce encontrado:`);
      console.log(`   - Condición: ${edgeToWooCommerce.data?.condition || 'SIN CONDICIÓN'}`);
      console.log(`   - SourceHandle: ${edgeToWooCommerce.sourceHandle}`);
    } else {
      console.log('\n❌ NO hay edge directo a WooCommerce');
    }
    
    if (edgeToPedirDatos) {
      console.log(`\n✅ Edge a gpt-pedir-datos encontrado:`);
      console.log(`   - Condición: ${edgeToPedirDatos.data?.condition || 'SIN CONDICIÓN'}`);
      console.log(`   - SourceHandle: ${edgeToPedirDatos.sourceHandle}`);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarRouter();
