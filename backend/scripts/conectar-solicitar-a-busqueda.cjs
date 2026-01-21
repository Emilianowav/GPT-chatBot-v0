/**
 * Script para conectar whatsapp-solicitar-datos al nodo de búsqueda WooCommerce
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function conectarSolicitarABusqueda() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    // Obtener el flujo
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('✅ Flujo encontrado:', flow.name);
    console.log(`📊 Nodos: ${flow.nodes.length}`);
    console.log(`📊 Edges: ${flow.edges.length}\n`);
    
    // Listar todos los nodos para encontrar el de búsqueda
    console.log('📋 NODOS DISPONIBLES:');
    flow.nodes.forEach(node => {
      console.log(`   - ${node.id} (${node.type})`);
      if (node.data?.config?.endpointId) {
        console.log(`     → endpointId: ${node.data.config.endpointId}`);
      }
    });
    
    // Buscar nodo de búsqueda WooCommerce
    const nodoBusqueda = flow.nodes.find(n => 
      n.id.includes('buscar') || 
      n.id.includes('woocommerce') ||
      (n.type === 'api' && n.data?.config?.endpointId?.includes('buscar'))
    );
    
    if (!nodoBusqueda) {
      console.log('\n⚠️  No se encontró nodo de búsqueda WooCommerce');
      console.log('   Necesitas crear un nodo de búsqueda primero');
      return;
    }
    
    console.log(`\n✅ Nodo de búsqueda encontrado: ${nodoBusqueda.id}`);
    
    // Verificar si ya existe el edge
    const edgeExiste = flow.edges.find(e => 
      e.source === 'whatsapp-solicitar-datos' && e.target === nodoBusqueda.id
    );
    
    if (edgeExiste) {
      console.log('ℹ️  Edge ya existe:', edgeExiste.id);
      return;
    }
    
    // Agregar edge desde whatsapp-solicitar-datos a búsqueda
    const nuevoEdge = {
      id: `edge-solicitar-${nodoBusqueda.id}`,
      source: 'whatsapp-solicitar-datos',
      target: nodoBusqueda.id,
      type: 'smoothstep',
      animated: true
    };
    
    flow.edges.push(nuevoEdge);
    
    console.log(`✅ Edge agregado: whatsapp-solicitar-datos → ${nodoBusqueda.id}`);
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          edges: flow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Flujo actualizado en BD');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CAMBIOS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Edge agregado: ${nuevoEdge.id}`);
    console.log(`   whatsapp-solicitar-datos → ${nodoBusqueda.id}`);
    console.log('\n🔄 FLUJO ACTUALIZADO:');
    console.log('   1. Usuario pide producto adicional');
    console.log('   2. GPT marca como "consulta"');
    console.log('   3. Router → whatsapp-solicitar-datos');
    console.log('   4. Mensaje: "🔍 Perfecto, déjame buscar eso para vos..."');
    console.log(`   5. Busca en WooCommerce (${nodoBusqueda.id})`);
    console.log('   6. Muestra resultados');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
conectarSolicitarABusqueda()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
