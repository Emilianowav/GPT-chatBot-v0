require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function fixFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    // Buscar el flujo WooCommerce (buscar por cualquier campo)
    const flow = await flowsCollection.findOne({});
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('📊 FLUJO ACTUAL:');
    console.log(`   Nombre: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes?.length || 0}`);
    console.log(`   Edges: ${flow.edges?.length || 0}\n`);
    
    // ELIMINAR edge incorrecto: gpt-pedir-datos → router
    const edgeToRemove = 'edge-pedir-router';
    
    // AGREGAR edge correcto: gpt-pedir-datos → gpt-formateador
    // Esto hace que después de preguntar, vuelva al formateador para re-evaluar
    
    const updatedEdges = flow.edges.filter(e => e.id !== edgeToRemove);
    
    // Agregar nuevo edge
    updatedEdges.push({
      id: 'edge-pedir-formateador',
      source: 'gpt-pedir-datos',
      target: 'gpt-formateador',
      type: 'default',
      data: {
        condition: '{{gpt-pedir-datos.variables_completas}} equals true'
      }
    });
    
    console.log('🔧 CAMBIOS:');
    console.log(`   ❌ Eliminando: ${edgeToRemove} (gpt-pedir-datos → router)`);
    console.log(`   ✅ Agregando: edge-pedir-formateador (gpt-pedir-datos → gpt-formateador)`);
    console.log(`      Condición: {{gpt-pedir-datos.variables_completas}} equals true\n`);
    
    // Actualizar en BD
    const result = await flowsCollection.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          edges: updatedEdges,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Flujo actualizado correctamente\n');
      
      console.log('📋 FLUJO CORRECTO:');
      console.log('   1. webhook-whatsapp → gpt-formateador');
      console.log('   2. gpt-formateador → router');
      console.log('   3. router → gpt-pedir-datos (si faltan variables)');
      console.log('   4. router → woocommerce (si variables completas)');
      console.log('   5. gpt-pedir-datos → whatsapp-preguntar (si faltan)');
      console.log('   6. gpt-pedir-datos → gpt-formateador (si completas) ✅ NUEVO');
      console.log('   7. Vuelve a evaluar desde paso 2\n');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlujo();
