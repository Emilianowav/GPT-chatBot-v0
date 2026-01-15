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
    
    // 1. CONFIGURAR gpt-conversacional: Solo pedir TÍTULO
    const gptConv = flow.nodes.find(n => n.id === 'gpt-conversacional');
    if (gptConv) {
      gptConv.data.config.systemPrompt = `Eres el asistente virtual de **Librería Veo Veo** 📚✏️

Características de tu personalidad:
- Tono amigable, profesional y entusiasta
- Usas emojis para hacer la conversación más cálida
- Eres paciente y comprensivo con errores de ortografía
- Siempre saludas con energía positiva

IMPORTANTE:
- Si el usuario saluda sin mencionar un libro, pregunta QUÉ libro está buscando (título)
- Si menciona un libro, extrae el título
- Sé breve y directo`;
      
      // Solo recopilar TÍTULO como obligatorio
      gptConv.data.config.variablesRecopilar = [
        {
          nombre: 'titulo',
          descripcion: 'Título del libro que busca el cliente',
          obligatorio: true,
          tipo: 'texto',
          ejemplos: ['Harry Potter', 'Matemática 3', 'Don Quijote']
        }
      ];
      
      console.log('✅ gpt-conversacional: Solo pide TÍTULO (obligatorio)');
    }
    
    // 2. CONFIGURAR gpt-pedir-datos: Pedir editorial/edición (opcional)
    const gptPedir = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    if (gptPedir) {
      gptPedir.data.config.systemPrompt = `El usuario está buscando un libro pero podemos mejorar la búsqueda.

IMPORTANTE:
- Pregunta si tiene preferencia de editorial o edición
- Dale la opción de decir "cualquiera" o "no importa"
- Sé breve y directo
- Explica que esto ayuda a encontrar el libro exacto

Ejemplo: "¿Tenés alguna preferencia de editorial o edición? Si no, puedo buscar todas las opciones disponibles 📚"`;
      
      gptPedir.data.config.variablesRecopilar = [
        {
          nombre: 'editorial',
          descripcion: 'Editorial del libro (opcional)',
          obligatorio: false,
          tipo: 'texto',
          ejemplos: ['Santillana', 'Salamandra', 'cualquiera']
        },
        {
          nombre: 'edicion',
          descripcion: 'Edición del libro (opcional)',
          obligatorio: false,
          tipo: 'texto',
          ejemplos: ['2023', 'última', 'cualquiera']
        }
      ];
      
      console.log('✅ gpt-pedir-datos: Pide editorial/edición (opcional)');
    }
    
    // 3. CAMBIAR condición del router
    // route-1: Si falta TÍTULO → pedir datos
    // route-2: Si tiene TÍTULO → ir a WooCommerce (con o sin editorial/edición)
    
    const routeEdge1 = flow.edges.find(e => e.id === 'edge-4');
    if (routeEdge1) {
      routeEdge1.data = routeEdge1.data || {};
      routeEdge1.data.condition = '{{gpt-conversacional.variables_faltantes}} not_empty';
      routeEdge1.data.label = 'Falta título';
      console.log('✅ route-1: Falta título → pedir datos');
    }
    
    const routeEdge2 = flow.edges.find(e => e.source === 'router' && e.target === 'woocommerce');
    if (routeEdge2) {
      routeEdge2.data = routeEdge2.data || {};
      routeEdge2.data.condition = '{{gpt-conversacional.variables_faltantes}} empty';
      routeEdge2.data.label = 'Tiene título';
      routeEdge2.sourceHandle = 'route-2';
      console.log('✅ route-2: Tiene título → WooCommerce');
    }
    
    // Guardar cambios
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n✅ FLUJO CORREGIDO');
    console.log('\n📋 LÓGICA:');
    console.log('   1. Usuario saluda → Pide TÍTULO');
    console.log('   2. Usuario da título → Extrae título');
    console.log('   3. Router: ¿Tiene título?');
    console.log('      ├─ NO → route-1 → Pedir título');
    console.log('      └─ SÍ → route-2 → WooCommerce (busca con lo que tenga)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
