import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixRouterCarritoConditions() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Corrigiendo condiciones del router-carrito...\n');
    
    // 1. Actualizar configuración del nodo router-carrito
    const routerCarrito = wooFlow.nodes.find(n => n.id === 'router-carrito');
    
    if (routerCarrito) {
      routerCarrito.data.config = {
        variable: 'accion_siguiente',
        routes: [
          {
            condition: "{{accion_siguiente}} equals 'pagar'",
            label: '✅ Hay Items - Ir a Pago'
          },
          {
            condition: "{{accion_siguiente}} equals 'confirmar_pago'",
            label: '✅ Confirmar Pago'
          },
          {
            condition: 'default',
            label: '❌ Sin Acción'
          }
        ]
      };
      
      console.log('✅ Configuración del nodo router-carrito actualizada');
    }
    
    // 2. Actualizar condiciones en los edges (formato STRING)
    wooFlow.edges.forEach(edge => {
      if (edge.source === 'router-carrito') {
        if (edge.target === 'mercadopago-crear-preference') {
          // Ruta a MercadoPago
          edge.data = {
            ...edge.data,
            condition: "{{accion_siguiente}} equals 'pagar'"
          };
          console.log(`✅ Edge actualizado: ${edge.target}`);
          console.log(`   Condición: "{{accion_siguiente}} equals 'pagar'"`);
        } else if (edge.target.includes('confirmacion')) {
          // Ruta a confirmación
          edge.data = {
            ...edge.data,
            condition: "{{accion_siguiente}} equals 'confirmar_pago'"
          };
          console.log(`✅ Edge actualizado: ${edge.target}`);
          console.log(`   Condición: "{{accion_siguiente}} equals 'confirmar_pago'"`);
        }
      }
    });
    
    console.log('\n💾 Guardando cambios...');
    
    await flowsCollection.updateOne(
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
    console.log('✅ ROUTER-CARRITO CORREGIDO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 CONFIGURACIÓN FINAL:\n');
    console.log('Variable evaluada: accion_siguiente\n');
    console.log('Rutas:');
    console.log('   1. Si accion_siguiente === "pagar" → mercadopago-crear-preference');
    console.log('   2. Si accion_siguiente === "confirmar_pago" → whatsapp-confirmacion');
    console.log('   3. Default → Sin acción\n');
    
    console.log('⚠️  IMPORTANTE:');
    console.log('   El nodo gpt-carrito DEBE generar la variable global "accion_siguiente"');
    console.log('   con valor "pagar" o "confirmar_pago" según el caso.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixRouterCarritoConditions();
