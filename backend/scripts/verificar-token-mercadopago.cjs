/**
 * Script para Verificar Token de MercadoPago
 * 
 * OBJETIVO:
 * Revisar el accessToken configurado en el nodo mercadopago-crear-preference
 * 
 * ERROR ACTUAL:
 * PA_UNAUTHORIZED_RESULT_FROM_POLICIES (403)
 * 
 * POSIBLES CAUSAS:
 * 1. Token de prueba (TEST-xxx) en lugar de producción (APP-xxx)
 * 2. Token sin permisos de crear preferencias
 * 3. Token expirado o inválido
 * 4. Variable mal configurada
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarTokenMercadoPago() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═'.repeat(80));
    console.log('🔍 VERIFICANDO TOKEN DE MERCADOPAGO');
    console.log('═'.repeat(80));
    
    // Buscar nodo MercadoPago
    const mpNode = flow.nodes.find(n => n.id === 'mercadopago-crear-preference');
    
    if (!mpNode) {
      console.log('\n❌ Nodo mercadopago-crear-preference no encontrado');
      return;
    }
    
    console.log('\n📋 NODO MERCADOPAGO:');
    console.log(`   ID: ${mpNode.id}`);
    console.log(`   Label: ${mpNode.data.label}`);
    console.log(`   Type: ${mpNode.type}`);
    
    const config = mpNode.data.config || {};
    
    console.log('\n🔑 CONFIGURACIÓN:');
    console.log(`   accessToken: ${config.accessToken || 'NO CONFIGURADO'}`);
    console.log(`   titulo: ${config.titulo || 'NO CONFIGURADO'}`);
    console.log(`   notificationUrl: ${config.notificationUrl || 'NO CONFIGURADO'}`);
    
    if (config.backUrls) {
      console.log(`   backUrls.success: ${config.backUrls.success || 'NO CONFIGURADO'}`);
      console.log(`   backUrls.failure: ${config.backUrls.failure || 'NO CONFIGURADO'}`);
      console.log(`   backUrls.pending: ${config.backUrls.pending || 'NO CONFIGURADO'}`);
    }
    
    console.log('\n🔍 ANÁLISIS DEL TOKEN:');
    
    const token = config.accessToken;
    
    if (!token) {
      console.log('   ❌ NO HAY TOKEN CONFIGURADO');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   1. Ir a https://www.mercadopago.com.ar/developers/panel/app');
      console.log('   2. Crear una aplicación (si no existe)');
      console.log('   3. Copiar el Access Token de PRODUCCIÓN');
      console.log('   4. Configurar en el nodo desde el frontend');
      return;
    }
    
    // Verificar si es variable o token directo
    if (token.includes('{{')) {
      console.log(`   ⚠️  Es una VARIABLE: ${token}`);
      console.log('   📝 El token se resuelve en runtime desde globalVariables');
      console.log('\n💡 VERIFICAR:');
      console.log('   1. ¿La variable existe en globalVariables?');
      console.log('   2. ¿Se está seteando correctamente antes de llegar a MercadoPago?');
      console.log('   3. Revisar logs para ver qué valor tiene al ejecutar');
    } else {
      console.log(`   ✅ Es un TOKEN DIRECTO`);
      console.log(`   📝 Primeros 20 chars: ${token.substring(0, 20)}...`);
      console.log(`   📝 Longitud: ${token.length} caracteres`);
      
      // Verificar tipo de token
      if (token.startsWith('TEST-')) {
        console.log('\n   ⚠️  TOKEN DE PRUEBA (TEST)');
        console.log('   📝 Este token es para ambiente de pruebas (sandbox)');
        console.log('   📝 Los links generados serán de sandbox');
      } else if (token.startsWith('APP-')) {
        console.log('\n   ✅ TOKEN DE PRODUCCIÓN (APP)');
        console.log('   📝 Este token es para ambiente de producción');
      } else {
        console.log('\n   ❌ FORMATO DE TOKEN DESCONOCIDO');
        console.log('   📝 El token debería empezar con TEST- o APP-');
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RECOMENDACIONES');
    console.log('═'.repeat(80));
    
    console.log('\n1️⃣  VERIFICAR PERMISOS DEL TOKEN:');
    console.log('   - El token debe tener permisos de "write" para crear preferencias');
    console.log('   - Revisar en: https://www.mercadopago.com.ar/developers/panel/app');
    
    console.log('\n2️⃣  PROBAR TOKEN MANUALMENTE:');
    console.log('   - Usar Postman o curl para crear una preferencia de prueba');
    console.log('   - Endpoint: POST https://api.mercadopago.com/checkout/preferences');
    console.log('   - Header: Authorization: Bearer YOUR_TOKEN');
    
    console.log('\n3️⃣  SI ES VARIABLE:');
    console.log('   - Verificar que la variable se setea antes del nodo MercadoPago');
    console.log('   - Revisar logs para ver el valor resuelto');
    
    console.log('\n4️⃣  ERROR 403 UNAUTHORIZED:');
    console.log('   - Puede ser token inválido, expirado o sin permisos');
    console.log('   - Regenerar el token desde el panel de MercadoPago');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarTokenMercadoPago()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
