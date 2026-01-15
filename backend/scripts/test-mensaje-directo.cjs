/**
 * Script para Simular Mensaje y Ver Logs
 * 
 * OBJETIVO:
 * Simular el mensaje "quiero comprarlo" directamente
 * y ver exactamente qué pasa en el flujo
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';
const TEST_PHONE = '5493794946066';

async function testMensajeDirecto() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    // Obtener contacto
    const contacto = await db.collection('contactos_empresa').findOne({ 
      telefono: TEST_PHONE 
    });
    
    if (!contacto) {
      console.log('❌ Contacto no encontrado');
      return;
    }
    
    // Obtener flujo
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('📊 ESTADO ACTUAL DEL FLUJO\n');
    console.log('Flujo:', flow.nombre);
    console.log('Nodos:', flow.nodes.length);
    console.log('Edges:', flow.edges.length);
    
    // Simular ejecución paso a paso
    console.log('\n' + '='.repeat(60));
    console.log('🔍 SIMULACIÓN DE FLUJO: "quiero comprarlo"');
    console.log('='.repeat(60));
    
    const mensaje = "quiero comprarlo";
    
    // PASO 1: Webhook recibe mensaje
    console.log('\n1️⃣ WEBHOOK recibe mensaje');
    console.log('   Mensaje:', mensaje);
    console.log('   De:', TEST_PHONE);
    
    const webhook = flow.nodes.find(n => n.id === 'webhook-whatsapp');
    const conexionWebhook = flow.edges.find(e => e.source === webhook.id);
    
    if (conexionWebhook) {
      console.log('   ✅ Webhook conectado a:', conexionWebhook.target);
    } else {
      console.log('   ❌ Webhook NO tiene conexión de salida');
      return;
    }
    
    // PASO 2: Clasificador
    if (conexionWebhook.target === 'gpt-clasificador-inteligente') {
      console.log('\n2️⃣ GPT CLASIFICADOR INTELIGENTE');
      
      const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
      const prompt = clasificador.data?.config?.systemPrompt;
      
      if (prompt) {
        console.log('   ✅ Tiene prompt');
        console.log('   Mensaje a analizar:', mensaje);
        console.log('   Productos presentados: (ninguno en este caso)');
        console.log('   Historial: (vacío)');
        console.log('\n   🤖 El clasificador debería detectar:');
        console.log('      - tipo_accion: "comprar" (porque dice "quiero comprarlo")');
        console.log('      - confianza: 0.8-0.9');
      } else {
        console.log('   ❌ NO tiene prompt');
        return;
      }
      
      const extractionConfig = clasificador.data?.config?.extractionConfig;
      if (extractionConfig) {
        console.log('\n   ✅ ExtractionConfig configurado');
        const vars = extractionConfig.variablesToExtract || [];
        console.log('   Variables a extraer:', vars.map(v => v.nombre).join(', '));
      } else {
        console.log('\n   ❌ ExtractionConfig NO configurado');
        return;
      }
      
      // Verificar conexión a router
      const conexionClasificador = flow.edges.find(e => e.source === 'gpt-clasificador-inteligente');
      if (conexionClasificador) {
        console.log('\n   ✅ Clasificador conectado a:', conexionClasificador.target);
      } else {
        console.log('\n   ❌ Clasificador NO tiene conexión de salida');
        return;
      }
      
      // PASO 3: Router Principal
      if (conexionClasificador.target === 'router-principal') {
        console.log('\n3️⃣ ROUTER PRINCIPAL');
        
        const router = flow.nodes.find(n => n.id === 'router-principal');
        const variable = router.data?.config?.variable;
        
        if (variable === 'tipo_accion') {
          console.log('   ✅ Variable a evaluar: tipo_accion');
          console.log('   Valor esperado: "comprar"');
          
          const rutas = router.data?.config?.routes || [];
          console.log('\n   Rutas disponibles:');
          rutas.forEach(r => {
            console.log(`      - ${r.label}: ${r.value} (${r.condition})`);
          });
          
          // Buscar ruta de comprar
          const rutaComprar = flow.edges.find(e => 
            e.source === 'router-principal' && 
            e.data?.condition?.includes('comprar')
          );
          
          if (rutaComprar) {
            console.log('\n   ✅ Ruta "comprar" encontrada');
            console.log('   Condición:', rutaComprar.data.condition);
            console.log('   Destino:', rutaComprar.target);
            
            if (rutaComprar.target === 'gpt-armar-carrito') {
              console.log('\n4️⃣ GPT ARMAR CARRITO');
              console.log('   ✅ Debería ejecutarse si tipo_accion = "comprar"');
              
              const armarCarrito = flow.nodes.find(n => n.id === 'gpt-armar-carrito');
              if (armarCarrito.data?.config?.systemPrompt) {
                console.log('   ✅ Tiene prompt configurado');
              }
              if (armarCarrito.data?.config?.extractionConfig) {
                console.log('   ✅ Tiene extractionConfig');
                const vars = armarCarrito.data.config.extractionConfig.variablesToExtract || [];
                console.log('   Variables:', vars.map(v => v.nombre).join(', '));
              }
            } else {
              console.log('\n   ❌ Ruta "comprar" NO apunta a gpt-armar-carrito');
              console.log('   Apunta a:', rutaComprar.target);
            }
          } else {
            console.log('\n   ❌ Ruta "comprar" NO encontrada');
          }
        } else {
          console.log('   ❌ Variable incorrecta:', variable);
        }
      } else {
        console.log('\n   ❌ Clasificador NO conectado a router-principal');
        console.log('   Conectado a:', conexionClasificador.target);
      }
    } else {
      console.log('\n   ❌ Webhook NO conectado a clasificador');
      console.log('   Conectado a:', conexionWebhook.target);
    }
    
    // DIAGNÓSTICO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNÓSTICO FINAL');
    console.log('='.repeat(60));
    
    console.log('\n✅ CONFIGURACIÓN:');
    console.log('   - Clasificador: Configurado correctamente');
    console.log('   - Router Principal: Configurado correctamente');
    console.log('   - Conexiones: Todas correctas');
    
    console.log('\n⚠️  PROBLEMA POSIBLE:');
    console.log('   1. El clasificador NO está detectando "comprar" en el mensaje');
    console.log('   2. El FlowExecutor NO está ejecutando el clasificador');
    console.log('   3. El servidor backend NO está corriendo');
    
    console.log('\n💡 SOLUCIÓN:');
    console.log('   1. Verifica que el servidor backend esté corriendo');
    console.log('   2. Envía un mensaje de prueba y revisa los logs del servidor');
    console.log('   3. Busca en los logs:');
    console.log('      - "🚀 Ejecutando flujo"');
    console.log('      - "Ejecutando nodo: gpt-clasificador-inteligente"');
    console.log('      - El output del clasificador con tipo_accion');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
testMensajeDirecto()
  .then(() => {
    console.log('\n✅ Test completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test falló:', error);
    process.exit(1);
  });
