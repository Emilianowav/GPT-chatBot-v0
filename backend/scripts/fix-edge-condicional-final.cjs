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
    
    // 1. Cambiar edge-5 para que SOLO vaya a whatsapp-preguntar si variables_completas = false
    const edge5 = flow.edges.find(e => e.id === 'edge-5');
    if (edge5) {
      edge5.sourceHandle = 'incomplete'; // Handle específico para variables incompletas
      edge5.data = edge5.data || {};
      edge5.data.condition = '{{gpt-pedir-datos.variables_completas}} equals false';
      edge5.data.label = 'Faltan variables';
      console.log('✅ edge-5: Solo va a whatsapp-preguntar si faltan variables');
    }
    
    // 2. Agregar nuevo edge: gpt-pedir-datos → router (cuando variables_completas = true)
    const existeEdgeRouter = flow.edges.find(e => 
      e.source === 'gpt-pedir-datos' && e.target === 'router' && e.id === 'edge-pedir-router-completo'
    );
    
    if (!existeEdgeRouter) {
      const edgeRouter = {
        id: 'edge-pedir-router-completo',
        source: 'gpt-pedir-datos',
        target: 'router',
        sourceHandle: 'complete', // Handle específico para variables completas
        type: 'default',
        animated: false,
        data: {
          label: 'Variables completas → Re-evaluar',
          condition: '{{gpt-pedir-datos.variables_completas}} equals true'
        }
      };
      
      flow.edges.push(edgeRouter);
      console.log('✅ Nuevo edge: gpt-pedir-datos → router (cuando variables completas)');
    }
    
    // 3. Actualizar gpt-pedir-datos para NO enviar mensaje de confirmación
    const gptPedir = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    if (gptPedir) {
      gptPedir.data.config.systemPrompt = `El usuario está buscando un libro pero falta información.

Variables que debes extraer:
- editorial: Si el usuario dice "cualquiera", "no importa", "la que sea", etc., extrae "cualquiera"
- edicion: Si el usuario dice "cualquiera", "no importa", "la que sea", etc., extrae "cualquiera"
- titulo: Si menciona un título

IMPORTANTE:
- Si el usuario responde con "cualquiera" o similar, SIEMPRE extrae ese valor para la variable que falta
- NO confirmes ni resumas las variables
- NO preguntes si necesita algo más
- SOLO extrae las variables en silencio
- Si faltan variables, pregunta específicamente por lo que falta

Ejemplo: "¿De qué editorial lo necesitás? 📚"`;
      
      console.log('✅ gpt-pedir-datos: Actualizado para NO enviar confirmación');
    }
    
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n📋 FLUJO CORREGIDO:');
    console.log('   Cuando gpt-pedir-datos completa las variables:');
    console.log('   → variables_completas = true');
    console.log('   → Edge: gpt-pedir-datos → router');
    console.log('   → Router evalúa: variables_faltantes = []');
    console.log('   → route-2 → WooCommerce ✅');
    console.log('');
    console.log('   Cuando gpt-pedir-datos NO completa las variables:');
    console.log('   → variables_completas = false');
    console.log('   → Edge: gpt-pedir-datos → whatsapp-preguntar');
    console.log('   → Envía mensaje preguntando por lo que falta');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
