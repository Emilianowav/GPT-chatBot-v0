import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function revertirYConectarCorrecto() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Revirtiendo conexiones incorrectas...\n');
    
    // 1. Eliminar edge incorrecto de webhook-whatsapp a gpt-carrito
    const indexEdgeIncorrecto = wooFlow.edges.findIndex(e => 
      e.source === 'webhook-whatsapp' && e.target === 'gpt-carrito'
    );
    
    if (indexEdgeIncorrecto !== -1) {
      wooFlow.edges.splice(indexEdgeIncorrecto, 1);
      console.log('✅ Edge incorrecto eliminado: webhook-whatsapp → gpt-carrito');
    }
    
    // 2. Buscar todos los nodos para identificar el webhook de MercadoPago correcto
    console.log('\n📋 NODOS EN EL FLUJO:\n');
    
    wooFlow.nodes.forEach(nodo => {
      if (nodo.type === 'webhook' || nodo.type === 'mercadopago' || 
          nodo.id.toLowerCase().includes('mercado') || 
          nodo.id.toLowerCase().includes('pago') ||
          nodo.data?.label?.toLowerCase().includes('mercado') ||
          nodo.data?.label?.toLowerCase().includes('pago')) {
        console.log(`   ${nodo.id} (${nodo.type})`);
        console.log(`   Label: ${nodo.data?.label || 'Sin label'}`);
        console.log('');
      }
    });
    
    // 3. Buscar el nodo correcto de webhook/verificación de MercadoPago
    const nodoVerificarPago = wooFlow.nodes.find(n => 
      n.id === 'verificar-pago-mp' || 
      n.id === 'webhook-mercadopago' ||
      (n.type === 'webhook' && n.data?.label?.toLowerCase().includes('mercado'))
    );
    
    if (nodoVerificarPago) {
      console.log(`✅ Nodo de verificación/webhook MP encontrado: ${nodoVerificarPago.id}`);
      console.log(`   Tipo: ${nodoVerificarPago.type}`);
      console.log(`   Label: ${nodoVerificarPago.data?.label}`);
      
      // Verificar si ya existe edge de este nodo a gpt-carrito
      const edgeExistente = wooFlow.edges.find(e => 
        e.source === nodoVerificarPago.id && e.target === 'gpt-carrito'
      );
      
      if (!edgeExistente) {
        // Crear edge usando estándar del proyecto
        wooFlow.edges.push({
          id: `${nodoVerificarPago.id}-to-gpt-carrito`,
          source: nodoVerificarPago.id,
          target: 'gpt-carrito',
          sourceHandle: 'b',
          targetHandle: 'a',
          type: 'smoothstep',
          animated: false,
          data: {
            label: '✅ Pago Aprobado'
          }
        });
        console.log(`\n✅ Edge creado: ${nodoVerificarPago.id} → gpt-carrito`);
      } else {
        console.log(`\n   ℹ️  Edge ya existe: ${nodoVerificarPago.id} → gpt-carrito`);
      }
    } else {
      console.log('\n⚠️  No se encontró nodo de webhook/verificación de MercadoPago');
      console.log('   Buscando nodos tipo "payment" o similares...');
      
      const nodosPosibles = wooFlow.nodes.filter(n => 
        n.type === 'payment' || 
        n.id.includes('verificar') ||
        n.data?.label?.toLowerCase().includes('verificar')
      );
      
      if (nodosPosibles.length > 0) {
        console.log('\n   Nodos posibles encontrados:');
        nodosPosibles.forEach(n => {
          console.log(`   - ${n.id} (${n.type}) - ${n.data?.label}`);
        });
      }
    }
    
    // 4. Verificar edge de router-carrito a whatsapp-confirmacion
    const edgeRouterConfirmacion = wooFlow.edges.find(e => 
      e.source === 'router-carrito' && 
      e.target.includes('confirmacion')
    );
    
    if (edgeRouterConfirmacion) {
      console.log(`\n✅ Edge de confirmación encontrado: router-carrito → ${edgeRouterConfirmacion.target}`);
      
      // Asegurar que tenga la condición correcta
      if (!edgeRouterConfirmacion.data) {
        edgeRouterConfirmacion.data = {};
      }
      
      edgeRouterConfirmacion.data.condition = {
        field: 'accion_siguiente',
        operator: 'equals',
        value: 'confirmar_pago'
      };
      
      console.log('   Condición actualizada: accion_siguiente === "confirmar_pago"');
    }
    
    console.log('\n💾 Guardando cambios...');
    
    await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          edges: wooFlow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN DE CONEXIONES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const edgesGPTCarrito = wooFlow.edges.filter(e => e.target === 'gpt-carrito');
    console.log('ENTRADAS A gpt-carrito:');
    edgesGPTCarrito.forEach(e => {
      console.log(`   ${e.source} → gpt-carrito (${e.data?.label || 'sin label'})`);
    });
    
    const edgesRouterCarrito = wooFlow.edges.filter(e => e.source === 'router-carrito');
    console.log('\nSALIDAS DE router-carrito:');
    edgesRouterCarrito.forEach(e => {
      console.log(`   router-carrito → ${e.target} (${e.data?.label || 'sin label'})`);
      if (e.data?.condition) {
        console.log(`      Condición: ${e.data.condition.field} === "${e.data.condition.value}"`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

revertirYConectarCorrecto();
