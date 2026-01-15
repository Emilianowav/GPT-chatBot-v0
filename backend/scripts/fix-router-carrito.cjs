/**
 * Script para Configurar Router Carrito
 * 
 * PROBLEMA CRÍTICO:
 * router-carrito NO tiene configuración (variable ni rutas)
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixRouterCarrito() {
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
    
    // ============================================================
    // CONFIGURAR ROUTER CARRITO
    // ============================================================
    
    console.log('\n🔧 Configurando Router Carrito...');
    
    const indexRouterCarrito = flow.nodes.findIndex(n => n.id === 'router-carrito');
    
    if (indexRouterCarrito === -1) {
      console.log('❌ Router Carrito no encontrado');
      return;
    }
    
    console.log('   Router Carrito encontrado en índice:', indexRouterCarrito);
    
    // Configuración correcta del router
    flow.nodes[indexRouterCarrito] = {
      id: 'router-carrito',
      type: 'router',
      data: {
        label: 'Router Carrito',
        config: {
          variable: 'confirmacion_compra',
          routes: [
            {
              condition: 'equals',
              value: 'true',
              label: '✅ Datos Completos',
              additionalConditions: [
                { variable: 'nombre_cliente', condition: 'exists' },
                { variable: 'email_cliente', condition: 'exists' }
              ]
            },
            {
              condition: 'equals',
              value: 'false',
              label: '❌ Sin Confirmación'
            },
            {
              condition: 'default',
              label: '⚠️ Faltan Datos'
            }
          ]
        }
      },
      position: flow.nodes[indexRouterCarrito].position
    };
    
    console.log('   ✅ Router Carrito configurado');
    console.log('   Variable: confirmacion_compra');
    console.log('   Rutas: 3');
    console.log('      1. Datos completos (confirmacion=true + nombre + email)');
    console.log('      2. Sin confirmación (confirmacion=false)');
    console.log('      3. Faltan datos (default)');
    
    // ============================================================
    // GUARDAR
    // ============================================================
    
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Router Carrito configurado correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
fixRouterCarrito()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
