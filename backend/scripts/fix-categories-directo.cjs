const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function fixCategoriesDirecto() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    // 1. Obtener el flujo actual
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(flowId) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes?.length || 0}\n`);

    // 2. Definir las categorías correctas
    const categoryMap = {
      'whatsapp-trigger': 'trigger',
      'gpt-conversacional': 'processor',
      'gpt-formateador': 'processor',
      'validador-datos': 'processor',
      'whatsapp-solicitar-datos': 'action',
      'router-validacion': 'processor',
      'woocommerce-search': 'action',
      'whatsapp-resultados': 'action',
      'whatsapp-sin-busqueda': 'action'
    };

    // 3. Actualizar cada nodo
    console.log('🔧 ACTUALIZANDO CATEGORÍAS:\n');
    
    const updatedNodes = flow.nodes.map((node, index) => {
      const newCategory = categoryMap[node.id];
      
      if (newCategory) {
        console.log(`${index + 1}. ${node.data?.label || node.id}`);
        console.log(`   ${node.category || 'undefined'} → ${newCategory}`);
        return { ...node, category: newCategory };
      } else {
        console.log(`⚠️  ${index + 1}. ${node.id} - No se encontró categoría`);
        return node;
      }
    });

    // 4. Actualizar directamente en la BD
    const result = await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(flowId) },
      { $set: { nodes: updatedNodes } }
    );

    console.log(`\n📝 Resultado de la actualización:`);
    console.log(`   Matched: ${result.matchedCount}`);
    console.log(`   Modified: ${result.modifiedCount}`);

    if (result.modifiedCount > 0) {
      console.log('\n✅ Categorías actualizadas correctamente en la BD');
    } else {
      console.log('\n⚠️  No se modificó ningún documento');
    }

    // 5. Verificar
    console.log('\n🔍 VERIFICACIÓN:\n');
    const flowActualizado = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(flowId) });
    
    const triggerNode = flowActualizado.nodes.find(n => n.category === 'trigger');
    const processorNodes = flowActualizado.nodes.filter(n => n.category === 'processor');
    const actionNodes = flowActualizado.nodes.filter(n => n.category === 'action');
    const sinCategory = flowActualizado.nodes.filter(n => !n.category);

    console.log(`   ⚡ Triggers: ${triggerNode ? 1 : 0}`);
    console.log(`   ⚙️  Processors: ${processorNodes.length}`);
    console.log(`   📤 Actions: ${actionNodes.length}`);
    console.log(`   ❓ Sin category: ${sinCategory.length}`);

    if (triggerNode) {
      console.log(`\n✅ Nodo trigger encontrado: ${triggerNode.id}`);
    } else {
      console.log('\n❌ Aún no hay nodo trigger');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixCategoriesDirecto();
