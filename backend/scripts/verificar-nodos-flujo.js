import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarNodosFlujo() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Obtener todos los flujos
    const flows = await flowsCollection.find({}).toArray();
    
    console.log('\n📊 FLUJOS EN BASE DE DATOS:\n');
    
    flows.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Activo: ${flow.activo ? 'Sí' : 'No'}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   Edges: ${flow.edges?.length || 0}`);
      
      if (flow.nodes && flow.nodes.length > 0) {
        console.log(`   Lista de nodos:`);
        flow.nodes.forEach((node, i) => {
          console.log(`      ${i + 1}. ${node.data?.label || node.type} (${node.id})`);
        });
      }
      
      // Buscar específicamente gpt-armar-carrito
      const armarCarrito = flow.nodes?.find(n => n.id === 'gpt-armar-carrito');
      if (armarCarrito) {
        console.log(`   ✅ Nodo gpt-armar-carrito EXISTE en BD`);
      } else {
        console.log(`   ❌ Nodo gpt-armar-carrito NO EXISTE en BD`);
      }
      console.log('');
    });
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarNodosFlujo();
