/**
 * Script para Verificar Configuración del Router Principal
 * 
 * Verifica:
 * 1. Qué condiciones tiene cada ruta del router
 * 2. Cómo evalúa tipo_accion
 * 3. Qué edges salen del router
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarRouter() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    // Buscar router principal
    const router = flow.nodes.find(n => n.id === 'router-principal');
    
    if (!router) {
      console.log('❌ Router principal no encontrado');
      return;
    }
    
    console.log('🔍 ROUTER PRINCIPAL');
    console.log('═'.repeat(60));
    console.log('ID:', router.id);
    console.log('Tipo:', router.type);
    console.log('Label:', router.data?.label);
    
    console.log('\n📋 RUTAS CONFIGURADAS:');
    console.log('─'.repeat(60));
    
    if (router.data?.config?.routes) {
      router.data.config.routes.forEach((route, index) => {
        console.log(`\n${index + 1}. ${route.label || 'Sin label'}`);
        console.log(`   ID: ${route.id}`);
        console.log(`   Condición: ${route.condition || 'Sin condición'}`);
        console.log(`   Handle: ${route.handle || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  No hay rutas configuradas');
    }
    
    // Buscar edges que salen del router
    console.log('\n\n🔗 EDGES QUE SALEN DEL ROUTER:');
    console.log('─'.repeat(60));
    
    const edgesDesdeRouter = flow.edges.filter(e => e.source === 'router-principal');
    
    if (edgesDesdeRouter.length === 0) {
      console.log('   ⚠️  No hay edges desde el router');
    } else {
      edgesDesdeRouter.forEach((edge, index) => {
        console.log(`\n${index + 1}. Edge: ${edge.id}`);
        console.log(`   De: ${edge.source} (${edge.sourceHandle || 'default'})`);
        console.log(`   A: ${edge.target}`);
        console.log(`   Label: ${edge.label || 'Sin label'}`);
        console.log(`   Condición: ${edge.data?.condition || 'Sin condición'}`);
      });
    }
    
    // Verificar nodo de destino "gpt-armar-carrito"
    console.log('\n\n🎯 VERIFICANDO NODO DESTINO: gpt-armar-carrito');
    console.log('─'.repeat(60));
    
    const nodoCarrito = flow.nodes.find(n => n.id === 'gpt-armar-carrito');
    
    if (nodoCarrito) {
      console.log('✅ Nodo encontrado');
      console.log('   Label:', nodoCarrito.data?.label);
      console.log('   Tipo:', nodoCarrito.type);
    } else {
      console.log('❌ Nodo NO encontrado');
    }
    
    // Buscar edge que va a gpt-armar-carrito
    const edgeACarrito = flow.edges.find(e => 
      e.source === 'router-principal' && e.target === 'gpt-armar-carrito'
    );
    
    if (edgeACarrito) {
      console.log('\n✅ EDGE A CARRITO ENCONTRADO:');
      console.log('   ID:', edgeACarrito.id);
      console.log('   Source Handle:', edgeACarrito.sourceHandle);
      console.log('   Condición:', edgeACarrito.data?.condition || 'Sin condición');
      console.log('   Label:', edgeACarrito.label || 'Sin label');
    } else {
      console.log('\n❌ NO HAY EDGE DIRECTO A gpt-armar-carrito');
    }
    
    console.log('\n\n' + '═'.repeat(60));
    console.log('📊 RESUMEN');
    console.log('═'.repeat(60));
    console.log(`Rutas configuradas: ${router.data?.config?.routes?.length || 0}`);
    console.log(`Edges desde router: ${edgesDesdeRouter.length}`);
    console.log(`Edge a carrito: ${edgeACarrito ? '✅' : '❌'}`);
    
    if (edgeACarrito) {
      console.log('\n✅ CONFIGURACIÓN CORRECTA');
      console.log('   El router tiene un edge a gpt-armar-carrito');
      console.log(`   Condición: ${edgeACarrito.data?.condition || 'Sin condición'}`);
    } else {
      console.log('\n⚠️  PROBLEMA POTENCIAL');
      console.log('   No hay edge directo del router a gpt-armar-carrito');
      console.log('   Verificá que la ruta "comprar" esté conectada correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarRouter()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
