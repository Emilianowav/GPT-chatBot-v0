import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function analizarFlujoAutoayuda() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n🔍 ANALIZANDO FLUJO CUANDO USUARIO PIDE "AUTOAYUDA"\n');
    console.log('═'.repeat(80));
    
    // Simular el flujo
    console.log('\n📋 FLUJO ESPERADO:');
    console.log('   1. Usuario: "Autoayuda"');
    console.log('   2. gpt-clasificador → tipo_accion = "buscar_producto"');
    console.log('   3. router-principal → Ruta "Buscar Producto"');
    console.log('   4. gpt-formateador → Extrae "autoayuda"');
    console.log('   5. router → ¿Va a WooCommerce?');
    console.log('   6. woocommerce → Busca productos');
    console.log('   7. gpt-asistente-ventas → Muestra productos');
    
    // Analizar router-principal
    console.log('\n\n🔀 ROUTER-PRINCIPAL:');
    const routerPrincipal = flow.nodes.find(n => n.id === 'router-principal');
    
    if (routerPrincipal) {
      const edgesFromRP = flow.edges.filter(e => e.source === 'router-principal');
      
      console.log(`   Rutas configuradas: ${routerPrincipal.data.config?.routes?.length || 0}`);
      console.log(`   Edges salientes: ${edgesFromRP.length}`);
      
      console.log('\n   Edges:');
      edgesFromRP.forEach((edge, i) => {
        const targetNode = flow.nodes.find(n => n.id === edge.target);
        console.log(`\n   ${i + 1}. Hacia: ${edge.target} (${targetNode?.data.label})`);
        console.log(`      Condición: ${edge.data?.condition || 'Sin condición'}`);
        console.log(`      Label: ${edge.label || edge.data?.label || 'Sin label'}`);
      });
    }
    
    // Analizar router (el que decide si va a WooCommerce)
    console.log('\n\n🔀 ROUTER (después de formateador):');
    const router = flow.nodes.find(n => n.id === 'router');
    
    if (router) {
      const edgesFromRouter = flow.edges.filter(e => e.source === 'router');
      
      console.log(`   Rutas configuradas: ${router.data.config?.routes?.length || 0}`);
      console.log(`   Edges salientes: ${edgesFromRouter.length}`);
      
      console.log('\n   Rutas:');
      router.data.config?.routes?.forEach((route, i) => {
        console.log(`\n   ${i + 1}. ${route.label}`);
        console.log(`      Condición: ${route.condition}`);
      });
      
      console.log('\n   Edges:');
      edgesFromRouter.forEach((edge, i) => {
        const targetNode = flow.nodes.find(n => n.id === edge.target);
        console.log(`\n   ${i + 1}. Hacia: ${edge.target} (${targetNode?.data.label})`);
        console.log(`      Condición: ${edge.data?.condition || 'Sin condición'}`);
        console.log(`      Label: ${edge.label || edge.data?.label || 'Sin label'}`);
      });
    }
    
    // Buscar si hay conexión directa router-principal → gpt-asistente-ventas
    console.log('\n\n🚨 VERIFICANDO CONEXIÓN DIRECTA (PROBLEMA):');
    const directConnection = flow.edges.find(e => 
      e.source === 'router-principal' && e.target === 'gpt-asistente-ventas'
    );
    
    if (directConnection) {
      console.log('   ❌ PROBLEMA ENCONTRADO:');
      console.log('   Existe conexión DIRECTA: router-principal → gpt-asistente-ventas');
      console.log(`   Condición: ${directConnection.data?.condition || 'Sin condición'}`);
      console.log(`   Label: ${directConnection.label || directConnection.data?.label || 'Sin label'}`);
      console.log('');
      console.log('   🔧 ESTO EXPLICA EL PROBLEMA:');
      console.log('   El flujo puede ir directo a GPT sin pasar por WooCommerce');
      console.log('   Por eso el GPT inventa productos (no tiene datos reales)');
    } else {
      console.log('   ✅ No hay conexión directa router-principal → gpt-asistente-ventas');
    }
    
    // Verificar si hay otras conexiones hacia gpt-asistente-ventas
    console.log('\n\n📍 TODAS LAS CONEXIONES HACIA gpt-asistente-ventas:');
    const allToGPT = flow.edges.filter(e => e.target === 'gpt-asistente-ventas');
    
    allToGPT.forEach((edge, i) => {
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      console.log(`\n   ${i + 1}. Desde: ${edge.source} (${sourceNode?.data.label})`);
      console.log(`      Condición: ${edge.data?.condition || 'Sin condición'}`);
      console.log(`      Label: ${edge.label || edge.data?.label || 'Sin label'}`);
      
      if (edge.source !== 'woocommerce') {
        console.log(`      ⚠️  Esta conexión NO viene de WooCommerce`);
      }
    });
    
    console.log('\n' + '═'.repeat(80));
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analizarFlujoAutoayuda();
