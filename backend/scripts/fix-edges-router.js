import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixEdgesRouter() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ WooCommerce Flow no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('🔧 FIX EDGES DEL ROUTER PRINCIPAL');
    console.log('═'.repeat(80));
    
    // Actualizar router config con rutas correctas
    const routerIndex = wooFlow.nodes.findIndex(n => n.id === 'router-principal');
    
    if (routerIndex !== -1) {
      wooFlow.nodes[routerIndex].data.config = {
        variable: 'tipo_accion',
        routes: [
          {
            condition: 'equals',
            value: 'buscar_producto',
            label: '🔍 Buscar Producto'
          },
          {
            condition: 'equals',
            value: 'agregar_carrito',
            label: '🛒 Agregar al Carrito'
          },
          {
            condition: 'equals',
            value: 'finalizar_compra',
            label: '💳 Finalizar Compra'
          },
          {
            condition: 'equals',
            value: 'ver_carrito',
            label: '👁️ Ver Carrito'
          },
          {
            condition: 'equals',
            value: 'consulta_general',
            label: '💬 Consulta General'
          }
        ]
      };
      
      console.log('\n✅ Router config actualizado');
    }
    
    // Actualizar edges
    console.log('\n📤 Actualizando edges...');
    
    // Edge: buscar_producto → gpt-formateador
    const edgeBuscar = wooFlow.edges.findIndex(e => 
      e.source === 'router-principal' && e.target === 'gpt-formateador'
    );
    if (edgeBuscar !== -1) {
      wooFlow.edges[edgeBuscar].sourceHandle = 'buscar_producto';
      console.log('   ✅ Edge buscar_producto → gpt-formateador');
    }
    
    // Edge: agregar_carrito → gpt-armar-carrito
    const edgeAgregar = wooFlow.edges.findIndex(e => 
      e.source === 'router-principal' && e.target === 'gpt-armar-carrito'
    );
    if (edgeAgregar !== -1) {
      wooFlow.edges[edgeAgregar].sourceHandle = 'agregar_carrito';
      wooFlow.edges[edgeAgregar].data = { label: '🛒 Agregar al Carrito' };
      console.log('   ✅ Edge agregar_carrito → gpt-armar-carrito');
    } else {
      // Crear edge si no existe
      wooFlow.edges.push({
        id: 'edge-router-agregar-carrito',
        source: 'router-principal',
        target: 'gpt-armar-carrito',
        sourceHandle: 'agregar_carrito',
        targetHandle: null,
        type: 'default',
        data: { label: '🛒 Agregar al Carrito' }
      });
      console.log('   ✅ Edge agregar_carrito → gpt-armar-carrito (CREADO)');
    }
    
    // Edge: finalizar_compra → gpt-armar-carrito (puede ser el mismo target)
    const edgeFinalizar = wooFlow.edges.find(e => 
      e.source === 'router-principal' && 
      e.sourceHandle === 'finalizar_compra'
    );
    if (!edgeFinalizar) {
      wooFlow.edges.push({
        id: 'edge-router-finalizar-compra',
        source: 'router-principal',
        target: 'gpt-armar-carrito',
        sourceHandle: 'finalizar_compra',
        targetHandle: null,
        type: 'default',
        data: { label: '💳 Finalizar Compra' }
      });
      console.log('   ✅ Edge finalizar_compra → gpt-armar-carrito (CREADO)');
    }
    
    // Guardar cambios
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
    console.log('📋 RESUMEN DE FIXES');
    console.log('═'.repeat(80));
    
    console.log('\n✅ COMPLETADO:');
    console.log('1. Clasificador: Detecta números como "agregar_carrito"');
    console.log('2. Router config: Rutas con valores correctos');
    console.log('3. Edges: sourceHandle actualizado según tipo_accion');
    console.log('4. WooCommerce: Guarda productos_formateados (ya estaba)');
    console.log('5. GPT Armar Carrito: Simplificado para usar estructura existente');
    console.log('6. MercadoPago: Config completo con titulo y notificationUrl');
    
    console.log('\n📋 FLUJO COMPLETO CORREGIDO:');
    console.log('\n1. "Busco Harry Potter"');
    console.log('   → Clasificador: tipo_accion = "buscar_producto"');
    console.log('   → Router: sourceHandle = "buscar_producto"');
    console.log('   → gpt-formateador → router → WooCommerce');
    console.log('   → Guarda productos_formateados');
    console.log('   → gpt-asistente-ventas: Presenta productos');
    
    console.log('\n2. "4 y 5 quiero"');
    console.log('   → Clasificador: tipo_accion = "agregar_carrito"');
    console.log('   → Router: sourceHandle = "agregar_carrito"');
    console.log('   → gpt-armar-carrito: Extrae productos 4 y 5');
    console.log('   → Actualiza carrito_items, carrito_total');
    console.log('   → gpt-asistente-ventas: Confirma');
    
    console.log('\n3. "Como pago?"');
    console.log('   → Clasificador: tipo_accion = "finalizar_compra"');
    console.log('   → Router: sourceHandle = "finalizar_compra"');
    console.log('   → gpt-armar-carrito: Procesa carrito');
    console.log('   → router-carrito → MercadoPago');
    console.log('   → Genera link de pago');
    
    console.log('\n⚠️  REINICIAR BACKEND para aplicar cambios');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixEdgesRouter();
