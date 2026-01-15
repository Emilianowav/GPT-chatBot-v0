const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixGPTAsistente() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('📊 FLOW:', flow.nombre);
    console.log('═══════════════════════════════════════\n');
    
    // Buscar nodo gpt-asistente-ventas
    const gptAsistente = flow.nodes.find(n => n.id === 'gpt-asistente-ventas');
    
    if (!gptAsistente) {
      console.log('❌ Nodo gpt-asistente-ventas no encontrado');
      return;
    }
    
    console.log('🔧 ACTUALIZANDO GPT ASISTENTE:\n');
    
    const nuevoPrompt = `Eres un asistente de ventas para una librería.

PRODUCTOS ENCONTRADOS:
{{woocommerce.productos}}

TU TAREA:
1. Presenta los productos encontrados de forma atractiva y profesional
2. Para cada producto muestra:
   - Título (name)
   - Precio (price)
   - Descripción breve (short_description o description)
   - Stock disponible (stock_quantity)
3. Si no hay productos, informa amablemente que no se encontraron resultados
4. Pregunta al usuario qué desea hacer:
   - Buscar más productos
   - Agregar alguno al carrito
   - Finalizar la compra

IMPORTANTE:
- USA SOLO los productos que están en la variable {{woocommerce.productos}}
- NO inventes productos que no existen
- Si la lista está vacía, di que no se encontraron resultados
- Sé amable y profesional`;

    console.log('Prompt anterior:');
    console.log(gptAsistente.data.config.systemPrompt || 'Sin prompt');
    console.log('\n---\n');
    console.log('Prompt nuevo:');
    console.log(nuevoPrompt);
    console.log('\n');
    
    // Actualizar el prompt y tipo
    gptAsistente.data.config.systemPrompt = nuevoPrompt;
    gptAsistente.data.config.tipo = 'conversacional';
    gptAsistente.data.config.modelo = 'gpt-4';
    
    // Guardar cambios
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ GPT Asistente actualizado correctamente\n');
      console.log('📋 COMPORTAMIENTO ESPERADO:');
      console.log('   1. WooCommerce busca productos en la BD');
      console.log('   2. Devuelve array de productos reales');
      console.log('   3. GPT Asistente recibe {{woocommerce.productos}}');
      console.log('   4. Presenta SOLO los productos reales encontrados');
      console.log('   5. NO inventa productos ficticios');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGPTAsistente();
