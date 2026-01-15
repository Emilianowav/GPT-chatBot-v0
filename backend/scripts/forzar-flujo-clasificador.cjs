/**
 * Script para Forzar que TODO pase por el Clasificador
 * 
 * PROBLEMA: Los mensajes no están pasando por el clasificador
 * SOLUCIÓN: Eliminar TODAS las conexiones viejas y dejar solo la correcta
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function forzarFlujoClasificador() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log('\n📊 Flujo:', flow.nombre);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    // ============================================================
    // PASO 1: Identificar nodos clave
    // ============================================================
    
    console.log('\n🔍 Identificando nodos clave...');
    
    const webhook = flow.nodes.find(n => n.type === 'trigger' || n.id.includes('webhook'));
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    const routerPrincipal = flow.nodes.find(n => n.id === 'router-principal');
    const formateador = flow.nodes.find(n => 
      n.type === 'gpt' && 
      n.id !== 'gpt-clasificador-inteligente' && 
      n.id !== 'gpt-armar-carrito' &&
      n.data?.config?.tipo === 'formateador'
    );
    
    console.log(`   Webhook: ${webhook?.id}`);
    console.log(`   Clasificador: ${clasificador?.id}`);
    console.log(`   Router Principal: ${routerPrincipal?.id}`);
    console.log(`   Formateador: ${formateador?.id}`);
    
    // ============================================================
    // PASO 2: Mostrar TODAS las conexiones actuales del webhook
    // ============================================================
    
    console.log('\n📋 Conexiones actuales del webhook:');
    const conexionesWebhook = flow.edges.filter(e => e.source === webhook.id);
    conexionesWebhook.forEach((edge, i) => {
      const target = flow.nodes.find(n => n.id === edge.target);
      console.log(`   ${i + 1}. ${edge.source} → ${edge.target} (${target?.type})`);
      console.log(`      ID: ${edge.id}`);
    });
    
    // ============================================================
    // PASO 3: ELIMINAR TODAS las conexiones del webhook
    // ============================================================
    
    console.log('\n🔧 PASO 1: Eliminando TODAS las conexiones del webhook...');
    
    const edgesAnteriores = flow.edges.length;
    flow.edges = flow.edges.filter(e => e.source !== webhook.id);
    
    console.log(`   Eliminadas: ${edgesAnteriores - flow.edges.length} conexiones`);
    
    // ============================================================
    // PASO 4: Crear SOLO la conexión correcta
    // ============================================================
    
    console.log('\n🔧 PASO 2: Creando conexión correcta...');
    
    const conexionCorrecta = {
      id: 'edge-webhook-clasificador-final',
      source: webhook.id,
      target: clasificador.id,
      data: { 
        label: 'Mensaje recibido'
      }
    };
    
    flow.edges.push(conexionCorrecta);
    console.log(`   ✅ ${webhook.id} → ${clasificador.id}`);
    
    // ============================================================
    // PASO 5: Verificar que el resto del flujo esté conectado
    // ============================================================
    
    console.log('\n🔍 Verificando resto del flujo...');
    
    const conexionesEsperadas = [
      { from: clasificador.id, to: routerPrincipal.id, label: 'Clasificador → Router' },
      { from: routerPrincipal.id, to: formateador.id, label: 'Router → Formateador' },
      { from: routerPrincipal.id, to: 'gpt-armar-carrito', label: 'Router → Armar Carrito' }
    ];
    
    conexionesEsperadas.forEach(conn => {
      const existe = flow.edges.find(e => e.source === conn.from && e.target === conn.to);
      if (existe) {
        console.log(`   ✅ ${conn.label}`);
      } else {
        console.log(`   ❌ ${conn.label} FALTA`);
        
        // Agregar si falta
        if (conn.from === clasificador.id && conn.to === routerPrincipal.id) {
          flow.edges.push({
            id: 'edge-clasificador-router-final',
            source: conn.from,
            target: conn.to,
            data: { label: 'Intención clasificada' }
          });
          console.log(`      ✅ Agregada`);
        }
        
        if (conn.from === routerPrincipal.id && conn.to === formateador.id) {
          flow.edges.push({
            id: 'edge-router-formateador-final',
            source: conn.from,
            target: conn.to,
            data: { 
              condition: 'tipo_accion equals buscar_producto',
              label: '🔍 Buscar'
            }
          });
          console.log(`      ✅ Agregada`);
        }
        
        if (conn.from === routerPrincipal.id && conn.to === 'gpt-armar-carrito') {
          flow.edges.push({
            id: 'edge-router-carrito-final',
            source: conn.from,
            target: conn.to,
            data: { 
              condition: 'tipo_accion equals comprar',
              label: '🛒 Comprar'
            }
          });
          console.log(`      ✅ Agregada`);
        }
      }
    });
    
    // ============================================================
    // PASO 6: Guardar cambios
    // ============================================================
    
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ FLUJO FORZADO A PASAR POR CLASIFICADOR');
    console.log('='.repeat(60));
    
    console.log('\n📊 Resumen:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    console.log('\n🔗 Flujo garantizado:');
    console.log('   Webhook → Clasificador (ÚNICA conexión del webhook)');
    console.log('   Clasificador → Router Principal');
    console.log('   Router Principal → Formateador (buscar_producto)');
    console.log('   Router Principal → Armar Carrito (comprar)');
    
    console.log('\n🧪 Próximos pasos:');
    console.log('   1. Limpiar estado: node scripts/limpiar-mi-numero.js');
    console.log('   2. Enviar mensaje: "Busco Harry Potter 5"');
    console.log('   3. Verificar logs del backend');
    console.log('   4. Enviar mensaje: "Quiero comprarlo"');
    console.log('   5. Verificar que va al flujo de carrito');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
forzarFlujoClasificador()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
