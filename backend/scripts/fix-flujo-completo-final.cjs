const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function fixFlujoCompletoFinal() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(flowId) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('🔧 CORRIGIENDO FLUJO COMPLETO\n');
    console.log('═'.repeat(60));

    // 1. FIX: GPT FORMATEADOR - Agregar variablesRecopilar
    console.log('\n1️⃣ GPT FORMATEADOR: Agregando variablesRecopilar\n');
    
    const gptFormIndex = flow.nodes.findIndex(n => n.id === 'gpt-formateador');
    if (gptFormIndex !== -1) {
      flow.nodes[gptFormIndex].data.config.variablesRecopilar = [
        {
          nombre: 'titulo_libro',
          descripcion: 'Título del libro que busca el usuario',
          tipo: 'string',
          obligatorio: false
        },
        {
          nombre: 'editorial',
          descripcion: 'Editorial del libro',
          tipo: 'string',
          obligatorio: false
        },
        {
          nombre: 'edicion',
          descripcion: 'Edición del libro',
          tipo: 'string',
          obligatorio: false
        }
      ];
      
      console.log('   ✅ variablesRecopilar agregadas');
      console.log('      - titulo_libro');
      console.log('      - editorial');
      console.log('      - edicion');
    }

    // 2. FIX: WOOCOMMERCE - Corregir orderBy
    console.log('\n2️⃣ WOOCOMMERCE: Corrigiendo orderBy\n');
    
    const wooIndex = flow.nodes.findIndex(n => n.id === 'woocommerce-search');
    if (wooIndex !== -1) {
      flow.nodes[wooIndex].data.config.params.orderBy = 'title'; // Cambiar de 'relevance' a 'title'
      
      console.log('   ✅ orderBy cambiado de "relevance" a "title"');
      console.log('   ✅ params.search sigue siendo "{{titulo_libro}}"');
    }

    // 3. FIX: ROUTERS - Cambiar conditions a routes
    console.log('\n3️⃣ ROUTERS: Cambiando conditions a routes\n');
    
    const validadorIndex = flow.nodes.findIndex(n => n.id === 'validador-datos');
    if (validadorIndex !== -1) {
      const conditions = flow.nodes[validadorIndex].data.config.conditions;
      flow.nodes[validadorIndex].data.config.routes = conditions;
      
      console.log('   ✅ Validador: conditions → routes');
    }

    const routerIndex = flow.nodes.findIndex(n => n.id === 'router-validacion');
    if (routerIndex !== -1) {
      const conditions = flow.nodes[routerIndex].data.config.conditions;
      flow.nodes[routerIndex].data.config.routes = conditions;
      
      console.log('   ✅ Router: conditions → routes');
    }

    // 4. GUARDAR CAMBIOS
    console.log('\n💾 Guardando cambios...\n');
    
    const result = await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(flowId) },
      { $set: { nodes: flow.nodes } }
    );

    console.log(`   Matched: ${result.matchedCount}`);
    console.log(`   Modified: ${result.modifiedCount}`);

    if (result.modifiedCount > 0) {
      console.log('\n✅ FLUJO CORREGIDO EXITOSAMENTE\n');
      console.log('═'.repeat(60));
      console.log('📋 CAMBIOS APLICADOS:\n');
      console.log('1. ✅ GPT Formateador: variablesRecopilar agregadas');
      console.log('2. ✅ WooCommerce: orderBy = "title"');
      console.log('3. ✅ Routers: conditions → routes');
      console.log('');
      console.log('🧪 TESTEA AHORA:');
      console.log('   1. "Hola" → Debería responder con contexto');
      console.log('   2. "Busco Harry Potter" → Debería extraer titulo_libro');
      console.log('   3. WooCommerce debería buscar con ese título');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixFlujoCompletoFinal();
