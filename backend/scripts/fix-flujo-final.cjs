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
    
    // 1. Actualizar edge-5: gpt-pedir-datos → whatsapp-preguntar
    //    Solo si variables_completas = false (faltan variables)
    const edge5 = flow.edges.find(e => e.id === 'edge-5');
    if (edge5) {
      edge5.data = edge5.data || {};
      edge5.data.condition = '{{gpt-pedir-datos.variables_completas}} equals false';
      edge5.data.label = 'Faltan variables';
      console.log('✅ edge-5: gpt-pedir-datos → whatsapp-preguntar (solo si faltan variables)');
    }
    
    // 2. Agregar nuevo edge: gpt-pedir-datos → gpt-formateador
    //    Solo si variables_completas = true (tiene todas las variables)
    const existeEdge = flow.edges.find(e => 
      e.source === 'gpt-pedir-datos' && e.target === 'gpt-formateador'
    );
    
    if (!existeEdge) {
      const nuevoEdge = {
        id: 'edge-pedir-formateador',
        source: 'gpt-pedir-datos',
        target: 'gpt-formateador',
        type: 'default',
        animated: false,
        data: {
          label: 'Variables completas',
          condition: '{{gpt-pedir-datos.variables_completas}} equals true'
        }
      };
      
      flow.edges.push(nuevoEdge);
      console.log('✅ Nuevo edge: gpt-pedir-datos → gpt-formateador (cuando tiene todas las variables)');
    }
    
    await collection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('\n📋 FLUJO CORREGIDO:');
    console.log('   1. Usuario: "harry potter 5"');
    console.log('      → gpt-conversacional: titulo="Harry Potter 5"');
    console.log('      → router: faltan editorial/edicion → route-1');
    console.log('      → gpt-pedir-datos: pregunta por editorial/edicion');
    console.log('      → variables_completas = false');
    console.log('      → whatsapp-preguntar: envía mensaje');
    console.log('');
    console.log('   2. Usuario: "cualquiera"');
    console.log('      → gpt-pedir-datos: extrae editorial="cualquiera", edicion="cualquiera"');
    console.log('      → variables_completas = true ✅');
    console.log('      → gpt-formateador: arma consulta');
    console.log('      → router: variables_faltantes = []');
    console.log('      → route-2 → WooCommerce ✅');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fix();
