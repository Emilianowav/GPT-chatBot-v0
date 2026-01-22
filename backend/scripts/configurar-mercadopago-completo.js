import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function configurarMercadoPagoCompleto() {
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
    console.log('🔧 CONFIGURAR MERCADOPAGO COMPLETO');
    console.log('═'.repeat(80));
    console.log(`\nFlujo: ${wooFlow.nombre}\n`);
    
    // Buscar nodo de MercadoPago
    const nodoMPIndex = wooFlow.nodes.findIndex(n => n.id === 'mercadopago-crear-preference');
    
    if (nodoMPIndex === -1) {
      console.log('❌ Nodo mercadopago-crear-preference no encontrado');
      return;
    }
    
    const nodoMP = wooFlow.nodes[nodoMPIndex];
    
    console.log('📦 Nodo encontrado:', nodoMP.data.label);
    console.log('   Configuración actual:', JSON.stringify(nodoMP.data.config, null, 2));
    
    // Actualizar configuración
    wooFlow.nodes[nodoMPIndex].data.config = {
      ...nodoMP.data.config,
      action: 'create_payment_link',
      mercadoPagoConnected: true,
      empresaId: 'default',
      titulo: 'Compra en Librería Veo Veo',
      notificationUrl: 'https://api.momentoia.co/webhook/mercadopago',
      // Variables que el nodo buscará
      variablesRequeridas: [
        'carrito_items',
        'carrito_total',
        'telefono_cliente'
      ]
    };
    
    console.log('\n✅ Nueva configuración:');
    console.log(JSON.stringify(wooFlow.nodes[nodoMPIndex].data.config, null, 2));
    
    // Guardar cambios
    console.log('\n💾 Guardando cambios...');
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    console.log(`   Modified count: ${result.modifiedCount}`);
    
    console.log('\n' + '═'.repeat(80));
    console.log('📋 RESUMEN DE CONFIGURACIÓN');
    console.log('═'.repeat(80));
    
    console.log('\n✅ COMPLETADO:');
    console.log('  1. Variables globales (16) configuradas');
    console.log('  2. Nodo GPT 7a presenta productos con links');
    console.log('  3. Nodo GPT 4a actualiza carrito_items');
    console.log('  4. Nodo MercadoPago configurado');
    
    console.log('\n⚠️  PENDIENTE:');
    console.log('  1. El nodo GPT 4a debe actualizar carrito_items cuando usuario dice "lo quiero"');
    console.log('  2. El código de FlowExecutor.carrito.ts busca "productos_carrito" pero debe buscar "carrito_items"');
    console.log('  3. Probar flujo completo: Buscar → Agregar → Pagar');
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('  1. Modificar FlowExecutor.carrito.ts para usar carrito_items en lugar de productos_carrito');
    console.log('  2. Configurar el systemPrompt del nodo 4a para que actualice carrito_items correctamente');
    console.log('  3. Probar con WhatsApp: "Busco Harry Potter" → "4" → "Si quisiera agregarlo" → "Quiero comprarlo"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configurarMercadoPagoCompleto();
