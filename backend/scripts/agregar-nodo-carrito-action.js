import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function agregarNodoCarritoAction() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═'.repeat(80));
    console.log('🔧 AGREGAR NODO CARRITO-ACTION AL FLUJO');
    console.log('═'.repeat(80));
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    // Verificar si ya existe un nodo carrito-action
    const nodoCarritoExistente = wooFlow.nodes.find(n => n.type === 'carrito-action');
    
    if (nodoCarritoExistente) {
      console.log('✅ Ya existe un nodo carrito-action:', nodoCarritoExistente.id);
      console.log('\n📋 Configuración actual:');
      console.log(JSON.stringify(nodoCarritoExistente.data.config, null, 2));
      return;
    }
    
    console.log('\n📋 Creando nuevo nodo carrito-action...\n');
    
    // Crear nodo carrito-action
    const nuevoNodo = {
      id: 'carrito-agregar-producto',
      type: 'carrito-action',
      data: {
        label: 'Carrito - Agregar Producto',
        config: {
          action: 'agregar',
          itemFields: {
            id: '{{woocommerce.productos[{{mensaje_usuario}} - 1].id}}',
            nombre: '{{woocommerce.productos[{{mensaje_usuario}} - 1].name}}',
            precio: '{{woocommerce.productos[{{mensaje_usuario}} - 1].price}}',
            cantidad: 1,
            imagen: '{{woocommerce.productos[{{mensaje_usuario}} - 1].images[0].src}}',
            metadata: {
              permalink: '{{woocommerce.productos[{{mensaje_usuario}} - 1].permalink}}'
            }
          }
        },
        hasConnection: true,
        color: '#f59e0b'
      },
      position: {
        x: 525,
        y: 150
      },
      width: 80,
      height: 80
    };
    
    // Agregar nodo al flujo
    wooFlow.nodes.push(nuevoNodo);
    
    console.log('✅ Nodo creado:', nuevoNodo.id);
    
    // Buscar edge desde router-principal a gpt-armar-carrito (agregar_carrito)
    const edgeIndex = wooFlow.edges.findIndex(e => 
      e.source === 'router-principal' && 
      e.target === 'gpt-armar-carrito' &&
      e.data?.label === '🛒 Agregar al Carrito'
    );
    
    if (edgeIndex === -1) {
      console.log('❌ No se encontró edge de router-principal a gpt-armar-carrito');
      return;
    }
    
    console.log('\n🔗 Redirigiendo edge de router-principal...');
    console.log(`   Antes: router-principal → gpt-armar-carrito`);
    console.log(`   Después: router-principal → carrito-agregar-producto`);
    
    // Cambiar target del edge
    wooFlow.edges[edgeIndex].target = 'carrito-agregar-producto';
    
    // Crear edge desde carrito-agregar-producto a gpt-armar-carrito
    const nuevoEdge = {
      id: `${nuevoNodo.id}-to-gpt-armar-carrito`,
      source: nuevoNodo.id,
      target: 'gpt-armar-carrito',
      sourceHandle: 'b',
      targetHandle: 'a',
      type: 'smoothstep',
      animated: false
    };
    
    wooFlow.edges.push(nuevoEdge);
    
    console.log('✅ Edge creado: carrito-agregar-producto → gpt-armar-carrito');
    
    console.log('\n💾 Guardando cambios...');
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          edges: wooFlow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    console.log(`   Modified count: ${result.modifiedCount}`);
    
    console.log('\n═'.repeat(80));
    console.log('✅ NODO CARRITO-ACTION AGREGADO');
    console.log('═'.repeat(80));
    
    console.log('\n📋 FLUJO ACTUALIZADO:');
    console.log('   router-principal → carrito-agregar-producto (NUEVO)');
    console.log('   carrito-agregar-producto → gpt-armar-carrito');
    console.log('   gpt-armar-carrito → router-carrito');
    console.log('   router-carrito → mercadopago-crear-preference');
    
    console.log('\n✅ El nodo carrito-action guardará automáticamente:');
    console.log('   - carrito_items');
    console.log('   - carrito_total');
    console.log('   - carrito_items_count');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

agregarNodoCarritoAction();
