const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixWhatsAppResultadosCondicional() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 Flujo encontrado:', flow.nombre);
    console.log('   Nodos:', flow.nodes.length);
    console.log('   Edges:', flow.edges.length);

    // Encontrar el nodo whatsapp-resultados
    const whatsappResultadosNode = flow.nodes.find(n => n.id === 'whatsapp-resultados');
    
    if (!whatsappResultadosNode) {
      console.log('❌ Nodo whatsapp-resultados no encontrado');
      return;
    }

    console.log('\n📝 Nodo whatsapp-resultados encontrado');
    console.log('   Tipo:', whatsappResultadosNode.type);

    // OPCIÓN 1: Agregar un router ANTES de whatsapp-resultados
    // que solo envíe el mensaje si hay productos

    // Crear nuevo nodo router
    const routerProductosNode = {
      id: 'router-productos',
      type: 'router',
      position: { x: 800, y: 400 },
      data: {
        label: 'Router Productos',
        config: {
          routes: [
            {
              id: 'con-productos',
              label: 'Con Productos',
              condition: '{{woocommerce-search.count}} > 0'
            },
            {
              id: 'sin-productos',
              label: 'Sin Productos',
              condition: 'true'
            }
          ]
        }
      }
    };

    // Crear nodo WhatsApp para cuando NO hay productos
    const whatsappSinProductosNode = {
      id: 'whatsapp-sin-productos',
      type: 'whatsapp',
      position: { x: 1000, y: 500 },
      data: {
        label: 'WhatsApp Sin Productos',
        config: {
          module: 'send-message',
          mensaje: 'Lo siento, no encontré productos para "{{titulo_libro}}". ¿Podrías darme más detalles o intentar con otro título? 📚'
        }
      }
    };

    // Buscar el edge que va de woocommerce-search a whatsapp-resultados
    const edgeWooToWhatsapp = flow.edges.find(e => 
      e.source === 'woocommerce-search' && e.target === 'whatsapp-resultados'
    );

    if (!edgeWooToWhatsapp) {
      console.log('❌ Edge woocommerce-search -> whatsapp-resultados no encontrado');
      return;
    }

    console.log('\n🔧 Modificando flujo...');

    // 1. Cambiar el edge para que vaya al router
    edgeWooToWhatsapp.target = 'router-productos';

    // 2. Crear edge del router a whatsapp-resultados (con productos)
    const edgeRouterToWhatsappResultados = {
      id: 'router-productos-whatsapp-resultados',
      source: 'router-productos',
      target: 'whatsapp-resultados',
      sourceHandle: 'con-productos',
      type: 'default',
      data: {
        mapping: {
          to: '1.from'
        }
      }
    };

    // 3. Crear edge del router a whatsapp-sin-productos (sin productos)
    const edgeRouterToWhatsappSinProductos = {
      id: 'router-productos-whatsapp-sin-productos',
      source: 'router-productos',
      target: 'whatsapp-sin-productos',
      sourceHandle: 'sin-productos',
      type: 'default',
      data: {
        mapping: {
          to: '1.from'
        }
      }
    };

    // Agregar nodos
    flow.nodes.push(routerProductosNode);
    flow.nodes.push(whatsappSinProductosNode);

    // Agregar edges
    flow.edges.push(edgeRouterToWhatsappResultados);
    flow.edges.push(edgeRouterToWhatsappSinProductos);

    console.log('   ✅ Router agregado');
    console.log('   ✅ Nodo WhatsApp sin productos agregado');
    console.log('   ✅ Edges actualizados');

    // Actualizar en MongoDB
    const resultado = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges
        } 
      }
    );

    if (resultado.modifiedCount > 0) {
      console.log('\n✅ FLUJO ACTUALIZADO EXITOSAMENTE');
      console.log('   Nodos totales:', flow.nodes.length);
      console.log('   Edges totales:', flow.edges.length);
      console.log('\n📋 CAMBIOS:');
      console.log('   1. Router agregado después de WooCommerce');
      console.log('   2. Si hay productos (count > 0) → whatsapp-resultados');
      console.log('   3. Si NO hay productos → whatsapp-sin-productos');
    } else {
      console.log('\n⚠️  No se realizaron cambios');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWhatsAppResultadosCondicional();
