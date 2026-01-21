/**
 * Script para corregir los sourceHandle de los edges del router-carrito
 * Los handles deben coincidir con los IDs definidos en config.routes
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function corregirHandles() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 CORRIGIENDO HANDLES DEL ROUTER-CARRITO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar el nodo router-carrito
    const routerCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    
    if (!routerCarrito) {
      console.log('⚠️  Nodo router-carrito no encontrado');
      return;
    }
    
    console.log('📋 ROUTER-CARRITO CONFIG:');
    console.log('Routes:', routerCarrito.data?.config?.routes || 'No routes config');
    console.log('');
    
    // Mapeo de handles antiguos a nuevos
    const handleMapping = {
      'edge-router-mercadopago': 'route-mercadopago',
      'edge-router-verificar': 'route-verificar',
      'edge-router-confirmacion': 'route-confirmacion'
    };
    
    let edgesModificados = 0;
    
    // Corregir edges
    flow.edges.forEach(edge => {
      if (edge.source === 'router-carrito' && edge.sourceHandle) {
        const nuevoHandle = handleMapping[edge.sourceHandle];
        
        if (nuevoHandle) {
          console.log(`🔄 Corrigiendo edge: ${edge.id}`);
          console.log(`   Antes: sourceHandle = "${edge.sourceHandle}"`);
          console.log(`   Después: sourceHandle = "${nuevoHandle}"`);
          
          edge.sourceHandle = nuevoHandle;
          edgesModificados++;
        }
      }
      
      // Cambiar edge type "custom" a "default"
      if (edge.type === 'custom') {
        console.log(`🔄 Cambiando edge type de "custom" a "default": ${edge.id}`);
        edge.type = 'default';
        edgesModificados++;
      }
    });
    
    console.log('');
    
    if (edgesModificados > 0) {
      // Guardar cambios
      await db.collection('flows').updateOne(
        { _id: new ObjectId(FLOW_ID) },
        { 
          $set: { 
            edges: flow.edges,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`✅ ${edgesModificados} edges corregidos`);
    } else {
      console.log('ℹ️  No se encontraron edges para corregir');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total edges modificados: ${edgesModificados}`);
    console.log('');
    console.log('✅ Handles corregidos:');
    Object.entries(handleMapping).forEach(([old, nuevo]) => {
      console.log(`   ${old} → ${nuevo}`);
    });
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
corregirHandles()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
