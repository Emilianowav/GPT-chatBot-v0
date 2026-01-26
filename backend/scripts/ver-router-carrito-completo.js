import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verRouterCarrito() {
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
    
    console.log('\n🔀 ANÁLISIS COMPLETO DE router-carrito\n');
    console.log('═'.repeat(80));
    
    const routerCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    
    if (!routerCarrito) {
      console.log('❌ router-carrito no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📋 CONFIGURACIÓN DEL NODO:\n');
    console.log(JSON.stringify(routerCarrito.data.config, null, 2));
    
    console.log('\n\n🔗 EDGES DESDE router-carrito:\n');
    const edgesFromRouter = flow.edges.filter(e => e.source === 'router-carrito');
    
    edgesFromRouter.forEach((edge, index) => {
      console.log(`${index + 1}. Edge: ${edge.id}`);
      console.log(`   Hacia: ${edge.target}`);
      console.log(`   Label: ${edge.label || 'Sin label'}`);
      console.log(`   SourceHandle: ${edge.sourceHandle || 'N/A'}`);
      
      if (edge.data) {
        console.log(`   Data:`, JSON.stringify(edge.data, null, 2));
      }
      
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      if (targetNode) {
        console.log(`   Nodo destino: ${targetNode.data.label} (${targetNode.type})`);
      }
      console.log('');
    });
    
    console.log('\n🔗 EDGES HACIA router-carrito:\n');
    const edgesToRouter = flow.edges.filter(e => e.target === 'router-carrito');
    
    edgesToRouter.forEach((edge, index) => {
      console.log(`${index + 1}. Edge: ${edge.id}`);
      console.log(`   Desde: ${edge.source}`);
      console.log(`   Label: ${edge.label || 'Sin label'}`);
      
      if (edge.data) {
        console.log(`   Data:`, JSON.stringify(edge.data, null, 2));
      }
      
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        console.log(`   Nodo origen: ${sourceNode.data.label} (${sourceNode.type})`);
      }
      console.log('');
    });
    
    console.log('\n📊 ANÁLISIS:\n');
    console.log('Rutas configuradas:', routerCarrito.data.config?.routes?.length || 0);
    console.log('Edges salientes:', edgesFromRouter.length);
    console.log('Edges entrantes:', edgesToRouter.length);
    
    console.log('\n' + '═'.repeat(80));
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verRouterCarrito();
