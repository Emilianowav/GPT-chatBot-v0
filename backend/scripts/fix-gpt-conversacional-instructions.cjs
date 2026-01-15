require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixGPTConversacionalInstructions() {
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
    
    // Actualizar el nodo GPT Conversacional
    const updatedNodes = flow.nodes.map(node => {
      if (node.id === 'gpt-conversacional') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              instrucciones: `Eres un asistente de ventas de Veo Veo Libros, una librería especializada en libros de inglés.

INFORMACIÓN ESTÁTICA (siempre disponible):
- Especialidad: Libros en inglés
- Formas de pago: Efectivo, transferencia, tarjeta de crédito/débito
- Envíos: A todo el país
- Consultas: WhatsApp, email, tienda física

TU MISIÓN:
Ayudar al cliente a encontrar libros recopilando la siguiente información en este orden:

1. TÍTULO del libro (obligatorio)
2. EDITORIAL (opcional pero recomendado)
3. EDICIÓN (opcional pero recomendado)

IMPORTANTE:
- Si el cliente ya mencionó el título, NO vuelvas a preguntarlo
- Pregunta de manera natural y amigable por la editorial y edición
- Si el cliente no sabe la editorial o edición, está bien, puedes buscar solo con el título
- NO pidas fotografías de libros, solo información por escrito
- Sé conversacional y amigable, no uses formato de formulario

EJEMPLOS:
Cliente: "Quiero harry potter 3"
Tú: "¡Perfecto! ¿Sabes de qué editorial es el libro que buscas? Y si recuerdas la edición, también me ayudaría mucho para encontrarlo."

Cliente: "Busco El Principito"
Tú: "¡Excelente elección! Para ayudarte mejor, ¿podrías decirme la editorial y la edición que estás buscando? Si no los recuerdas, no hay problema, buscaré con el título."`,
              personalidad: 'Eres amigable, profesional y conocedor de libros en inglés. Ayudas a los clientes de manera conversacional, no como un formulario.',
              topicos: ['libros', 'búsqueda de libros', 'recopilación de datos', 'atención al cliente'],
              variablesRecopilar: [
                {
                  nombre: 'titulo',
                  descripcion: 'Título del libro que busca el cliente',
                  obligatorio: true,
                  tipo: 'texto'
                },
                {
                  nombre: 'editorial',
                  descripcion: 'Editorial del libro',
                  obligatorio: false,
                  tipo: 'texto'
                },
                {
                  nombre: 'edicion',
                  descripcion: 'Edición del libro',
                  obligatorio: false,
                  tipo: 'texto'
                }
              ]
            }
          }
        };
      }
      
      if (node.id === 'gpt-formateador') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              configuracionExtraccion: {
                fuenteDatos: 'historial_completo',
                instruccionesExtraccion: `Analiza el historial de conversación y extrae la información de búsqueda del cliente.

CAMPOS A EXTRAER:
1. "titulo": Título del libro mencionado por el cliente (OBLIGATORIO)
2. "editorial": Editorial del libro si fue mencionada (OPCIONAL)
3. "edicion": Edición del libro si fue mencionada (OPCIONAL)

REGLAS:
- Si el cliente mencionó el título, extráelo aunque no sea exacto
- Si no mencionó editorial o edición, deja esos campos como null
- NO inventes información que el cliente no proporcionó
- Devuelve SOLO el JSON, sin texto adicional

FORMATO DE SALIDA:
{
  "titulo": "título mencionado por el cliente o null",
  "editorial": "editorial mencionada o null",
  "edicion": "edición mencionada o null"
}`,
                formatoSalida: 'json',
                camposEsperados: ['titulo', 'editorial', 'edicion']
              },
              variablesRecopilar: [
                {
                  nombre: 'titulo',
                  descripcion: 'Título del libro',
                  obligatorio: true,
                  tipo: 'texto'
                },
                {
                  nombre: 'editorial',
                  descripcion: 'Editorial del libro',
                  obligatorio: false,
                  tipo: 'texto'
                },
                {
                  nombre: 'edicion',
                  descripcion: 'Edición del libro',
                  obligatorio: false,
                  tipo: 'texto'
                }
              ]
            }
          }
        };
      }
      
      if (node.id === 'router') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              routes: [
                {
                  id: 'route-1',
                  label: 'Faltan datos',
                  condition: '{{titulo}} not exists',
                  descripcion: 'Si no se extrajo el título del libro'
                },
                {
                  id: 'route-2',
                  label: 'Datos completos',
                  condition: '{{titulo}} exists',
                  descripcion: 'Si ya tenemos al menos el título para buscar'
                }
              ]
            }
          }
        };
      }
      
      if (node.id === 'gpt-pedir-datos') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              instrucciones: `El cliente no ha especificado el título del libro que busca.

CONTEXTO:
- Título: {{titulo}}
- Editorial: {{editorial}}
- Edición: {{edicion}}

TU TAREA:
Pregunta de manera amable y específica qué libro está buscando. Pide el título del libro.

IMPORTANTE:
- Sé amigable y conversacional
- NO pidas fotografías, solo información por escrito
- Si ya tiene el título, pregunta por editorial y edición de manera opcional

EJEMPLO:
"¡Hola! Para ayudarte a encontrar el libro que buscas, ¿podrías decirme el título? Y si recuerdas la editorial y edición, también me ayudaría mucho 😊"`
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
    
    console.log('✅ Nodos actualizados correctamente\n');
    console.log('📋 Cambios aplicados:');
    console.log('  1. GPT Conversacional:');
    console.log('     ✓ Instrucciones actualizadas para recopilar: título, editorial, edición');
    console.log('     ✓ Información estática incluida (libros en inglés, formas de pago)');
    console.log('     ✓ Comportamiento conversacional, no formulario');
    console.log('\n  2. GPT Formateador:');
    console.log('     ✓ Extrae: titulo, editorial, edicion del historial');
    console.log('     ✓ Formato JSON con campos opcionales');
    console.log('\n  3. Router:');
    console.log('     ✓ Evalúa si existe "titulo" (no "busqueda")');
    console.log('\n  4. GPT Pedir Datos:');
    console.log('     ✓ Pregunta por título si falta');
    console.log('     ✓ Usa contexto de variables para saber qué falta');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGPTConversacionalInstructions();
