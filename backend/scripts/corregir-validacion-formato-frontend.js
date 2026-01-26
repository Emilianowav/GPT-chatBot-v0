import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function corregirValidacionFormatoFrontend() {
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
    
    console.log('\n🔧 Corrigiendo formato de validación para el frontend...\n');
    
    const edgePago = flow.edges.find(e => e.source === 'router-carrito' && e.target === 'mercadopago-crear-preference');
    
    if (!edgePago) {
      console.log('❌ Edge hacia mercadopago-crear-preference no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    // Crear el array conditions en el formato que el frontend espera
    const conditions = [
      {
        id: '1',
        variable: '{{accion_siguiente}}',
        variableLabel: 'accion_siguiente',
        operator: 'equals',
        value: "'pagar'"
      },
      {
        id: '2',
        variable: '{{carrito_items_count}}',
        variableLabel: 'carrito_items_count',
        operator: 'greater_than',
        value: '0'
      }
    ];
    
    // Actualizar el edge con el formato correcto
    edgePago.data.conditions = conditions;
    
    console.log('📝 Formato anterior:');
    console.log('   Solo tenía: data.condition (string)');
    
    console.log('\n📝 Formato nuevo:');
    console.log('   data.condition (string): Para el backend');
    console.log('   data.conditions (array): Para el frontend');
    
    console.log('\n✅ Array conditions creado:');
    console.log(JSON.stringify(conditions, null, 2));
    
    // También actualizar la ruta en el router
    const routerCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    
    if (routerCarrito) {
      const rutaPago = routerCarrito.data.config.routes.find(r => r.label === '✅ Hay Items - Ir a Pago');
      
      if (rutaPago) {
        rutaPago.conditions = conditions;
        console.log('\n✅ Array conditions también agregado a la ruta del router');
      }
    }
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: flow._id },
      { $set: { edges: flow.edges, nodes: flow.nodes } }
    );
    
    console.log('\n✅ Validación corregida exitosamente');
    console.log('\n📋 Ahora:');
    console.log('   ✅ Backend puede evaluar la condición (string)');
    console.log('   ✅ Frontend puede mostrar/editar la validación (array)');
    console.log('   ✅ Si editás el flujo en el frontend, NO se perderá la validación');
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirValidacionFormatoFrontend();
