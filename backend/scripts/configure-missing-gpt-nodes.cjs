require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Configurar nodos GPT que no tienen personalidad/topicos/variables
 * con systemPrompt legacy apropiado
 */

async function configureMissingGPTNodes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    const updatedNodes = flow.nodes.map(node => {
      // GPT Pedir Datos - Pide título si falta
      if (node.id === 'gpt-pedir-datos') {
        console.log('📝 Configurando: gpt-pedir-datos');
        console.log('   Propósito: Pedir título del libro si falta');
        
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              systemPrompt: `Eres un asistente de Veo Veo Libros. El cliente no ha especificado qué libro busca.

CONTEXTO ACTUAL:
- Título: {{titulo}}
- Editorial: {{editorial}}
- Edición: {{edicion}}

TU TAREA:
Pregunta de manera amable qué libro está buscando. Pide el título del libro.

IMPORTANTE:
- Sé breve y directo
- NO pidas fotografías, solo información por escrito
- Si ya tiene el título, pregunta por editorial y edición

EJEMPLO:
"¡Hola! Para ayudarte a encontrar el libro que buscas, ¿podrías decirme el título? 😊"`
            }
          }
        };
      }
      
      // GPT Resultados - Formatea productos de WooCommerce
      if (node.id === 'gpt-resultados') {
        console.log('📝 Configurando: gpt-resultados');
        console.log('   Propósito: Formatear productos de WooCommerce para WhatsApp');
        
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              systemPrompt: `Eres un asistente de Veo Veo Libros. Tienes que formatear los productos encontrados en WooCommerce para enviarlos por WhatsApp.

DATOS DISPONIBLES:
- Productos: {{productos}}
- Búsqueda: {{titulo}} {{editorial}} {{edicion}}

TU TAREA:
1. Si hay productos ({{productos}} no está vacío):
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

¿Podrías verificar el título o la editorial? También puedo ayudarte a buscar de otra manera 😊`
            }
          }
        };
      }
      
      return node;
    });
    
    await flowsCollection.updateOne(
      { _id: flowId },
      { 
        $set: { 
          nodes: updatedNodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Nodos configurados correctamente');
    console.log('\n📋 RESUMEN:');
    console.log('   • gpt-conversacional: Usa personalidad + topicos + variablesRecopilar (desde frontend)');
    console.log('   • gpt-formateador: Usa configuracionExtraccion (desde frontend)');
    console.log('   • gpt-pedir-datos: Usa systemPrompt legacy (configurado)');
    console.log('   • gpt-resultados: Usa systemPrompt legacy (configurado)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configureMissingGPTNodes();
