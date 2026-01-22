import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixFlujoConfirmacionPago() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Corrigiendo flujo de confirmación de pago...\n');
    
    // 1. Buscar nodo webhook de MercadoPago
    const nodoWebhook = wooFlow.nodes.find(n => 
      n.type === 'webhook' || 
      n.id.includes('webhook') || 
      n.data?.label?.toLowerCase().includes('webhook')
    );
    
    if (nodoWebhook) {
      console.log(`✅ Nodo webhook encontrado: ${nodoWebhook.id}`);
      
      // Buscar si ya existe edge de webhook a gpt-carrito
      const edgeWebhookExistente = wooFlow.edges.find(e => 
        e.source === nodoWebhook.id && e.target === 'gpt-carrito'
      );
      
      if (!edgeWebhookExistente) {
        // Crear edge de webhook a gpt-carrito
        wooFlow.edges.push({
          id: `${nodoWebhook.id}-to-gpt-carrito`,
          source: nodoWebhook.id,
          target: 'gpt-carrito',
          sourceHandle: 'b',
          targetHandle: 'a',
          type: 'smoothstep',
          animated: false,
          data: {
            label: '✅ Pago Confirmado'
          }
        });
        console.log(`✅ Edge creado: ${nodoWebhook.id} → gpt-carrito`);
      } else {
        console.log(`   ℹ️  Edge ya existe: ${nodoWebhook.id} → gpt-carrito`);
      }
    } else {
      console.log('⚠️  No se encontró nodo webhook de MercadoPago');
    }
    
    // 2. Buscar nodo de WhatsApp confirmación
    const nodoWhatsAppConfirmacion = wooFlow.nodes.find(n => 
      n.id.includes('confirmacion') || 
      n.data?.label?.toLowerCase().includes('confirmación')
    );
    
    if (nodoWhatsAppConfirmacion) {
      console.log(`✅ Nodo WhatsApp confirmación encontrado: ${nodoWhatsAppConfirmacion.id}`);
      
      // Buscar si ya existe edge de router-carrito a whatsapp-confirmacion
      const edgeRouterConfirmacion = wooFlow.edges.find(e => 
        e.source === 'router-carrito' && e.target === nodoWhatsAppConfirmacion.id
      );
      
      if (!edgeRouterConfirmacion) {
        // Crear edge de router-carrito a whatsapp-confirmacion
        wooFlow.edges.push({
          id: 'router-carrito-to-whatsapp-confirmacion',
          source: 'router-carrito',
          target: nodoWhatsAppConfirmacion.id,
          sourceHandle: 'c', // Usar handle 'c' para tercera salida
          targetHandle: 'a',
          type: 'smoothstep',
          animated: false,
          data: {
            label: '✅ Confirmar Pago',
            condition: {
              field: 'accion_siguiente',
              operator: 'equals',
              value: 'confirmar_pago'
            }
          }
        });
        console.log(`✅ Edge creado: router-carrito → ${nodoWhatsAppConfirmacion.id}`);
        console.log('   Condición: accion_siguiente === "confirmar_pago"');
      } else {
        // Actualizar condición si ya existe
        edgeRouterConfirmacion.data = {
          ...edgeRouterConfirmacion.data,
          condition: {
            field: 'accion_siguiente',
            operator: 'equals',
            value: 'confirmar_pago'
          }
        };
        console.log(`✅ Edge actualizado: router-carrito → ${nodoWhatsAppConfirmacion.id}`);
        console.log('   Condición: accion_siguiente === "confirmar_pago"');
      }
    } else {
      console.log('⚠️  No se encontró nodo de WhatsApp confirmación');
    }
    
    // 3. Verificar todas las conexiones del router-carrito
    console.log('\n🔀 Verificando router-carrito...');
    const edgesRouterCarrito = wooFlow.edges.filter(e => e.source === 'router-carrito');
    
    console.log(`   Total de salidas: ${edgesRouterCarrito.length}`);
    edgesRouterCarrito.forEach(edge => {
      console.log(`   - ${edge.data?.label || 'Sin label'} → ${edge.target}`);
      if (edge.data?.condition) {
        console.log(`     Condición: ${edge.data.condition.field} ${edge.data.condition.operator} "${edge.data.condition.value}"`);
      } else {
        console.log(`     ⚠️  Sin condición`);
      }
    });
    
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
    console.log('✅ FLUJO DE CONFIRMACIÓN CORREGIDO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 FLUJO COMPLETO DE CONFIRMACIÓN:');
    console.log('');
    console.log('   webhook-mercadopago');
    console.log('     ↓ Genera: confirmacion_pago = true');
    console.log('   gpt-carrito');
    console.log('     ↓ Genera: accion_siguiente = "confirmar_pago"');
    console.log('     ↓ Genera: respuesta_gpt con mensaje de confirmación');
    console.log('   router-carrito');
    console.log('     ↓ Valida: accion_siguiente === "confirmar_pago"');
    console.log('   whatsapp-confirmacion');
    console.log('     ↓ Envía mensaje de confirmación al usuario');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlujoConfirmacionPago();
