require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixFormateadorStructure() {
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
    
    // Actualizar el nodo GPT Formateador con estructura correcta
    const updatedNodes = flow.nodes.map(node => {
      if (node.id === 'gpt-formateador') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              configuracionExtraccion: {
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
                fuenteDatos: 'historial_completo',
                cantidadMensajes: 10,
                formatoSalida: {
                  tipo: 'json',
                  estructura: '{ "titulo": string, "editorial": string | null, "edicion": string | null }',
                  ejemplo: '{ "titulo": "Harry Potter 3", "editorial": "Salamandra", "edicion": "2020" }'
                },
                camposEsperados: [
                  {
                    nombre: 'titulo',
                    descripcion: 'Título del libro que busca el cliente',
                    tipoDato: 'string',
                    requerido: true,
                    valorPorDefecto: null
                  },
                  {
                    nombre: 'editorial',
                    descripcion: 'Editorial del libro',
                    tipoDato: 'string',
                    requerido: false,
                    valorPorDefecto: null
                  },
                  {
                    nombre: 'edicion',
                    descripcion: 'Edición del libro',
                    tipoDato: 'string',
                    requerido: false,
                    valorPorDefecto: null
                  }
                ]
              }
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
    
    console.log('✅ GPT Formateador actualizado correctamente\n');
    console.log('📋 Configuración aplicada:');
    console.log('  ✓ Instrucciones de extracción: Completas');
    console.log('  ✓ Fuente de datos: historial_completo');
    console.log('  ✓ Formato salida: { tipo: json, estructura, ejemplo }');
    console.log('  ✓ Campos esperados: 3 campos con estructura completa');
    console.log('\n✅ Ahora el frontend podrá mostrar la configuración correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateadorStructure();
