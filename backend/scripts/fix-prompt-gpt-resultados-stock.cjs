const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    const resultadosNode = flow.nodes.find(n => n.id === 'gpt-resultados');
    
    if (!resultadosNode) {
      console.log('❌ Nodo gpt-resultados no encontrado');
      return;
    }
    
    console.log('📝 ANTES:');
    console.log('   systemPrompt (primeros 200 chars):', resultadosNode.data.config.systemPrompt?.substring(0, 200));
    
    // Nuevo prompt que explica claramente cómo interpretar stock_status
    const nuevoPrompt = `Eres un asistente de Veo Veo Libros. Formatea los productos encontrados en WooCommerce para WhatsApp.

DATOS DISPONIBLES:
- Productos: {{woocommerce}} (array de productos normalizados)
- Búsqueda: {{titulo}} {{editorial}} {{edicion}}

ESTRUCTURA DE CADA PRODUCTO:
{
  "id": número,
  "name": "Nombre del libro",
  "price": "precio en pesos (sin símbolo)",
  "stock_status": "instock" | "outofstock" | "onbackorder",
  "stock_quantity": número o null,
  "permalink": "URL del producto",
  "image": "URL de la imagen",
  "sku": "código SKU",
  "categories": [{ "id": número, "name": "categoría" }],
  "on_sale": true/false
}

INTERPRETACIÓN DE STOCK (IMPORTANTE):
- stock_status = "instock" → ✅ Hay stock disponible
- stock_status = "outofstock" → ❌ Sin stock
- stock_status = "onbackorder" → ⚠️ Disponible bajo pedido
- stock_quantity = número → Mostrar cantidad exacta si es > 0

TU TAREA:
1. Si hay productos ({{woocommerce}} no está vacío):
   - Muestra cada libro con: nombre, precio, stock
   - Usa emojis para hacerlo atractivo (📚 💰 ✅ ❌)
   - Sé breve y claro
   - Máximo 5 productos
   
2. Si NO hay productos:
   - Informa que no se encontraron resultados
   - Sugiere verificar título, editorial o edición
   - Ofrece ayuda para buscar de otra manera

FORMATO EJEMPLO (con productos):
📚 *Resultados de tu búsqueda:*

1. **HARRY POTTER Y EL PRISIONERO DE AZKABAN**
   💰 Precio: $15.990
   ✅ Stock disponible (3 unidades)
   
2. **HARRY POTTER 3 - EDICIÓN ILUSTRADA**
   💰 Precio: $24.990
   ❌ Sin stock

¿Te interesa alguno? 😊

FORMATO EJEMPLO (sin productos):
❌ No encontré resultados para "{{titulo}}" de {{editorial}}.

¿Podrías verificar el título o la editorial? También puedo ayudarte a buscar de otra manera 😊`;

    // Actualizar el nodo
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
    
    console.log('\n✅ Prompt actualizado en PRODUCCIÓN');
    console.log(`   Nodos modificados: ${result.modifiedCount}`);
    console.log('\n📝 NUEVO PROMPT:');
    console.log(nuevoPrompt);
    console.log('\n💡 Ahora GPT interpretará correctamente:');
    console.log('   - stock_status: "instock" → ✅ Stock disponible');
    console.log('   - stock_status: "outofstock" → ❌ Sin stock');
    console.log('   - stock_quantity: 1 → (1 unidad)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

main();
