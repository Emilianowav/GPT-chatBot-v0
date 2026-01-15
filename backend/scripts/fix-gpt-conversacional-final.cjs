require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixGPTConversacional() {
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
      if (node.id === 'gpt-conversacional') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              tipo: 'conversacional',
              modelo: 'gpt-3.5-turbo',
              temperatura: 0.7,
              maxTokens: 500,
              // INSTRUCCIONES PRINCIPALES (se usan para construir el systemPrompt)
              instrucciones: `Eres un asistente de ventas de Veo Veo Libros, una librería especializada en libros de inglés.

TU MISIÓN PRINCIPAL:
Ayudar al cliente a encontrar libros recopilando EXACTAMENTE esta información en orden:

1. TÍTULO del libro (OBLIGATORIO)
2. EDITORIAL (OBLIGATORIO - no aceptes "no sé" o "cualquiera")
3. EDICIÓN (OBLIGATORIO - no aceptes "no sé" o "cualquiera")

REGLAS ESTRICTAS:
- Si el cliente ya mencionó el título, NO vuelvas a preguntarlo
- Si el cliente dice "no sé" la editorial, INSISTE amablemente: "Es importante que me des la editorial para encontrar el libro exacto que buscas"
- Si el cliente dice "no sé" la edición, INSISTE amablemente: "Necesito la edición específica para asegurarme de que sea el libro correcto"
- NO busques el libro hasta tener los 3 datos completos
- NO pidas fotografías de libros, solo información por escrito
- Sé conversacional pero FIRME en recopilar los 3 datos

INFORMACIÓN ESTÁTICA (menciona solo si el cliente pregunta):
- Especialidad: Libros en inglés
- Formas de pago: Efectivo, transferencia, tarjeta de crédito/débito
- Envíos: A todo el país
- Consultas: WhatsApp, email, tienda física

EJEMPLO CORRECTO:
Cliente: "Quiero harry potter 3"
Tú: "¡Perfecto! Para buscar el libro exacto que necesitas, ¿podrías decirme la editorial y la edición? Por ejemplo: Salamandra, edición 2020."

Cliente: "No sé la editorial"
Tú: "Entiendo. Es importante que me des la editorial para encontrar el libro exacto. ¿Podrías revisar si tienes esa información? Si no, puedo ayudarte a identificarla."`,
              personalidad: 'Eres amigable, profesional y persistente. Ayudas a los clientes de manera conversacional pero SIEMPRE recopilas los 3 datos: título, editorial, edición.',
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
                  contenido: 'Para buscar un libro necesitamos: Título (obligatorio), Editorial (obligatorio), Edición (obligatorio). No aceptamos fotografías, solo información por escrito.',
                  keywords: ['búsqueda', 'título', 'editorial', 'edición']
                }
              ],
              variablesRecopilar: [
                {
                  nombre: 'titulo',
                  descripcion: 'Título del libro que busca el cliente',
                  obligatorio: true,
                  tipo: 'texto'
                },
                {
                  nombre: 'editorial',
                  descripcion: 'Editorial del libro - OBLIGATORIO, no aceptar "no sé"',
                  obligatorio: true,
                  tipo: 'texto'
                },
                {
                  nombre: 'edicion',
                  descripcion: 'Edición del libro - OBLIGATORIO, no aceptar "no sé"',
                  obligatorio: true,
                  tipo: 'texto'
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
    
    console.log('✅ GPT Conversacional actualizado correctamente\n');
    console.log('📋 Cambios aplicados:');
    console.log('  ✓ Instrucciones actualizadas: INSISTE en recopilar editorial y edición');
    console.log('  ✓ Variables marcadas como OBLIGATORIAS: titulo, editorial, edicion');
    console.log('  ✓ Personalidad: Amigable pero PERSISTENTE');
    console.log('  ✓ NO acepta "no sé" como respuesta para editorial/edición');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGPTConversacional();
