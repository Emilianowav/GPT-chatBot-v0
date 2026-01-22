import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function completarConfigMP() {
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
    console.log('🔧 COMPLETAR CONFIG MERCADOPAGO');
    console.log('═'.repeat(80));
    
    const nodoMPIndex = wooFlow.nodes.findIndex(n => n.id === 'mercadopago-crear-preference');
    
    if (nodoMPIndex === -1) {
      console.log('❌ Nodo mercadopago-crear-preference no encontrado');
      return;
    }
    
    console.log('\n📝 Config actual:');
    console.log(JSON.stringify(wooFlow.nodes[nodoMPIndex].data.config, null, 2));
    
    // Completar config con campos faltantes
    wooFlow.nodes[nodoMPIndex].data.config = {
      ...wooFlow.nodes[nodoMPIndex].data.config,
      titulo: 'Compra en Librería Veo Veo',
      notificationUrl: 'https://api.momentoia.co/webhook/mercadopago'
    };
    
    // Agregar label si no existe
    if (!wooFlow.nodes[nodoMPIndex].data.label) {
      wooFlow.nodes[nodoMPIndex].data.label = 'MercadoPago - Crear Preferencia';
    }
    
    console.log('\n✅ Nuevo config:');
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
    
    console.log('\n═'.repeat(80));
    console.log('📋 FLUJO COMPLETO DE PAGO');
    console.log('═'.repeat(80));
    
    console.log('\n1. Usuario: "Como pago?"');
    console.log('   → Clasificador: tipo_accion = "finalizar_compra"');
    console.log('   → Router Principal: Ruta "b" → GPT Armar Carrito');
    
    console.log('\n2. GPT Armar Carrito:');
    console.log('   → Lee productos del historial de conversación');
    console.log('   → Actualiza variables globales:');
    console.log('     - carrito_items: [{ id, nombre, precio, cantidad }]');
    console.log('     - carrito_total: suma de precios');
    console.log('     - carrito_items_count: cantidad de items');
    
    console.log('\n3. Router Carrito:');
    console.log('   → Evalúa si carrito_items_count > 0');
    console.log('   → Ruta "b" → MercadoPago');
    
    console.log('\n4. MercadoPago (executeMercadoPagoNode):');
    console.log('   → Lee carrito_items de variables globales');
    console.log('   → Crea carrito en BD si no existe');
    console.log('   → Obtiene accessToken de seller');
    console.log('   → Llama MercadoPagoService.createPreference()');
    console.log('   → Genera link de pago');
    
    console.log('\n5. WhatsApp:');
    console.log('   → Envía link de pago al usuario');
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('El nodo GPT Armar Carrito debe actualizar carrito_items correctamente.');
    console.log('Verificar su systemPrompt para que extraiga los productos del historial.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

completarConfigMP();
