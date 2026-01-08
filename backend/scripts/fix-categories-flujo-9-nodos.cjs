const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

const flowSchema = new mongoose.Schema({}, { strict: false, collection: 'flows' });
const FlowModel = mongoose.model('Flow', flowSchema);

async function fixCategories() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const flow = await FlowModel.findById(flowId);

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes?.length || 0}\n`);

    // Definir las categorías correctas para cada nodo
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

    console.log('🔧 ACTUALIZANDO CATEGORÍAS:\n');

    flow.nodes.forEach((node, index) => {
      const oldCategory = node.category;
      const newCategory = categoryMap[node.id];
      
      if (newCategory) {
        node.category = newCategory;
        console.log(`${index + 1}. ${node.data?.label || node.id}`);
        console.log(`   ${oldCategory || 'undefined'} → ${newCategory}`);
      } else {
        console.log(`⚠️  ${index + 1}. ${node.id} - No se encontró categoría`);
      }
    });

    // Guardar cambios
    await flow.save();
    
    console.log('\n✅ Categorías actualizadas correctamente');
    
    // Verificar
    console.log('\n🔍 VERIFICACIÓN:\n');
    const triggerNode = flow.nodes.find(n => n.category === 'trigger');
    if (triggerNode) {
      console.log('✅ Nodo trigger encontrado:', triggerNode.id);
    } else {
      console.log('❌ Aún no hay nodo trigger');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixCategories();
