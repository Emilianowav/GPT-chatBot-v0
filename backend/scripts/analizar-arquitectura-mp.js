import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function analizarArquitecturaMP() {
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
    console.log('🏗️  ARQUITECTURA MERCADOPAGO');
    console.log('═'.repeat(80));
    
    const nodoMP = wooFlow.nodes.find(n => n.id === 'mercadopago-crear-preference');
    
    console.log('\n📋 NODO MERCADOPAGO ACTUAL:');
    console.log('─'.repeat(80));
    console.log('ID:', nodoMP?.id);
    console.log('Type:', nodoMP?.type);
    console.log('Label:', nodoMP?.data?.label);
    console.log('\nConfig completo:');
    console.log(JSON.stringify(nodoMP?.data?.config, null, 2));
    console.log('\nData completo:');
    console.log(JSON.stringify(nodoMP?.data, null, 2));
    
    console.log('\n═'.repeat(80));
    console.log('📚 DOS SISTEMAS DE MERCADOPAGO');
    console.log('═'.repeat(80));
    
    console.log('\n1️⃣ SISTEMA ANTIGUO (MercadoPagoExecutor):');
    console.log('   Archivo: services/nodeExecutors/MercadoPagoExecutor.ts');
    console.log('   Tipo de nodo: "mercadopago_payment"');
    console.log('   Usa: generateDynamicPaymentLink()');
    console.log('   Config esperado:');
    console.log('   {');
    console.log('     title: "Compra",');
    console.log('     amount: 1000,');
    console.log('     description: "Descripción",');
    console.log('     outputVariable: "payment_url"');
    console.log('   }');
    
    console.log('\n2️⃣ SISTEMA NUEVO (FlowExecutor.carrito):');
    console.log('   Archivo: services/FlowExecutor.carrito.ts');
    console.log('   Tipo de nodo: "mercadopago"');
    console.log('   Usa: MercadoPagoService.createPreference()');
    console.log('   Config esperado:');
    console.log('   {');
    console.log('     action: "create_payment_link",');
    console.log('     mercadoPagoConnected: true,');
    console.log('     empresaId: "default",');
    console.log('     titulo: "Compra",');
    console.log('     notificationUrl: "https://..."');
    console.log('   }');
    console.log('   Busca carrito_items en variables globales');
    
    console.log('\n═'.repeat(80));
    console.log('🔍 ANÁLISIS DEL NODO ACTUAL');
    console.log('═'.repeat(80));
    
    if (nodoMP?.type === 'mercadopago_payment') {
      console.log('\n✅ El nodo es tipo "mercadopago_payment"');
      console.log('   → Usa MercadoPagoExecutor');
      console.log('   → Usa generateDynamicPaymentLink()');
      console.log('   → NO usa carrito_items');
      console.log('   → Necesita title, amount, description en config');
    } else if (nodoMP?.type === 'mercadopago') {
      console.log('\n✅ El nodo es tipo "mercadopago"');
      console.log('   → Usa executeMercadoPagoNode de FlowExecutor.carrito.ts');
      console.log('   → Usa MercadoPagoService.createPreference()');
      console.log('   → Busca carrito_items en variables globales');
      console.log('   → Necesita mercadoPagoConnected, empresaId, titulo en config');
    } else {
      console.log('\n⚠️  El nodo tiene tipo desconocido:', nodoMP?.type);
    }
    
    console.log('\n═'.repeat(80));
    console.log('💡 RECOMENDACIÓN');
    console.log('═'.repeat(80));
    
    console.log('\nPara que funcione con el carrito (carrito_items):');
    console.log('1. El nodo debe ser tipo "mercadopago" (no "mercadopago_payment")');
    console.log('2. El config debe tener:');
    console.log('   - action: "create_payment_link"');
    console.log('   - mercadoPagoConnected: true');
    console.log('   - empresaId: "default"');
    console.log('   - titulo: "Compra en Librería Veo Veo"');
    console.log('   - notificationUrl: "https://api.momentoia.co/webhook/mercadopago"');
    console.log('3. Las variables globales deben tener:');
    console.log('   - carrito_items: [{ id, nombre, precio, cantidad }]');
    console.log('   - carrito_total: 1000');
    console.log('   - telefono_cliente: "5493794946066"');
    
    console.log('\n🔧 ¿Necesitas actualizar el tipo de nodo?');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

analizarArquitecturaMP();
