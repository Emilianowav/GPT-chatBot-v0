/**
 * Script para Corregir Router Carrito y MercadoPago
 * 
 * PROBLEMA 1: Router Carrito
 * Condiciones sin {{}}:
 *   "confirmacion_compra equals true"
 *   "nombre_cliente exists"
 * 
 * Deben ser:
 *   "{{confirmacion_compra}} equals true"
 *   "{{nombre_cliente}} exists"
 * 
 * PROBLEMA 2: MercadoPago
 * No lee productos_carrito de globalVariables
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixRouterCarritoYMercadoPago() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═'.repeat(80));
    console.log('🔧 CORRIGIENDO ROUTER CARRITO Y MERCADOPAGO');
    console.log('═'.repeat(80));
    
    // ============================================================
    // 1. CORREGIR EDGES DEL ROUTER CARRITO
    // ============================================================
    console.log('\n📋 1. CORRIGIENDO EDGES DEL ROUTER CARRITO\n');
    
    const edgesDesdeRouterCarrito = flow.edges.filter(e => e.source === 'router-carrito');
    
    let cambiosEdges = 0;
    
    edgesDesdeRouterCarrito.forEach((edge, index) => {
      const condition = edge.data?.condition;
      
      if (!condition) {
        console.log(`${index + 1}. Edge ${edge.id}: Sin condición (skip)`);
        return;
      }
      
      console.log(`${index + 1}. Edge ${edge.id}:`);
      console.log(`   Destino: ${edge.target}`);
      console.log(`   Condición actual: "${condition}"`);
      
      // Agregar {{}} a todas las variables en la condición
      // Patrón: buscar palabras que NO tengan {{}} y agregarlos
      let nuevaCondicion = condition;
      
      // Reemplazar variables conocidas
      const variables = [
        'confirmacion_compra',
        'nombre_cliente',
        'email_cliente',
        'telefono_cliente',
        'productos_carrito',
        'total'
      ];
      
      variables.forEach(variable => {
        // Buscar la variable sin {{}}
        const regex = new RegExp(`\\b(${variable})\\b(?!\\}\\})`, 'g');
        nuevaCondicion = nuevaCondicion.replace(regex, `{{${variable}}}`);
      });
      
      if (nuevaCondicion !== condition) {
        console.log(`   Condición nueva:  "${nuevaCondicion}"`);
        
        const edgeIndex = flow.edges.findIndex(e => e.id === edge.id);
        if (edgeIndex !== -1) {
          flow.edges[edgeIndex].data = flow.edges[edgeIndex].data || {};
          flow.edges[edgeIndex].data.condition = nuevaCondicion;
          cambiosEdges++;
        }
      } else {
        console.log(`   ✅ Ya tiene formato correcto`);
      }
    });
    
    // ============================================================
    // 2. VERIFICAR NODO MERCADOPAGO
    // ============================================================
    console.log('\n\n📋 2. VERIFICANDO NODO MERCADOPAGO\n');
    
    const nodoMercadoPago = flow.nodes.find(n => n.id === 'mercadopago-crear-preference');
    
    if (!nodoMercadoPago) {
      console.log('❌ Nodo mercadopago-crear-preference no encontrado');
    } else {
      console.log('✅ Nodo encontrado');
      console.log(`   Tipo: ${nodoMercadoPago.type}`);
      console.log(`   Config: ${JSON.stringify(nodoMercadoPago.data?.config || {}).substring(0, 200)}`);
      
      console.log('\n💡 NOTA:');
      console.log('   El nodo MercadoPago debe leer productos_carrito de globalVariables');
      console.log('   Verificar que el código de FlowExecutor.executeMercadoPagoNode');
      console.log('   esté usando: this.getGlobalVariable("productos_carrito")');
    }
    
    // Guardar cambios
    if (cambiosEdges > 0) {
      console.log(`\n\n💾 Guardando ${cambiosEdges} cambio(s) en edges...`);
      
      await db.collection('flows').updateOne(
        { _id: new ObjectId(FLOW_ID) },
        { $set: { edges: flow.edges } }
      );
      
      console.log('✅ Cambios guardados');
    } else {
      console.log('\n✅ No hay cambios en edges');
    }
    
    console.log('\n\n' + '═'.repeat(80));
    console.log('📊 RESUMEN');
    console.log('═'.repeat(80));
    
    console.log(`\n✅ Edges corregidos: ${cambiosEdges}`);
    
    console.log('\n🧪 TESTING:');
    console.log('   1. NO hay deploy pendiente (cambio solo en BD)');
    console.log('   2. Limpiar estado: node scripts/limpiar-mi-numero.js');
    console.log('   3. Probar: "Busco Harry Potter 3" → "lo quiero"');
    console.log('   4. Verificar en logs:');
    console.log('      ✅ Router Carrito evalúa: {{confirmacion_compra}} equals true');
    console.log('      ✅ MercadoPago recibe productos_carrito con datos');
    console.log('      ✅ Se genera link de pago');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
fixRouterCarritoYMercadoPago()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
