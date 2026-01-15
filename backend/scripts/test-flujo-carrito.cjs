/**
 * Script de Testing del Flujo de Carrito
 * 
 * TESTS:
 * 1. Flujo de búsqueda (debe funcionar igual que antes)
 * 2. Clasificador detecta "comprar"
 * 3. Flujo de carrito sin confirmación
 * 4. Flujo de carrito con confirmación pero sin datos
 * 5. Flujo de carrito completo
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';
const TEST_PHONE = '5493794946066';

async function testFlujoCarrito() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    
    // ============================================================
    // VERIFICACIÓN PREVIA: Estado del flujo
    // ============================================================
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICACIÓN PREVIA DEL FLUJO');
    console.log('='.repeat(60));
    
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log(`\n✅ Flujo encontrado: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    // Verificar nodos clave
    const nodosEsperados = [
      'webhook-whatsapp',
      'gpt-clasificador-inteligente',
      'router-principal',
      'gpt-formateador',
      'gpt-armar-carrito',
      'router-carrito',
      'mercadopago-crear-preference',
      'whatsapp-solicitar-datos',
      'whatsapp-link-pago'
    ];
    
    console.log('\n🔍 Verificando nodos clave:');
    nodosEsperados.forEach(nodeId => {
      const existe = flow.nodes.find(n => n.id === nodeId);
      if (existe) {
        console.log(`   ✅ ${nodeId}`);
      } else {
        console.log(`   ❌ ${nodeId} NO ENCONTRADO`);
      }
    });
    
    // Verificar conexiones clave
    console.log('\n🔍 Verificando conexiones clave:');
    const conexionesEsperadas = [
      { from: 'webhook-whatsapp', to: 'gpt-clasificador-inteligente', label: 'Webhook → Clasificador' },
      { from: 'gpt-clasificador-inteligente', to: 'router-principal', label: 'Clasificador → Router' },
      { from: 'router-principal', to: 'gpt-formateador', label: 'Router → Formateador (buscar)' },
      { from: 'router-principal', to: 'gpt-armar-carrito', label: 'Router → Armar Carrito (comprar)' },
      { from: 'router-carrito', to: 'mercadopago-crear-preference', label: 'Router Carrito → MercadoPago' },
      { from: 'mercadopago-crear-preference', to: 'whatsapp-link-pago', label: 'MercadoPago → Link Pago' }
    ];
    
    conexionesEsperadas.forEach(conn => {
      const existe = flow.edges.find(e => e.source === conn.from && e.target === conn.to);
      if (existe) {
        console.log(`   ✅ ${conn.label}`);
      } else {
        console.log(`   ❌ ${conn.label} NO ENCONTRADA`);
      }
    });
    
    // Verificar configuración del clasificador
    console.log('\n🔍 Verificando configuración del clasificador:');
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    if (clasificador) {
      const tienePrompt = clasificador.data?.config?.systemPrompt ? true : false;
      const tieneExtraction = clasificador.data?.config?.extractionConfig ? true : false;
      
      console.log(`   SystemPrompt: ${tienePrompt ? '✅' : '❌'}`);
      console.log(`   ExtractionConfig: ${tieneExtraction ? '✅' : '❌'}`);
      
      if (tieneExtraction) {
        const vars = clasificador.data.config.extractionConfig.variablesToExtract || [];
        console.log(`   Variables a extraer: ${vars.map(v => v.nombre).join(', ')}`);
      }
    }
    
    // ============================================================
    // VERIFICACIÓN: Historial y variables globales
    // ============================================================
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICACIÓN DE ESTADO INICIAL');
    console.log('='.repeat(60));
    
    const contacto = await db.collection('contactos_empresa').findOne({ 
      telefono: TEST_PHONE 
    });
    
    if (contacto) {
      console.log(`\n✅ Contacto encontrado: ${contacto.nombre}`);
      console.log(`   Tiene workflowState: ${contacto.workflowState ? 'Sí' : 'No'}`);
      console.log(`   Interacciones: ${contacto.interacciones || 0}`);
    } else {
      console.log('\n⚠️  Contacto no encontrado');
    }
    
    const historial = await db.collection('historial_conversaciones').find({ 
      contactoId: contacto?._id 
    }).toArray();
    
    console.log(`\n📜 Historial de conversación: ${historial.length} mensajes`);
    
    // ============================================================
    // RESUMEN
    // ============================================================
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));
    
    const nodosOk = nodosEsperados.every(id => flow.nodes.find(n => n.id === id));
    const conexionesOk = conexionesEsperadas.every(conn => 
      flow.edges.find(e => e.source === conn.from && e.target === conn.to)
    );
    const clasificadorOk = clasificador?.data?.config?.systemPrompt && 
                          clasificador?.data?.config?.extractionConfig;
    
    console.log(`\n✅ Nodos: ${nodosOk ? 'OK' : 'FALTAN NODOS'}`);
    console.log(`✅ Conexiones: ${conexionesOk ? 'OK' : 'FALTAN CONEXIONES'}`);
    console.log(`✅ Clasificador: ${clasificadorOk ? 'OK' : 'SIN CONFIGURAR'}`);
    console.log(`✅ Estado limpio: ${historial.length === 0 ? 'OK' : 'HAY HISTORIAL'}`);
    
    if (nodosOk && conexionesOk && clasificadorOk) {
      console.log('\n🎉 FLUJO LISTO PARA TESTING');
      console.log('\n📝 Próximos pasos:');
      console.log('   1. Enviar mensaje: "Busco Harry Potter 2"');
      console.log('   2. Verificar que el clasificador detecta "buscar_producto"');
      console.log('   3. Verificar que va al formateador (flujo actual)');
      console.log('   4. Enviar mensaje: "Quiero comprarlo"');
      console.log('   5. Verificar que el clasificador detecta "comprar"');
      console.log('   6. Verificar que va al flujo de carrito');
      console.log('\n⚠️  IMPORTANTE: Debes enviar los mensajes desde WhatsApp');
      console.log('   Teléfono de prueba: ' + TEST_PHONE);
    } else {
      console.log('\n❌ FLUJO NO ESTÁ LISTO');
      console.log('   Revisa los errores arriba');
    }
    
    // ============================================================
    // INSTRUCCIONES DE TESTING MANUAL
    // ============================================================
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 INSTRUCCIONES DE TESTING MANUAL');
    console.log('='.repeat(60));
    
    console.log('\n📱 TEST 1: Flujo de búsqueda (debe funcionar igual)');
    console.log('   Mensaje: "Busco Harry Potter 2"');
    console.log('   Esperado:');
    console.log('   - Clasificador detecta "buscar_producto"');
    console.log('   - Router envía al formateador');
    console.log('   - WooCommerce busca productos');
    console.log('   - GPT Asistente presenta productos');
    console.log('   - WhatsApp envía respuesta');
    
    console.log('\n📱 TEST 2: Flujo de carrito sin confirmación');
    console.log('   Mensaje: "Quiero comprarlo"');
    console.log('   Esperado:');
    console.log('   - Clasificador detecta "comprar"');
    console.log('   - Router envía a Armar Carrito');
    console.log('   - GPT Armar Carrito extrae productos pero confirmacion_compra = false');
    console.log('   - Router Carrito detecta falta confirmación');
    console.log('   - WhatsApp solicita confirmación');
    
    console.log('\n📱 TEST 3: Flujo de carrito con confirmación pero sin datos');
    console.log('   Mensaje: "Sí, confirmo"');
    console.log('   Esperado:');
    console.log('   - Clasificador detecta "comprar"');
    console.log('   - GPT Armar Carrito: confirmacion_compra = true pero faltan nombre/email');
    console.log('   - Router Carrito detecta faltan datos');
    console.log('   - WhatsApp solicita nombre y email');
    
    console.log('\n📱 TEST 4: Flujo de carrito completo');
    console.log('   Mensaje: "Juan Pérez, juan@example.com"');
    console.log('   Esperado:');
    console.log('   - Clasificador detecta "comprar"');
    console.log('   - GPT Armar Carrito: todo completo');
    console.log('   - Router Carrito: datos completos');
    console.log('   - MercadoPago crea preference');
    console.log('   - WhatsApp envía link de pago');
    
    console.log('\n⚠️  NOTA: Los logs del backend mostrarán el flujo completo');
    console.log('   Revisa la consola del servidor para ver qué nodos se ejecutan');
    
  } catch (error) {
    console.error('\n❌ Error en testing:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
testFlujoCarrito()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verificación falló:', error);
    process.exit(1);
  });
