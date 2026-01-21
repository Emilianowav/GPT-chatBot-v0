/**
 * Script para verificar qué nodos NO tienen conexiones de salida
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarConexionesFaltantes() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔗 ANÁLISIS DE CONEXIONES DEL FLUJO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Crear mapa de conexiones
    const nodosConSalida = new Set();
    const nodosConEntrada = new Set();
    
    flow.edges.forEach(edge => {
      nodosConSalida.add(edge.source);
      nodosConEntrada.add(edge.target);
    });
    
    // Nodos sin conexión de salida
    const nodosSinSalida = flow.nodes.filter(n => 
      !nodosConSalida.has(n.id) && 
      n.type !== 'webhook' // Webhook es el inicio, no necesita entrada
    );
    
    // Nodos sin conexión de entrada
    const nodosSinEntrada = flow.nodes.filter(n => 
      !nodosConEntrada.has(n.id) && 
      n.type !== 'webhook' // Webhook es el inicio
    );
    
    console.log('📤 NODOS SIN CONEXIÓN DE SALIDA:');
    if (nodosSinSalida.length > 0) {
      nodosSinSalida.forEach(n => {
        console.log(`   ⚠️  ${n.id} (${n.type}) - "${n.data.label}"`);
      });
    } else {
      console.log('   ✅ Todos los nodos tienen salida');
    }
    
    console.log('\n📥 NODOS SIN CONEXIÓN DE ENTRADA:');
    if (nodosSinEntrada.length > 0) {
      nodosSinEntrada.forEach(n => {
        console.log(`   ⚠️  ${n.id} (${n.type}) - "${n.data.label}"`);
      });
    } else {
      console.log('   ✅ Todos los nodos tienen entrada');
    }
    
    // Routers con handles sin usar
    console.log('\n🔀 ROUTERS CON HANDLES SIN CONEXIÓN:');
    const routers = flow.nodes.filter(n => n.type === 'router');
    
    routers.forEach(router => {
      const routeHandles = router.data.routeHandles || [];
      const edgesFromRouter = flow.edges.filter(e => e.source === router.id);
      const handlesUsados = edgesFromRouter.map(e => e.sourceHandle);
      
      const handlesSinUsar = routeHandles.filter(h => !handlesUsados.includes(h));
      
      if (handlesSinUsar.length > 0) {
        console.log(`\n   ${router.id}:`);
        console.log(`      Total handles: ${routeHandles.length}`);
        console.log(`      Handles usados: ${handlesUsados.length}`);
        console.log(`      Handles sin usar: ${handlesSinUsar.length}`);
        handlesSinUsar.forEach(h => console.log(`         - ${h}`));
      }
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`Total nodos: ${flow.nodes.length}`);
    console.log(`Total edges: ${flow.edges.length}`);
    console.log(`Nodos sin salida: ${nodosSinSalida.length}`);
    console.log(`Nodos sin entrada: ${nodosSinEntrada.length}`);
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarConexionesFaltantes()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
