import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixRouterPrincipal() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ WooCommerce Flow no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('🔧 FIX ROUTER PRINCIPAL');
    console.log('═'.repeat(80));
    
    // Buscar router-principal
    const routerIndex = wooFlow.nodes.findIndex(n => n.id === 'router-principal');
    
    if (routerIndex === -1) {
      console.log('❌ Router principal no encontrado');
      return;
    }
    
    console.log('\n📋 Config actual del router:');
    console.log(JSON.stringify(wooFlow.nodes[routerIndex].data.config, null, 2));
    
    // Buscar edges del router
    const routerEdges = wooFlow.edges.filter(e => e.source === 'router-principal');
    
    console.log('\n📤 Edges actuales:');
    routerEdges.forEach(edge => {
      const target = wooFlow.nodes.find(n => n.id === edge.target);
      console.log(`\nEdge ID: ${edge.id}`);
      console.log(`  Source Handle: ${edge.sourceHandle}`);
      console.log(`  Target: ${target?.data?.label} (${edge.target})`);
      console.log(`  Label: ${edge.data?.label}`);
    });
    
    console.log('\n═'.repeat(80));
    console.log('❌ PROBLEMA IDENTIFICADO');
    console.log('═'.repeat(80));
    
    console.log('\nTodas las rutas tienen sourceHandle: "b"');
    console.log('Esto significa que el router NO está evaluando tipo_accion');
    console.log('Todas las rutas se ejecutan en paralelo o solo una se ejecuta');
    
    console.log('\n═'.repeat(80));
    console.log('✅ SOLUCIÓN');
    console.log('═'.repeat(80));
    
    console.log('\nEl router debe evaluar {{tipo_accion}} y dirigir según el valor:');
    console.log('  • tipo_accion = "buscar_producto" → gpt-formateador');
    console.log('  • tipo_accion = "agregar_carrito" → gpt-armar-carrito');
    console.log('  • tipo_accion = "finalizar_compra" → gpt-armar-carrito');
    console.log('  • tipo_accion = "ver_carrito" → (nodo de ver carrito)');
    console.log('  • tipo_accion = "consulta_general" → gpt-asistente-ventas');
    
    console.log('\n📋 Configuración correcta del router:');
    const configCorrecta = {
      routerType: 'conditional',
      variable: 'tipo_accion', // Variable a evaluar
      conditions: [
        {
          path: 'buscar_producto',
          label: '🔍 Buscar Producto',
          condition: '{{tipo_accion}} == "buscar_producto"'
        },
        {
          path: 'agregar_carrito',
          label: '🛒 Agregar al Carrito',
          condition: '{{tipo_accion}} == "agregar_carrito"'
        },
        {
          path: 'finalizar_compra',
          label: '💳 Finalizar Compra',
          condition: '{{tipo_accion}} == "finalizar_compra"'
        },
        {
          path: 'ver_carrito',
          label: '👁️ Ver Carrito',
          condition: '{{tipo_accion}} == "ver_carrito"'
        },
        {
          path: 'consulta_general',
          label: '💬 Consulta General',
          condition: '{{tipo_accion}} == "consulta_general"'
        }
      ]
    };
    
    console.log(JSON.stringify(configCorrecta, null, 2));
    
    // Actualizar config del router
    wooFlow.nodes[routerIndex].data.config = configCorrecta;
    
    console.log('\n💾 Guardando cambios...');
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    console.log(`   Modified count: ${result.modifiedCount}`);
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('Los EDGES también deben actualizarse en el frontend para que:');
    console.log('  • Edge con sourceHandle="buscar_producto" → gpt-formateador');
    console.log('  • Edge con sourceHandle="agregar_carrito" → gpt-armar-carrito');
    console.log('  • Edge con sourceHandle="finalizar_compra" → gpt-armar-carrito');
    
    console.log('\n📋 FLUJO CORRECTO DESPUÉS DEL FIX:');
    console.log('1. "4 y 5 quiero"');
    console.log('   → Clasificador: tipo_accion = "agregar_carrito"');
    console.log('   → Router: Evalúa tipo_accion');
    console.log('   → Ruta "agregar_carrito" → gpt-armar-carrito');
    console.log('   → GPT Armar Carrito: Extrae productos 4 y 5');
    console.log('   → Actualiza carrito_items, carrito_total');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixRouterPrincipal();
