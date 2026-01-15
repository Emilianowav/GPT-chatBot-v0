const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * CREAR EDGE FALTANTE: route-buscar
 * 
 * router-intencion → woocommerce (cuando usuario quiere buscar más)
 */

async function crearEdgeBuscarMas() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔧 CREANDO EDGE FALTANTE: route-buscar\n');
    console.log('═'.repeat(80));
    
    // Verificar si ya existe
    const existeEdge = flow.edges.find(e => 
      e.source === 'router-intencion' && e.sourceHandle === 'route-buscar'
    );
    
    if (existeEdge) {
      console.log('✅ Edge ya existe:', existeEdge.id);
      
      // Asegurar que tenga la condición
      if (!existeEdge.data) {
        existeEdge.data = {};
      }
      existeEdge.data.condition = '{{gpt-clasificador.respuesta_gpt}} contains buscar_mas';
      
      console.log('   Condición actualizada');
      
    } else {
      // Crear nuevo edge
      const nuevoEdge = {
        id: 'edge-buscar-mas',
        source: 'router-intencion',
        target: 'woocommerce',
        sourceHandle: 'route-buscar',
        type: 'default',
        data: {
          condition: '{{gpt-clasificador.respuesta_gpt}} contains buscar_mas'
        }
      };
      
      flow.edges.push(nuevoEdge);
      
      console.log('✅ Nuevo edge creado:');
      console.log('   ID: edge-buscar-mas');
      console.log('   Source: router-intencion');
      console.log('   Target: woocommerce');
      console.log('   Handle: route-buscar');
      console.log('   Condición: {{gpt-clasificador.respuesta_gpt}} contains buscar_mas');
    }
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('\n✅ Edge guardado en MongoDB\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

crearEdgeBuscarMas();
