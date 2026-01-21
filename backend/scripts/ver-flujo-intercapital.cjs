const mongoose = require('mongoose');

async function verFlujoIntercapital() {
  try {
    await mongoose.connect('mongodb://localhost:27017/crm_db');
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Buscar flujo de Intercapital
    const flow = await flowsCollection.findOne({ empresaId: 'Intercapital', activo: true });
    
    if (!flow) {
      console.log('❌ No se encontró flujo activo de Intercapital');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`📊 FLUJO: ${flow.nombre}`);
    console.log(`   ID: ${flow._id}`);
    console.log(`   Nodos: ${flow.nodes?.length || 0}`);
    console.log(`   Edges: ${flow.edges?.length || 0}\n`);
    
    console.log('📋 NODOS EN ORDEN:\n');
    flow.nodes.forEach((node, index) => {
      console.log(`${index + 1}. ${node.type} - ${node.data?.label || 'Sin label'}`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Posición: x=${node.position?.x}, y=${node.position?.y}`);
      
      // Si es HTTP, mostrar config
      if (node.type === 'http' && node.data?.config) {
        console.log(`   Config HTTP:`);
        console.log(`      URL: ${node.data.config.url || 'N/A'}`);
        console.log(`      Método: ${node.data.config.method || 'N/A'}`);
        console.log(`      Tiene API Key: ${!!node.data.config.auth?.apiKey}`);
      }
      console.log('');
    });
    
    console.log('\n🔗 CONEXIONES:\n');
    flow.edges.forEach((edge, index) => {
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      console.log(`${index + 1}. ${sourceNode?.data?.label || edge.source} → ${targetNode?.data?.label || edge.target}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verFlujoIntercapital();
