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
    
    // Verificar si ya existe el edge
    const existeEdge = flow.edges.find(e => 
      e.source === 'gpt-pedir-datos' && e.target === 'router'
    );
    
    if (existeEdge) {
      console.log('⚠️  El edge ya existe');
      return;
    }
    
    // Agregar edge condicional: gpt-pedir-datos → router (cuando variables_completas = true)
    const nuevoEdge = {
      id: 'edge-pedir-datos-router',
      source: 'gpt-pedir-datos',
      target: 'router',
      type: 'default',
      animated: false,
      data: {
        label: 'Variables completas',
        condition: '{{gpt-pedir-datos.variables_completas}} equals true'
      }
    };
    
    flow.edges.push(nuevoEdge);
    
    // Actualizar edge existente gpt-pedir-datos → whatsapp-preguntar
    // para que solo se ejecute cuando variables_completas = false
    const edgeWhatsapp = flow.edges.find(e => e.id === 'edge-5');
    if (edgeWhatsapp) {
      edgeWhatsapp.data = edgeWhatsapp.data || {};
      edgeWhatsapp.data.condition = '{{gpt-pedir-datos.variables_completas}} equals false';
      edgeWhatsapp.data.label = 'Faltan variables';
      console.log('✅ Edge actualizado: gpt-pedir-datos → whatsapp-preguntar (solo si faltan variables)');
    }
    
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('✅ Edge agregado: gpt-pedir-datos → router (cuando variables completas)\n');
    
    console.log('📋 FLUJO CORREGIDO:');
    console.log('   1. Usuario: "harry potter 5"');
    console.log('      → gpt-conversacional extrae titulo');
    console.log('      → router: faltan editorial/edicion → route-1');
    console.log('      → gpt-pedir-datos pregunta por editorial/edicion');
    console.log('      → whatsapp-preguntar envía mensaje');
    console.log('');
    console.log('   2. Usuario: "cualquiera"');
    console.log('      → gpt-pedir-datos extrae editorial="cualquiera", edicion="cualquiera"');
    console.log('      → variables_completas = true');
    console.log('      → Edge condicional: gpt-pedir-datos → router ✅');
    console.log('      → router evalúa: variables_faltantes = []');
    console.log('      → route-2 → WooCommerce ✅');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
