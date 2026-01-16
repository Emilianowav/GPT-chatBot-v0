/**
 * Script para Simplificar Router Carrito
 * 
 * OBJETIVO:
 * Probar flujo completo hasta generar link de MercadoPago
 * 
 * CAMBIO:
 * Condición actual:
 *   {{confirmacion_compra}} equals true AND {{nombre_cliente}} exists AND {{email_cliente}} exists
 * 
 * Condición simplificada:
 *   {{confirmacion_compra}} equals true
 * 
 * Esto permite ir directo a MercadoPago sin pedir nombre/email
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function simplificarRouterCarrito() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═'.repeat(80));
    console.log('🔧 SIMPLIFICANDO ROUTER CARRITO PARA TESTING');
    console.log('═'.repeat(80));
    
    // Buscar edge a MercadoPago
    const edgeIndex = flow.edges.findIndex(e => e.id === 'edge-router-mercadopago');
    
    if (edgeIndex === -1) {
      console.log('\n❌ Edge edge-router-mercadopago no encontrado');
      return;
    }
    
    const edge = flow.edges[edgeIndex];
    
    console.log('\n📋 EDGE A MERCADOPAGO:');
    console.log(`   ID: ${edge.id}`);
    console.log(`   Source: ${edge.source}`);
    console.log(`   Target: ${edge.target}`);
    console.log(`   Condición actual: "${edge.data?.condition}"`);
    
    // Simplificar condición
    const nuevaCondicion = '{{confirmacion_compra}} equals true';
    
    console.log(`   Condición nueva:  "${nuevaCondicion}"`);
    
    flow.edges[edgeIndex].data = flow.edges[edgeIndex].data || {};
    flow.edges[edgeIndex].data.condition = nuevaCondicion;
    
    // Guardar
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ ROUTER CARRITO SIMPLIFICADO');
    console.log('═'.repeat(80));
    
    console.log('\n📊 FLUJO AHORA:');
    console.log('   1. gpt-armar-carrito → extrae productos_carrito, confirmacion_compra');
    console.log('   2. router-carrito → evalúa solo confirmacion_compra');
    console.log('   3. Si confirmacion_compra = true → mercadopago-crear-preference');
    console.log('   4. MercadoPago crea carrito en BD desde globalVariables');
    console.log('   5. Genera link de pago');
    
    console.log('\n🧪 TESTING:');
    console.log('   1. NO hay deploy pendiente (cambio solo en BD)');
    console.log('   2. Limpiar estado: node scripts/limpiar-mi-numero.js');
    console.log('   3. Probar: "Busco Harry Potter 3" → "lo quiero"');
    console.log('   4. Verificar en logs:');
    console.log('      ✅ Router Carrito: confirmacion_compra = true → MercadoPago');
    console.log('      ✅ MercadoPago crea carrito en BD');
    console.log('      ✅ Se genera link de pago');
    console.log('      ✅ WhatsApp envía link al usuario');
    
    console.log('\n💡 NOTA:');
    console.log('   Esta es una configuración temporal para testing');
    console.log('   Después se puede volver a agregar validación de nombre/email');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
simplificarRouterCarrito()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
