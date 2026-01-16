/**
 * Script para Verificar Flujo Completo del Carrito
 * 
 * Verifica todos los nodos del flujo de carrito:
 * 1. gpt-armar-carrito (extrae productos_carrito)
 * 2. router-carrito (evalúa confirmacion_compra)
 * 3. ¿Hay nodo que CREA carrito en BD?
 * 4. mercadopago-crear-preference (lee carrito de BD)
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarFlujoCarrito() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═'.repeat(80));
    console.log('🔍 FLUJO COMPLETO DEL CARRITO');
    console.log('═'.repeat(80));
    
    // Buscar todos los nodos relacionados con carrito
    const nodosCarrito = flow.nodes.filter(n => 
      n.id.includes('carrito') || 
      n.id.includes('mercadopago') ||
      n.data?.label?.toLowerCase().includes('carrito') ||
      n.data?.label?.toLowerCase().includes('mercado')
    );
    
    console.log(`\n📋 NODOS RELACIONADOS CON CARRITO (${nodosCarrito.length}):\n`);
    
    nodosCarrito.forEach((nodo, index) => {
      console.log(`${index + 1}. ${nodo.id}`);
      console.log(`   Label: ${nodo.data?.label}`);
      console.log(`   Tipo: ${nodo.type}`);
      
      if (nodo.type === 'carrito') {
        console.log(`   Module: ${nodo.data?.config?.module}`);
      }
      
      console.log('');
    });
    
    // Verificar si hay nodo de tipo "carrito"
    const nodoCarritoCrear = flow.nodes.find(n => n.type === 'carrito');
    
    console.log('\n═'.repeat(80));
    console.log('🔍 ANÁLISIS DEL FLUJO');
    console.log('═'.repeat(80));
    
    console.log('\n1. gpt-armar-carrito:');
    const nodoArmarCarrito = flow.nodes.find(n => n.id === 'gpt-armar-carrito');
    if (nodoArmarCarrito) {
      console.log('   ✅ Existe');
      console.log('   📊 Extrae: productos_carrito, total, confirmacion_compra');
      console.log('   💾 Guarda en: globalVariables');
    } else {
      console.log('   ❌ No existe');
    }
    
    console.log('\n2. router-carrito:');
    const nodoRouterCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    if (nodoRouterCarrito) {
      console.log('   ✅ Existe');
      const edgesDesdeRouter = flow.edges.filter(e => e.source === 'router-carrito');
      console.log(`   🔀 Rutas: ${edgesDesdeRouter.length}`);
      edgesDesdeRouter.forEach(e => {
        console.log(`      → ${e.target} (${e.data?.condition || 'sin condición'})`);
      });
    } else {
      console.log('   ❌ No existe');
    }
    
    console.log('\n3. Nodo que CREA carrito en BD:');
    if (nodoCarritoCrear) {
      console.log('   ✅ Existe');
      console.log(`   ID: ${nodoCarritoCrear.id}`);
      console.log(`   Label: ${nodoCarritoCrear.data?.label}`);
      console.log(`   Module: ${nodoCarritoCrear.data?.config?.module}`);
    } else {
      console.log('   ❌ NO EXISTE');
      console.log('   ⚠️  PROBLEMA: MercadoPago busca carrito en BD pero no hay nodo que lo cree');
    }
    
    console.log('\n4. mercadopago-crear-preference:');
    const nodoMercadoPago = flow.nodes.find(n => n.id === 'mercadopago-crear-preference');
    if (nodoMercadoPago) {
      console.log('   ✅ Existe');
      console.log('   📖 Lee: carrito desde BD (CarritoService.obtenerCarritoActivo)');
      console.log('   ⚠️  Requiere que el carrito YA EXISTA en BD');
    } else {
      console.log('   ❌ No existe');
    }
    
    // Verificar orden de ejecución
    console.log('\n\n═'.repeat(80));
    console.log('📊 ORDEN DE EJECUCIÓN ACTUAL');
    console.log('═'.repeat(80));
    
    console.log('\n1. gpt-armar-carrito');
    console.log('   → Extrae productos_carrito a globalVariables');
    console.log('   → NO crea carrito en BD');
    
    console.log('\n2. router-carrito');
    console.log('   → Evalúa confirmacion_compra');
    
    console.log('\n3. mercadopago-crear-preference');
    console.log('   → Busca carrito en BD');
    console.log('   → ❌ FALLA: Carrito no existe en BD');
    
    // Soluciones
    console.log('\n\n═'.repeat(80));
    console.log('💡 SOLUCIONES POSIBLES');
    console.log('═'.repeat(80));
    
    console.log('\n**OPCIÓN 1: Agregar nodo "carrito-crear" ANTES de MercadoPago**');
    console.log('   Flujo:');
    console.log('   1. gpt-armar-carrito → extrae productos_carrito');
    console.log('   2. router-carrito → evalúa confirmacion_compra');
    console.log('   3. carrito-crear → crea carrito en BD desde globalVariables');
    console.log('   4. mercadopago-crear-preference → lee carrito de BD');
    
    console.log('\n**OPCIÓN 2: Modificar MercadoPago para leer de globalVariables**');
    console.log('   Cambiar executeMercadoPagoNode para:');
    console.log('   1. Leer productos_carrito de globalVariables');
    console.log('   2. Crear carrito temporal en BD');
    console.log('   3. Generar preferencia de MP');
    
    console.log('\n**RECOMENDACIÓN: OPCIÓN 1**');
    console.log('   Es más limpio y mantiene la separación de responsabilidades');
    console.log('   Crear nodo tipo "carrito" con module "create"');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarFlujoCarrito()
  .then(() => {
    console.log('\n✅ Verificación completada\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verificación falló:', error);
    process.exit(1);
  });
