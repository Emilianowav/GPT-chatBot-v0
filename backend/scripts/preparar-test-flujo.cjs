const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const TELEFONO = '5493794946066';

async function prepararTest() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧹 LIMPIANDO ESTADO DEL USUARIO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`📱 Teléfono: ${TELEFONO}\n`);
    
    // 1. Limpiar conversation_states
    const conversationStates = db.collection('conversation_states');
    const result1 = await conversationStates.deleteMany({ phone: TELEFONO });
    console.log(`✅ conversation_states: ${result1.deletedCount} documentos eliminados`);
    
    // 2. Limpiar contactos_empresa (workflowState)
    const contactos = db.collection('contactos_empresa');
    const result2 = await contactos.updateMany(
      { telefono: TELEFONO },
      { $unset: { workflowState: "" } }
    );
    console.log(`✅ contactos_empresa: ${result2.modifiedCount} documentos actualizados`);
    
    // 3. Limpiar carritos
    const carritos = db.collection('carritos');
    const result3 = await carritos.deleteMany({ telefono: TELEFONO });
    console.log(`✅ carritos: ${result3.deletedCount} documentos eliminados`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 INSTRUCCIONES DE TESTING');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🎯 OBJETIVO: Verificar que el flujo de búsqueda funciona correctamente\n');
    
    console.log('📱 PASOS PARA PROBAR:\n');
    console.log('1. Envía por WhatsApp: "Hola"');
    console.log('   Esperado: Bot responde con saludo\n');
    
    console.log('2. Envía: "Busco harry potter"');
    console.log('   Esperado:');
    console.log('   ✅ GPT Formateador extrae: {"titulo": "harry potter"}');
    console.log('   ✅ Router valida: variables_completas = true');
    console.log('   ✅ WooCommerce busca productos');
    console.log('   ✅ Encuentra 7 productos de Harry Potter');
    console.log('   ✅ GPT Asistente presenta productos con:');
    console.log('      - Nombre del libro');
    console.log('      - Precio');
    console.log('      - Descripción breve');
    console.log('   ✅ WhatsApp envía UN SOLO mensaje');
    console.log('   ✅ Flujo se detiene\n');
    
    console.log('🔍 QUÉ VERIFICAR EN LOS LOGS:\n');
    console.log('1. ✅ "🔍 [WOO] Search Products: { search: \'harry potter\', per_page: \'10\' }"');
    console.log('2. ✅ "✅ Productos encontrados: 7" (o más)');
    console.log('3. ✅ "HARRY POTTER" en los nombres de productos');
    console.log('4. ✅ Precios reales (no inventados)');
    console.log('5. ✅ Solo UN mensaje de WhatsApp enviado');
    console.log('6. ✅ Flujo termina después del mensaje\n');
    
    console.log('❌ PROBLEMAS POSIBLES:\n');
    console.log('1. WooCommerce devuelve 0 productos');
    console.log('   → Verificar que la API esté activa');
    console.log('   → Verificar que el término de búsqueda sea correcto\n');
    
    console.log('2. GPT inventa productos');
    console.log('   → Verificar que woocommerce.productos tenga datos reales');
    console.log('   → Verificar el prompt del GPT asistente\n');
    
    console.log('3. Se envían 2 mensajes');
    console.log('   → Verificar que NO haya edge desde whatsapp-asistente\n');
    
    console.log('4. Router evalúa mal las condiciones');
    console.log('   → Verificar que la corrección de "contains" esté aplicada\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ESTADO LIMPIADO - LISTO PARA PROBAR');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('💡 TIP: Monitorea los logs del backend en tiempo real con:');
    console.log('   render logs --tail\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

prepararTest();
