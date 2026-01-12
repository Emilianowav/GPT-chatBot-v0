const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    // NUEVO PROMPT: Datos al final, instrucciones claras
    const nuevoPrompt = `Eres un asistente de Veo Veo Libros. Tu tarea es formatear productos de WooCommerce para WhatsApp.

REGLAS DE INTERPRETACIÓN DE STOCK:
1. Si stock_status = "instock" → El producto TIENE STOCK ✅
2. Si stock_status = "outofstock" → El producto NO tiene stock ❌
3. Si stock_quantity > 0 → Mostrar cantidad exacta

FORMATO DE RESPUESTA:
- Si hay productos: Listar cada uno con nombre, precio y stock
- Si NO hay productos: Informar que no se encontraron resultados
- Usar emojis: 📚 💰 ✅ ❌
- Máximo 5 productos

EJEMPLO (con stock):
📚 *Resultados:*

1. **HARRY POTTER 04**
   💰 Precio: $48.800
   ✅ Stock disponible (1 unidad)

EJEMPLO (sin stock):
📚 *Resultados:*

1. **HARRY POTTER 04**
   💰 Precio: $48.800
   ❌ Sin stock

DATOS DE LA BÚSQUEDA:
- Título: {{titulo}}
- Editorial: {{editorial}}
- Edición: {{edicion}}

PRODUCTOS ENCONTRADOS:
{{woocommerce}}`;

    const result = await flowsCollection.updateOne(
      { 
        _id: new ObjectId(FLOW_ID),
        'nodes.id': 'gpt-resultados'
      },
      {
        $set: {
          'nodes.$.data.config.systemPrompt': nuevoPrompt
        }
      }
    );
    
    console.log('✅ Prompt actualizado');
    console.log(`   Modificados: ${result.modifiedCount}`);
    console.log('\n📝 NUEVO FORMATO:');
    console.log('   - Instrucciones claras al inicio');
    console.log('   - Datos al final (separados)');
    console.log('   - GPT no se confunde con JSON en medio del texto');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
