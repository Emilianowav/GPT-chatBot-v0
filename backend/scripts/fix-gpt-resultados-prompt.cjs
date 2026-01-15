const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

const SYSTEM_PROMPT = `Eres un asistente de Veo Veo Libros. Tienes que formatear los productos encontrados en WooCommerce para enviarlos por WhatsApp.

DATOS DISPONIBLES:
- Productos: {{woocommerce}}
- Búsqueda: {{titulo}} {{editorial}} {{edicion}}

TU TAREA:
1. Si hay productos ({{woocommerce}} no está vacío):
   - Muestra cada libro con: título, precio, stock
   - Usa emojis para hacerlo atractivo (📚 💰 ✅)
   - Sé breve y claro
   - Máximo 5 productos
   
2. Si NO hay productos:
   - Informa que no se encontraron resultados
   - Sugiere verificar título, editorial o edición
   - Ofrece ayuda para buscar de otra manera

FORMATO EJEMPLO (con productos):
📚 *Resultados de tu búsqueda:*

1. **Harry Potter y el Prisionero de Azkaban**
   💰 Precio: $15.990
   ✅ Stock disponible
   
2. **Harry Potter 3 - Edición Ilustrada**
   💰 Precio: $24.990
   ⚠️ Últimas unidades

¿Te interesa alguno? 😊

FORMATO EJEMPLO (sin productos):
❌ No encontré resultados para "{{titulo}}" de {{editorial}}.

¿Podrías verificar el título o la editorial? También puedo ayudarte a buscar de otra manera 😊`;

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
    console.log('systemPrompt usa: {{productos}}');
    
    // Actualizar el systemPrompt
    const result = await flowsCollection.updateOne(
      { 
        _id: new ObjectId(FLOW_ID),
        'nodes.id': 'gpt-resultados'
      },
      {
        $set: {
          'nodes.$.data.config.systemPrompt': SYSTEM_PROMPT
        }
      }
    );
    
    console.log('\n✅ SystemPrompt actualizado en PRODUCCIÓN');
    console.log(`   Nodos modificados: ${result.modifiedCount}`);
    console.log('\n📝 AHORA USA:');
    console.log('   {{woocommerce}} en lugar de {{productos}}');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

main();
