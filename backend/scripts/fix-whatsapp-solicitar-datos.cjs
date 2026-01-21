/**
 * Script para configurar el nodo whatsapp-solicitar-datos
 * Este nodo debe buscar productos cuando el usuario pide algo que no está en el carrito
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function configurarNodoSolicitarDatos() {
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
    
    // Buscar el nodo whatsapp-solicitar-datos
    const nodoIndex = flow.nodes.findIndex(n => n.id === 'whatsapp-solicitar-datos');
    
    if (nodoIndex === -1) {
      throw new Error('❌ Nodo whatsapp-solicitar-datos no encontrado');
    }
    
    console.log('\n📝 Configurando nodo whatsapp-solicitar-datos...\n');
    
    // El nodo debe redirigir al flujo de búsqueda
    // En lugar de solicitar datos, debe buscar los productos que el usuario pidió
    flow.nodes[nodoIndex] = {
      id: 'whatsapp-solicitar-datos',
      type: 'whatsapp',
      position: flow.nodes[nodoIndex].position,
      data: {
        label: 'WhatsApp Buscar Productos',
        config: {
          action: 'send_message',
          message: '🔍 Perfecto, déjame buscar eso para vos...',
          to: '{{1.from}}'
        }
      }
    };
    
    console.log('✅ Nodo whatsapp-solicitar-datos configurado');
    
    // Ahora necesitamos agregar un edge desde whatsapp-solicitar-datos al nodo de búsqueda
    // Primero, buscar si existe el nodo de búsqueda WooCommerce
    const nodoBusqueda = flow.nodes.find(n => 
      n.id === 'woocommerce-buscar-producto' || 
      n.type === 'api' && n.data?.config?.endpointId === 'buscar-producto'
    );
    
    if (nodoBusqueda) {
      console.log(`✅ Nodo de búsqueda encontrado: ${nodoBusqueda.id}`);
      
      // Verificar si ya existe el edge
      const edgeExiste = flow.edges.some(e => 
        e.source === 'whatsapp-solicitar-datos' && e.target === nodoBusqueda.id
      );
      
      if (!edgeExiste) {
        // Agregar edge desde whatsapp-solicitar-datos a búsqueda
        flow.edges.push({
          id: `edge-solicitar-busqueda`,
          source: 'whatsapp-solicitar-datos',
          target: nodoBusqueda.id,
          type: 'smoothstep',
          animated: true
        });
        
        console.log(`✅ Edge agregado: whatsapp-solicitar-datos → ${nodoBusqueda.id}`);
      } else {
        console.log('ℹ️  Edge ya existe');
      }
    } else {
      console.log('⚠️  No se encontró nodo de búsqueda WooCommerce');
      console.log('   El nodo enviará mensaje pero no continuará el flujo');
    }
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Flujo actualizado en BD');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CAMBIOS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Nodo whatsapp-solicitar-datos configurado');
    console.log('   - Mensaje: "🔍 Perfecto, déjame buscar eso para vos..."');
    console.log('   - Acción: send_message');
    if (nodoBusqueda) {
      console.log(`   - Conectado a: ${nodoBusqueda.id}`);
    }
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
configurarNodoSolicitarDatos()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
