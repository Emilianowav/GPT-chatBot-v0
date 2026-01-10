require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixGPTFormateadorConfig() {
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
    
    // Actualizar el nodo GPT Formateador
    const updatedNodes = flow.nodes.map(node => {
      if (node.id === 'gpt-formateador') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              // Usar configuracionExtraccion para extracción avanzada
              configuracionExtraccion: {
                fuenteDatos: 'historial_completo',
                instruccionesExtraccion: 'Analiza el historial de conversación y extrae la información de búsqueda del cliente. Devuelve un JSON con: "busqueda" (término de búsqueda principal: título, autor, tema o género que mencionó), "categoria" (si mencionó una categoría específica), "precio_max" (si mencionó un presupuesto máximo). Si no mencionó algo, deja el campo vacío o null.',
                formatoSalida: 'json',
                camposEsperados: ['busqueda', 'categoria', 'precio_max']
              },
              // También mantener variablesRecopilar para compatibilidad
              variablesRecopilar: [
                {
                  nombre: 'busqueda',
                  descripcion: 'Término de búsqueda: título, autor, tema o género',
                  obligatorio: true,
                  tipo: 'texto'
                },
                {
                  nombre: 'categoria',
                  descripcion: 'Categoría de libro si fue mencionada',
                  obligatorio: false,
                  tipo: 'texto'
                },
                {
                  nombre: 'precio_max',
                  descripcion: 'Presupuesto máximo si fue mencionado',
                  obligatorio: false,
                  tipo: 'numero'
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
    
    console.log('✅ Nodo GPT Formateador actualizado correctamente\n');
    console.log('📋 Configuración aplicada:');
    console.log('  ✓ configuracionExtraccion.fuenteDatos: historial_completo');
    console.log('  ✓ configuracionExtraccion.formatoSalida: json');
    console.log('  ✓ configuracionExtraccion.camposEsperados: busqueda, categoria, precio_max');
    console.log('  ✓ variablesRecopilar: 3 variables configuradas');
    console.log('\n✅ El GPT Formateador ahora extraerá variables del historial completo');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGPTFormateadorConfig();
