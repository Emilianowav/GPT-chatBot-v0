require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixTopicosStructure() {
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
    
    // Actualizar el nodo GPT Conversacional con tópicos estructurados
    const updatedNodes = flow.nodes.map(node => {
      if (node.id === 'gpt-conversacional') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              topicos: [
                {
                  id: 'topico-1',
                  titulo: 'Especialidad en Libros de Inglés',
                  contenido: 'Veo Veo Libros es una librería especializada en libros en inglés. Ofrecemos una amplia variedad de títulos, desde clásicos hasta novedades.',
                  keywords: ['libros', 'inglés', 'especialidad', 'variedad']
                },
                {
                  id: 'topico-2',
                  titulo: 'Formas de Pago',
                  contenido: 'Aceptamos efectivo, transferencia bancaria, tarjeta de crédito y débito. Ofrecemos facilidades de pago para compras mayores.',
                  keywords: ['pago', 'efectivo', 'transferencia', 'tarjeta']
                },
                {
                  id: 'topico-3',
                  titulo: 'Envíos',
                  contenido: 'Realizamos envíos a todo el país. El costo y tiempo de entrega dependen de la ubicación. Envíos gratis en compras mayores a $50000.',
                  keywords: ['envíos', 'entrega', 'país', 'gratis']
                },
                {
                  id: 'topico-4',
                  titulo: 'Búsqueda de Libros',
                  contenido: 'Para buscar un libro necesitamos: Título (obligatorio), Editorial (opcional), Edición (opcional). No aceptamos fotografías, solo información por escrito.',
                  keywords: ['búsqueda', 'título', 'editorial', 'edición']
                }
              ]
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
    
    console.log('✅ Tópicos actualizados correctamente\n');
    console.log('📋 Tópicos configurados:');
    console.log('  1. Especialidad en Libros de Inglés');
    console.log('  2. Formas de Pago');
    console.log('  3. Envíos');
    console.log('  4. Búsqueda de Libros');
    console.log('\n✅ Ahora el frontend podrá mostrar los tópicos correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixTopicosStructure();
