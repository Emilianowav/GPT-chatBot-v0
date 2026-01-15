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
    
    console.log('📋 EDGES ACTUALES DESDE gpt-pedir-datos:');
    const edgesActuales = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    edgesActuales.forEach(e => {
      console.log(`   ${e.id}: ${e.source} → ${e.target}`);
      if (e.data?.condition) console.log(`      Condición: ${e.data.condition}`);
    });
    console.log('');
    
    // Verificar si existe el edge a router
    const existeEdgeRouter = flow.edges.find(e => 
      e.source === 'gpt-pedir-datos' && e.target === 'router'
    );
    
    if (existeEdgeRouter) {
      console.log('✅ Ya existe edge: gpt-pedir-datos → router');
      console.log(`   ID: ${existeEdgeRouter.id}`);
      console.log(`   Condición: ${existeEdgeRouter.data?.condition || 'SIN CONDICIÓN'}`);
      return;
    }
    
    console.log('⚠️  NO EXISTE edge: gpt-pedir-datos → router');
    console.log('📝 Agregando edge...\n');
    
    // Agregar edge: gpt-pedir-datos → router (cuando variables_completas = true)
    const nuevoEdge = {
      id: 'edge-pedir-router-completo',
      source: 'gpt-pedir-datos',
      target: 'router',
      sourceHandle: 'complete',
      type: 'default',
      animated: false,
      data: {
        label: 'Variables completas',
        condition: '{{gpt-pedir-datos.variables_completas}} equals true'
      }
    };
    
    flow.edges.push(nuevoEdge);
    
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('✅ Edge agregado exitosamente\n');
    
    console.log('📋 EDGES FINALES DESDE gpt-pedir-datos:');
    const edgesFinales = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
    edgesFinales.forEach(e => {
      console.log(`   ${e.id}: ${e.source} → ${e.target}`);
      if (e.data?.condition) console.log(`      Condición: ${e.data.condition}`);
    });
    
    console.log('\n🔄 FLUJO ESPERADO:');
    console.log('   Si variables_completas = false:');
    console.log('      → edge-5 → whatsapp-preguntar');
    console.log('');
    console.log('   Si variables_completas = true:');
    console.log('      → edge-pedir-router-completo → router → WooCommerce');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
