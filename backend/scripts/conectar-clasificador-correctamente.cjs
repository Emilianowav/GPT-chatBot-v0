/**
 * Script para Conectar Clasificador Correctamente
 * 
 * FLUJO CORRECTO:
 * Webhook → Clasificador → Router Principal → [Formateador O Armar Carrito]
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function conectarClasificador() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log('\n📊 Flujo actual:');
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
    const armarCarrito = flow.nodes.find(n => n.id === 'gpt-armar-carrito');
    
    console.log(`   Webhook: ${webhook?.id || 'NO ENCONTRADO'}`);
    console.log(`   Clasificador: ${clasificador?.id || 'NO ENCONTRADO'}`);
    console.log(`   Router Principal: ${routerPrincipal?.id || 'NO ENCONTRADO'}`);
    console.log(`   Formateador: ${formateador?.id || 'NO ENCONTRADO'}`);
    console.log(`   Armar Carrito: ${armarCarrito?.id || 'NO ENCONTRADO'}`);
    
    if (!webhook || !clasificador || !routerPrincipal || !formateador || !armarCarrito) {
      throw new Error('No se encontraron todos los nodos necesarios');
    }
    
    // ============================================================
    // PASO 2: Eliminar conexiones viejas del webhook y clasificador
    // ============================================================
    
    console.log('\n🔧 Eliminando conexiones viejas...');
    
    const edgesAnteriores = flow.edges.length;
    
    // Eliminar todas las conexiones que salen del webhook
    flow.edges = flow.edges.filter(e => e.source !== webhook.id);
    
    // Eliminar todas las conexiones que salen del clasificador
    flow.edges = flow.edges.filter(e => e.source !== clasificador.id);
    
    // Eliminar todas las conexiones que entran al router principal
    flow.edges = flow.edges.filter(e => e.target !== routerPrincipal.id);
    
    // Eliminar todas las conexiones que salen del router principal
    flow.edges = flow.edges.filter(e => e.source !== routerPrincipal.id);
    
    console.log(`   Edges eliminados: ${edgesAnteriores - flow.edges.length}`);
    
    // ============================================================
    // PASO 3: Crear conexiones correctas
    // ============================================================
    
    console.log('\n🔧 Creando conexiones correctas...');
    
    const nuevasConexiones = [
      // 1. Webhook → Clasificador
      {
        id: 'edge-webhook-clasificador',
        source: webhook.id,
        target: clasificador.id,
        data: { 
          label: 'Mensaje recibido'
        }
      },
      
      // 2. Clasificador → Router Principal
      {
        id: 'edge-clasificador-router',
        source: clasificador.id,
        target: routerPrincipal.id,
        data: { 
          label: 'Intención clasificada'
        }
      },
      
      // 3. Router Principal → Formateador (si buscar_producto)
      {
        id: 'edge-router-formateador',
        source: routerPrincipal.id,
        target: formateador.id,
        data: {
          condition: 'tipo_accion equals buscar_producto',
          label: '🔍 Buscar Producto'
        }
      },
      
      // 4. Router Principal → Armar Carrito (si comprar)
      {
        id: 'edge-router-armar-carrito',
        source: routerPrincipal.id,
        target: armarCarrito.id,
        data: {
          condition: 'tipo_accion equals comprar',
          label: '🛒 Comprar'
        }
      }
    ];
    
    // Agregar las nuevas conexiones
    nuevasConexiones.forEach(conn => {
      flow.edges.push(conn);
      console.log(`   ✅ ${conn.data.label}: ${conn.source} → ${conn.target}`);
    });
    
    // ============================================================
    // PASO 4: Verificar que no haya loops
    // ============================================================
    
    console.log('\n🔍 Verificando loops...');
    
    let loopsEncontrados = 0;
    flow.edges.forEach(edge => {
      if (edge.source === edge.target) {
        console.log(`   ❌ Loop encontrado: ${edge.source} → ${edge.target}`);
        loopsEncontrados++;
      }
    });
    
    if (loopsEncontrados === 0) {
      console.log('   ✅ No se encontraron loops');
    }
    
    // ============================================================
    // PASO 5: Guardar cambios
    // ============================================================
    
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CLASIFICADOR CONECTADO CORRECTAMENTE');
    console.log('='.repeat(60));
    
    console.log('\n📊 Resumen:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    console.log('\n🔗 Flujo correcto:');
    console.log('   1. Webhook → Clasificador');
    console.log('   2. Clasificador → Router Principal');
    console.log('   3. Router Principal → Formateador (buscar_producto)');
    console.log('   4. Router Principal → Armar Carrito (comprar)');
    
    console.log('\n🧪 Próximos pasos:');
    console.log('   1. Verificar en el frontend que el flujo se ve lineal');
    console.log('   2. Probar con un mensaje: "Busco Harry Potter"');
    console.log('   3. Verificar que el clasificador detecta "buscar_producto"');
    console.log('   4. Verificar que va al formateador');
    
  } catch (error) {
    console.error('❌ Error conectando clasificador:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
conectarClasificador()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
