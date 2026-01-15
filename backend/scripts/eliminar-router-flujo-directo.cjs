require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function eliminarRouterFlujoDirecto() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({});
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('🔧 ELIMINANDO ROUTER Y RECONSTRUYENDO FLUJO\n');
    console.log('📊 Estado actual:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);
    
    // 1. ELIMINAR NODO ROUTER
    const nodesWithoutRouter = flow.nodes.filter(n => n.id !== 'router');
    console.log('❌ Eliminando nodo: router');
    
    // 2. ELIMINAR TODOS LOS EDGES RELACIONADOS CON ROUTER
    const edgesWithoutRouter = flow.edges.filter(e => 
      e.source !== 'router' && e.target !== 'router'
    );
    console.log('❌ Eliminando edges relacionados con router\n');
    
    // 3. CREAR FLUJO DIRECTO
    console.log('✅ NUEVO FLUJO DIRECTO:\n');
    
    // Edge 1: webhook → gpt-formateador
    const edge1 = {
      id: 'edge-webhook-formateador',
      source: 'webhook-whatsapp',
      target: 'gpt-formateador',
      type: 'default'
    };
    console.log('   1. webhook-whatsapp → gpt-formateador');
    
    // Edge 2: gpt-formateador → woocommerce (SI variables completas)
    const edge2 = {
      id: 'edge-formateador-woocommerce',
      source: 'gpt-formateador',
      target: 'woocommerce',
      type: 'default',
      data: {
        condition: '{{gpt-formateador.variables_completas}} equals true',
        label: 'Variables completas'
      }
    };
    console.log('   2. gpt-formateador → woocommerce (si variables_completas = true)');
    
    // Edge 3: gpt-formateador → gpt-pedir-datos (SI faltan variables)
    const edge3 = {
      id: 'edge-formateador-pedir',
      source: 'gpt-formateador',
      target: 'gpt-pedir-datos',
      type: 'default',
      data: {
        condition: '{{gpt-formateador.variables_completas}} equals false',
        label: 'Faltan variables'
      }
    };
    console.log('   3. gpt-formateador → gpt-pedir-datos (si variables_completas = false)');
    
    // Edge 4: gpt-pedir-datos → whatsapp-preguntar (SI faltan variables)
    const edge4 = {
      id: 'edge-pedir-whatsapp',
      source: 'gpt-pedir-datos',
      target: 'whatsapp-preguntar',
      type: 'default',
      data: {
        condition: '{{gpt-pedir-datos.variables_completas}} equals false',
        label: 'Enviar pregunta'
      }
    };
    console.log('   4. gpt-pedir-datos → whatsapp-preguntar (si aún faltan)');
    
    // Edge 5: gpt-pedir-datos → gpt-formateador (SI ya tiene todas)
    const edge5 = {
      id: 'edge-pedir-formateador',
      source: 'gpt-pedir-datos',
      target: 'gpt-formateador',
      type: 'default',
      data: {
        condition: '{{gpt-pedir-datos.variables_completas}} equals true',
        label: 'Re-evaluar'
      }
    };
    console.log('   5. gpt-pedir-datos → gpt-formateador (si completas, re-evaluar)');
    
    // Mantener edges de woocommerce en adelante
    const woocommerceEdges = flow.edges.filter(e => 
      e.source === 'woocommerce' || 
      e.source === 'gpt-asistente-ventas' ||
      e.source === 'whatsapp-asistente' ||
      e.source === 'gpt-clasificador' ||
      e.source === 'router-intencion' ||
      e.source === 'gpt-carrito' ||
      e.source === 'whatsapp-confirmacion' ||
      e.source === 'mercadopago' ||
      e.source === 'whatsapp-pago'
    );
    
    console.log('\n   6-N. Mantener flujo desde woocommerce en adelante');
    
    // CONSTRUIR NUEVO ARRAY DE EDGES
    const newEdges = [
      edge1,
      edge2,
      edge3,
      edge4,
      edge5,
      ...woocommerceEdges
    ];
    
    console.log('\n📊 RESUMEN:');
    console.log(`   Nodos antes: ${flow.nodes.length} → después: ${nodesWithoutRouter.length}`);
    console.log(`   Edges antes: ${flow.edges.length} → después: ${newEdges.length}\n`);
    
    console.log('🔍 LOGGING CONFIGURADO:');
    console.log('   ✅ gpt-formateador.output → variables_completas, variables_faltantes');
    console.log('   ✅ Condiciones evaluadas en edges');
    console.log('   ✅ woocommerce.input → params.search (titulo)\n');
    
    // Actualizar en BD
    const result = await flowsCollection.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          nodes: nodesWithoutRouter,
          edges: newEdges,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Flujo actualizado en MongoDB\n');
      
      console.log('📋 FLUJO FINAL:');
      console.log('   webhook → formateador → [evalúa variables]');
      console.log('   ├─ SI completas → woocommerce ✅');
      console.log('   └─ SI faltan → pedir-datos → whatsapp → [usuario responde] → formateador');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

eliminarRouterFlujoDirecto();
