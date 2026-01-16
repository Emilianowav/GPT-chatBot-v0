/**
 * Script para Verificar si MercadoPago está Conectado
 * 
 * OBJETIVO:
 * Verificar si hay un seller activo en la BD para la empresa
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';

async function verificarMPConectado() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═'.repeat(80));
    console.log('🔍 VERIFICANDO CONEXIÓN DE MERCADOPAGO');
    console.log('═'.repeat(80));
    
    // Buscar sellers activos
    const sellers = await db.collection('sellers').find({ active: true }).toArray();
    
    console.log(`\n📊 Sellers activos encontrados: ${sellers.length}\n`);
    
    if (sellers.length === 0) {
      console.log('❌ NO HAY SELLERS CONECTADOS');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   1. Ir a http://localhost:3000/dashboard/integraciones');
      console.log('   2. Click en "Conectar con Mercado Pago"');
      console.log('   3. Autorizar en MercadoPago');
      console.log('   4. Volver y verificar de nuevo');
      return;
    }
    
    sellers.forEach((seller, index) => {
      console.log(`\n📋 SELLER ${index + 1}:`);
      console.log(`   userId: ${seller.userId}`);
      console.log(`   internalId: ${seller.internalId}`);
      console.log(`   email: ${seller.email || 'N/A'}`);
      console.log(`   businessName: ${seller.businessName || 'N/A'}`);
      console.log(`   active: ${seller.active}`);
      console.log(`   connectedAt: ${seller.connectedAt}`);
      console.log(`   accessToken: ${seller.accessToken ? `${seller.accessToken.substring(0, 20)}...` : 'N/A'}`);
      console.log(`   refreshToken: ${seller.refreshToken ? 'Presente' : 'N/A'}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ MERCADOPAGO ESTÁ CONECTADO');
    console.log('═'.repeat(80));
    
    console.log('\n📝 PRÓXIMO PASO:');
    console.log('   1. Ir al Flow Builder');
    console.log('   2. Abrir modal del nodo MercadoPago');
    console.log('   3. Seleccionar "Link Dinámico"');
    console.log('   4. Click en "Guardar Configuración"');
    console.log('   5. Probar el flujo completo');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarMPConectado()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
