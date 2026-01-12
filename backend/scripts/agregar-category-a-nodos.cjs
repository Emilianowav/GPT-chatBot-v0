const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * AGREGAR PROPIEDAD 'category' A LOS NODOS
 * 
 * FlowExecutor busca: n.category === 'trigger'
 * En lugar de cambiar el backend, agregamos la propiedad 'category' a los nodos en MongoDB
 * 
 * Categorías:
 * - trigger: Nodos que inician el flujo (webhook)
 * - action: Nodos que ejecutan acciones (whatsapp, woocommerce, mercadopago)
 * - processing: Nodos que procesan datos (gpt, router)
 */

async function agregarCategories() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🏷️  AGREGANDO CATEGORÍAS A LOS NODOS\n');
    console.log('═'.repeat(80));
    
    // Mapeo de tipos a categorías
    const typeToCategory = {
      'webhook': 'trigger',
      'whatsapp': 'action',
      'woocommerce': 'action',
      'mercadopago': 'action',
      'gpt': 'processing',
      'router': 'processing'
    };
    
    let cambios = 0;
    
    flow.nodes.forEach(node => {
      const category = typeToCategory[node.type];
      
      if (category) {
        const categoriaAnterior = node.category;
        node.category = category;
        
        if (categoriaAnterior !== category) {
          console.log(`✏️  ${node.id}:`);
          console.log(`   type: ${node.type}`);
          console.log(`   category: ${categoriaAnterior || 'undefined'} → ${category}`);
          cambios++;
        }
      } else {
        console.log(`⚠️  ${node.id}: tipo '${node.type}' sin categoría definida`);
      }
    });
    
    console.log(`\n📊 ${cambios} nodos actualizados`);
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Categorías guardadas en MongoDB');
    
    // Verificación
    console.log('\n🔍 VERIFICACIÓN:\n');
    const triggerNode = flow.nodes.find(n => n.category === 'trigger');
    if (triggerNode) {
      console.log(`✅ Nodo trigger encontrado: ${triggerNode.id} (${triggerNode.type})`);
    } else {
      console.log('❌ No se encontró nodo trigger');
    }
    
    console.log('\n📋 Resumen por categoría:\n');
    const categoryCounts = {};
    flow.nodes.forEach(node => {
      const cat = node.category || 'sin_categoria';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} nodos`);
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

agregarCategories();
