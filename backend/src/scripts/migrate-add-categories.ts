import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const flowSchema = new mongoose.Schema({}, { strict: false, collection: 'flows' });
const FlowModel = mongoose.model('Flow', flowSchema);

async function migrateCategories() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGODB_URI no está definida');
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const flow = await FlowModel.findById(flowId) as any;

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes?.length || 0}\n`);

    // Definir las categorías correctas para cada nodo
    const categoryMap: Record<string, string> = {
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

    let updated = 0;
    flow.nodes.forEach((node: any, index: number) => {
      const oldCategory = node.category;
      const newCategory = categoryMap[node.id];
      
      if (newCategory) {
        node.category = newCategory;
        console.log(`${index + 1}. ${node.data?.label || node.id}`);
        console.log(`   ${oldCategory || 'undefined'} → ${newCategory}`);
        updated++;
      } else {
        console.log(`⚠️  ${index + 1}. ${node.id} - No se encontró categoría`);
      }
    });

    if (updated > 0) {
      // Guardar cambios
      await flow.save();
      console.log(`\n✅ ${updated} categorías actualizadas correctamente`);
    } else {
      console.log('\n⚠️  No se actualizó ninguna categoría');
    }
    
    // Verificar
    console.log('\n🔍 VERIFICACIÓN:\n');
    const triggerNode = flow.nodes.find((n: any) => n.category === 'trigger');
    if (triggerNode) {
      console.log('✅ Nodo trigger encontrado:', triggerNode.id);
    } else {
      console.log('❌ Aún no hay nodo trigger');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

migrateCategories();
