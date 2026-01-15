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
    
    // 1. gpt-conversacional: Recopilar TÍTULO, EDITORIAL y EDICIÓN (todos obligatorios)
    const gptConv = flow.nodes.find(n => n.id === 'gpt-conversacional');
    if (gptConv) {
      gptConv.data.config.variablesRecopilar = [
        {
          nombre: 'titulo',
          descripcion: 'Título del libro que busca el cliente',
          obligatorio: true,
          tipo: 'texto',
          ejemplos: ['Harry Potter', 'Matemática 3', 'Don Quijote']
        },
        {
          nombre: 'editorial',
          descripcion: 'Editorial del libro',
          obligatorio: true,
          tipo: 'texto',
          ejemplos: ['Santillana', 'Salamandra', 'Estrada']
        },
        {
          nombre: 'edicion',
          descripcion: 'Edición o año del libro',
          obligatorio: true,
          tipo: 'texto',
          ejemplos: ['2023', 'última edición', 'nueva edición']
        }
      ];
      
      gptConv.data.config.systemPrompt = `Eres el asistente virtual de **Librería Veo Veo** 📚✏️

Características de tu personalidad:
- Tono amigable, profesional y entusiasta
- Usas emojis para hacer la conversación más cálida
- Eres paciente y comprensivo con errores de ortografía
- Siempre saludas con energía positiva

IMPORTANTE:
- Si el usuario saluda sin mencionar un libro, pregunta QUÉ libro está buscando
- Si menciona un libro, extrae: título, editorial y edición
- Si falta algún dato, pregunta específicamente por lo que falta
- Sé breve y directo`;
      
      console.log('✅ gpt-conversacional: Recopila TÍTULO, EDITORIAL y EDICIÓN (todos obligatorios)');
    }
    
    // 2. gpt-pedir-datos: Pedir lo que falte
    const gptPedir = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    if (gptPedir) {
      gptPedir.data.config.systemPrompt = `El usuario está buscando un libro pero falta información.

IMPORTANTE:
- Pregunta específicamente por lo que falta (título, editorial o edición)
- Sé breve y directo
- Mantén un tono amigable

Ejemplo: "¿De qué editorial lo necesitás? 📚"`;
      
      gptPedir.data.config.variablesRecopilar = [
        {
          nombre: 'titulo',
          descripcion: 'Título del libro',
          obligatorio: false,
          tipo: 'texto',
          ejemplos: ['Harry Potter']
        },
        {
          nombre: 'editorial',
          descripcion: 'Editorial del libro',
          obligatorio: false,
          tipo: 'texto',
          ejemplos: ['Santillana', 'Salamandra']
        },
        {
          nombre: 'edicion',
          descripcion: 'Edición del libro',
          obligatorio: false,
          tipo: 'texto',
          ejemplos: ['2023', 'última']
        }
      ];
      
      console.log('✅ gpt-pedir-datos: Pide lo que falte');
    }
    
    // 3. Router: Solo ir a WooCommerce si tiene TODO
    const routeEdge2 = flow.edges.find(e => e.source === 'router' && e.target === 'woocommerce');
    if (routeEdge2) {
      routeEdge2.data = routeEdge2.data || {};
      routeEdge2.data.condition = '{{gpt-conversacional.variables_faltantes}} empty';
      routeEdge2.data.label = 'Tiene todo';
      console.log('✅ route-2: Solo va a WooCommerce si tiene TÍTULO, EDITORIAL y EDICIÓN');
    }
    
    // Guardar cambios
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n✅ FLUJO CORREGIDO');
    console.log('\n📋 LÓGICA:');
    console.log('   1. Usuario envía mensaje → Extrae título, editorial, edición');
    console.log('   2. Router: ¿Tiene TODO?');
    console.log('      ├─ NO → route-1 → Pedir lo que falta');
    console.log('      └─ SÍ → route-2 → WooCommerce');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
