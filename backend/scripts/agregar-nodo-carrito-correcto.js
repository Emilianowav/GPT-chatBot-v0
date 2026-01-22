import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function agregarNodoCarritoCorrecto() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Agregando nodo de tipo "carrito" según documentación...\n');
    
    // Crear nodo carrito según docs/RESUMEN-CARRITO-MERCADOPAGO.md
    const nodoCarrito = {
      id: 'carrito-agregar',
      type: 'carrito',
      data: {
        label: 'Agregar al Carrito',
        config: {
          action: 'agregar',
          itemFields: {
            id: '{{productos_presentados[{{mensaje_usuario}} - 1].id}}',
            nombre: '{{productos_presentados[{{mensaje_usuario}} - 1].titulo}}',
            precio: '{{productos_presentados[{{mensaje_usuario}} - 1].precio}}',
            cantidad: 1,
            imagen: '{{productos_presentados[{{mensaje_usuario}} - 1].imagen}}',
            metadata: {
              permalink: '{{productos_presentados[{{mensaje_usuario}} - 1].url}}'
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
    
    // Agregar nodo
    wooFlow.nodes.push(nodoCarrito);
    console.log('✅ Nodo "carrito-agregar" creado (tipo: carrito)');
    
    // Buscar edge de router-principal a gpt-armar-carrito (agregar_carrito)
    const edgeIndex = wooFlow.edges.findIndex(e => 
      e.source === 'router-principal' && 
      e.target === 'gpt-armar-carrito' &&
      e.data?.label === '🛒 Agregar al Carrito'
    );
    
    if (edgeIndex === -1) {
      console.log('❌ No se encontró edge de router-principal a gpt-armar-carrito');
      return;
    }
    
    // Redirigir edge a carrito-agregar
    wooFlow.edges[edgeIndex].target = 'carrito-agregar';
    console.log('✅ Edge redirigido: router-principal → carrito-agregar');
    
    // Crear edge de carrito-agregar a gpt-armar-carrito
    const nuevoEdge = {
      id: `carrito-agregar-to-gpt-armar-carrito`,
      source: 'carrito-agregar',
      target: 'gpt-armar-carrito',
      sourceHandle: 'b',
      targetHandle: 'a',
      type: 'smoothstep',
      animated: false
    };
    
    wooFlow.edges.push(nuevoEdge);
    console.log('✅ Edge creado: carrito-agregar → gpt-armar-carrito');
    
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
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ NODO CARRITO AGREGADO CORRECTAMENTE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 FLUJO ACTUALIZADO:');
    console.log('   router-principal (agregar_carrito)');
    console.log('     ↓');
    console.log('   carrito-agregar (tipo: carrito, action: agregar)');
    console.log('     ↓ Guarda carrito_items y carrito_total en BD y variables globales');
    console.log('   gpt-armar-carrito (GPT confirma)');
    console.log('     ↓');
    console.log('   router-carrito');
    console.log('     ↓');
    console.log('   mercadopago-crear-preference (usa carrito_items y carrito_total)\n');
    
    console.log('✅ El nodo ejecutará CarritoService.agregarProducto()');
    console.log('✅ Guardará automáticamente las variables globales necesarias');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

agregarNodoCarritoCorrecto();
