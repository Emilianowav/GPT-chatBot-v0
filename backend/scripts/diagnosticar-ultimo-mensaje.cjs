/**
 * Script para Diagnosticar Último Mensaje
 * 
 * OBJETIVO:
 * Ver exactamente qué nodos se ejecutaron en el último mensaje
 * para entender por qué el flujo de carrito no funciona
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';
const TEST_PHONE = '5493794946066';

async function diagnosticarUltimoMensaje() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    // ============================================================
    // 1. Obtener el contacto
    // ============================================================
    
    const contacto = await db.collection('contactos_empresa').findOne({ 
      telefono: TEST_PHONE 
    });
    
    if (!contacto) {
      console.log('❌ Contacto no encontrado');
      return;
    }
    
    console.log('📱 Contacto:', contacto.nombre);
    console.log('   Teléfono:', contacto.telefono);
    
    // ============================================================
    // 2. Obtener historial de conversación
    // ============================================================
    
    const historial = await db.collection('historial_conversaciones')
      .find({ contactoId: contacto._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    console.log('\n📜 Últimos mensajes del historial:\n');
    historial.reverse().forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.role}] ${msg.content.substring(0, 100)}`);
      console.log(`   Timestamp: ${msg.timestamp}`);
      console.log('');
    });
    
    // ============================================================
    // 3. Verificar variables globales del contacto
    // ============================================================
    
    console.log('🔧 Variables globales del contacto:');
    if (contacto.workflowState?.globalVariables) {
      const globalVars = contacto.workflowState.globalVariables;
      console.log(JSON.stringify(globalVars, null, 2));
    } else {
      console.log('   (ninguna)');
    }
    
    // ============================================================
    // 4. Verificar flujo y nodos
    // ============================================================
    
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('\n📊 Flujo:', flow.nombre);
    console.log('   Nodos:', flow.nodes.length);
    console.log('   Edges:', flow.edges.length);
    
    // Verificar que el clasificador existe y está configurado
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    console.log('\n🔍 Clasificador:');
    if (clasificador) {
      console.log('   ✅ Existe');
      console.log('   Tiene prompt:', clasificador.data?.config?.systemPrompt ? 'Sí' : 'No');
      console.log('   Tiene extractionConfig:', clasificador.data?.config?.extractionConfig ? 'Sí' : 'No');
      if (clasificador.data?.config?.extractionConfig) {
        const vars = clasificador.data.config.extractionConfig.variablesToExtract || [];
        console.log('   Variables a extraer:', vars.map(v => v.nombre).join(', '));
      }
    } else {
      console.log('   ❌ NO EXISTE');
    }
    
    // Verificar router principal
    const routerPrincipal = flow.nodes.find(n => n.id === 'router-principal');
    console.log('\n🔀 Router Principal:');
    if (routerPrincipal) {
      console.log('   ✅ Existe');
      console.log('   Variable a evaluar:', routerPrincipal.data?.config?.variable || 'NO CONFIGURADO');
      console.log('   Rutas:', routerPrincipal.data?.config?.routes?.length || 0);
      if (routerPrincipal.data?.config?.routes) {
        routerPrincipal.data.config.routes.forEach(r => {
          console.log(`      - ${r.label}: ${r.value}`);
        });
      }
    } else {
      console.log('   ❌ NO EXISTE');
    }
    
    // Verificar GPT Armar Carrito
    const armarCarrito = flow.nodes.find(n => n.id === 'gpt-armar-carrito');
    console.log('\n🛒 GPT Armar Carrito:');
    if (armarCarrito) {
      console.log('   ✅ Existe');
      console.log('   Tiene prompt:', armarCarrito.data?.config?.systemPrompt ? 'Sí' : 'No');
      console.log('   Tiene extractionConfig:', armarCarrito.data?.config?.extractionConfig ? 'Sí' : 'No');
    } else {
      console.log('   ❌ NO EXISTE');
    }
    
    // ============================================================
    // 5. Verificar conexiones críticas
    // ============================================================
    
    console.log('\n🔗 Conexiones críticas:');
    
    const conexiones = [
      { from: 'webhook-whatsapp', to: 'gpt-clasificador-inteligente', label: 'Webhook → Clasificador' },
      { from: 'gpt-clasificador-inteligente', to: 'router-principal', label: 'Clasificador → Router' },
      { from: 'router-principal', to: 'gpt-formateador', label: 'Router → Formateador (buscar)' },
      { from: 'router-principal', to: 'gpt-armar-carrito', label: 'Router → Armar Carrito (comprar)' },
    ];
    
    conexiones.forEach(conn => {
      const existe = flow.edges.find(e => e.source === conn.from && e.target === conn.to);
      if (existe) {
        console.log(`   ✅ ${conn.label}`);
        if (existe.data?.condition) {
          console.log(`      Condición: ${existe.data.condition}`);
        }
      } else {
        console.log(`   ❌ ${conn.label} - NO EXISTE`);
      }
    });
    
    // ============================================================
    // 6. DIAGNÓSTICO FINAL
    // ============================================================
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DIAGNÓSTICO');
    console.log('='.repeat(60));
    
    console.log('\nPara diagnosticar por qué "como lo compro?" no activa el carrito:');
    console.log('\n1. Verificar logs del backend cuando se envió el mensaje');
    console.log('2. Buscar en los logs:');
    console.log('   - "🚀 Ejecutando flujo"');
    console.log('   - "Ejecutando nodo: gpt-clasificador-inteligente"');
    console.log('   - "tipo_accion" en el output del clasificador');
    console.log('   - "Ejecutando nodo: router-principal"');
    console.log('   - Qué ruta tomó el router');
    console.log('\n3. Si no ves logs del clasificador:');
    console.log('   - El flujo no está pasando por el clasificador');
    console.log('   - Verificar que webhook apunta al clasificador');
    console.log('\n4. Si el clasificador se ejecuta pero no detecta "comprar":');
    console.log('   - El prompt del clasificador necesita ajuste');
    console.log('   - Verificar que extrae tipo_accion correctamente');
    
    console.log('\n💡 PRÓXIMO PASO:');
    console.log('   Envía otro mensaje "quiero comprarlo" y revisa los logs del backend');
    console.log('   Los logs mostrarán exactamente qué nodos se ejecutan');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
diagnosticarUltimoMensaje()
  .then(() => {
    console.log('\n✅ Diagnóstico completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnóstico falló:', error);
    process.exit(1);
  });
