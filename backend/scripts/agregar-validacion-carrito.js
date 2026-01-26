import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function agregarValidacionCarrito() {
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
    
    const routerCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    
    if (!routerCarrito) {
      console.log('❌ router-carrito no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n🔧 Actualizando condiciones del router-carrito...\n');
    
    // Actualizar la condición de la ruta "Ir a Pago"
    const rutaPago = routerCarrito.data.config.routes.find(r => r.label === '✅ Hay Items - Ir a Pago');
    
    if (rutaPago) {
      console.log('📝 Condición anterior:', rutaPago.condition);
      
      // Nueva condición: accion_siguiente = 'pagar' Y carrito_items_count > 0
      rutaPago.condition = "{{accion_siguiente}} equals 'pagar' AND {{carrito_items_count}} greater_than 0";
      
      console.log('📝 Condición nueva:', rutaPago.condition);
    }
    
    // También actualizar el edge correspondiente
    const edgePago = flow.edges.find(e => e.source === 'router-carrito' && e.target === 'mercadopago-crear-preference');
    
    if (edgePago && edgePago.data) {
      console.log('\n🔗 Actualizando edge hacia mercadopago-crear-preference...');
      console.log('📝 Condición anterior:', edgePago.data.condition);
      
      edgePago.data.condition = "{{accion_siguiente}} equals 'pagar' AND {{carrito_items_count}} greater_than 0";
      
      console.log('📝 Condición nueva:', edgePago.data.condition);
    }
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: flow._id },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n✅ Validación agregada exitosamente');
    console.log('\n📋 Ahora el flujo solo irá a pago si:');
    console.log('   1. accion_siguiente = "pagar"');
    console.log('   2. carrito_items_count > 0 (hay productos en el carrito)');
    console.log('\n🚫 Si el carrito está vacío, NO irá a crear el link de pago');
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

agregarValidacionCarrito();
