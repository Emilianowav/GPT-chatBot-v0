const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fix() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const collection = db.collection('flows');
    
    const flow = await collection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    // Actualizar gpt-pedir-datos para que extraiga "cualquiera" como valor válido
    const gptPedir = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    if (gptPedir) {
      gptPedir.data.config.systemPrompt = `El usuario está buscando un libro pero falta información.

Variables que debes extraer:
- editorial: Si el usuario dice "cualquiera", "no importa", "la que sea", etc., extrae "cualquiera"
- edicion: Si el usuario dice "cualquiera", "no importa", "la que sea", etc., extrae "cualquiera"
- titulo: Si menciona un título

IMPORTANTE:
- Si el usuario responde con "cualquiera" o similar, SIEMPRE extrae ese valor para la variable que falta
- Pregunta específicamente por lo que falta
- Sé breve y directo
- Mantén un tono amigable

Ejemplo: "¿De qué editorial lo necesitás? 📚"`;
      
      gptPedir.data.config.variablesRecopilar = [
        {
          nombre: 'titulo',
          descripcion: 'Título del libro',
          obligatorio: false,
          tipo: 'texto',
          ejemplos: ['Harry Potter', 'Matemática 3']
        },
        {
          nombre: 'editorial',
          descripcion: 'Editorial del libro. Si dice "cualquiera" o "no importa", extraer "cualquiera"',
          obligatorio: false,
          tipo: 'texto',
          ejemplos: ['Santillana', 'Salamandra', 'cualquiera', 'no importa']
        },
        {
          nombre: 'edicion',
          descripcion: 'Edición del libro. Si dice "cualquiera" o "no importa", extraer "cualquiera"',
          obligatorio: false,
          tipo: 'texto',
          ejemplos: ['2023', 'última', 'cualquiera', 'no importa']
        }
      ];
      
      console.log('✅ gpt-pedir-datos: Configurado para extraer "cualquiera" como valor válido');
    }
    
    // Guardar cambios
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ CONFIGURACIÓN ACTUALIZADA');
    console.log('\n📋 Ahora cuando el usuario diga "cualquiera":');
    console.log('   → Se extraerá como valor para editorial/edición');
    console.log('   → variables_faltantes quedará vacío');
    console.log('   → Router irá a WooCommerce');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
