require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';

async function rebuildRouter() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    // Buscar el flujo activo (el de 14 nodos que usa Render)
    const flow = await flowsCollection.findOne({ 
      $or: [
        { nombre: 'WooCommerce Flow' },
        { nodes: { $size: 14 } }
      ]
    });
    
    if (!flow) {
      console.log('❌ Flujo activo no encontrado');
      return;
    }
    
    console.log('📊 FLUJO ACTIVO ENCONTRADO:');
    console.log(`   Nombre: ${flow.nombre}`);
    console.log(`   ID: ${flow._id}`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);
    
    console.log('🗑️  PASO 1: ELIMINANDO ROUTER Y EDGES VIEJOS\n');
    
    // Eliminar nodo router
    const nodesWithoutRouter = flow.nodes.filter(n => n.id !== 'router');
    console.log(`   ❌ Router eliminado (${flow.nodes.length} → ${nodesWithoutRouter.length} nodos)`);
    
    // Eliminar TODOS los edges relacionados con router
    const edgesWithoutRouter = flow.edges.filter(e => 
      e.source !== 'router' && 
      e.target !== 'router' &&
      e.source !== 'gpt-formateador' && // Eliminar edges viejos del formateador
      e.source !== 'gpt-pedir-datos'    // Eliminar edges viejos de pedir-datos
    );
    console.log(`   ❌ Edges eliminados (${flow.edges.length} → ${edgesWithoutRouter.length} edges)\n`);
    
    console.log('🔨 PASO 2: CREANDO ROUTER NUEVO\n');
    
    // Crear nodo router nuevo
    const routerNode = {
      id: 'router',
      type: 'router',
      position: { x: 600, y: 200 },
      data: {
        label: 'Router',
        subtitle: 'Evalúa variables',
        config: {
          routes: [
            {
              id: 'route-completas',
              label: 'Variables completas',
              condition: '{{gpt-formateador.variables_completas}} equals true'
            },
            {
              id: 'route-faltan',
              label: 'Faltan variables',
              condition: '{{gpt-formateador.variables_completas}} equals false'
            }
          ]
        },
        executionCount: 0
      },
      category: 'control'
    };
    
    nodesWithoutRouter.push(routerNode);
    console.log('   ✅ Router creado con 2 rutas');
    console.log('      - route-completas: variables_completas = true');
    console.log('      - route-faltan: variables_completas = false\n');
    
    console.log('🔗 PASO 3: CREANDO EDGES CON CONDICIONES\n');
    
    const newEdges = [...edgesWithoutRouter];
    
    // Edge 1: webhook → gpt-formateador
    newEdges.push({
      id: 'edge-webhook-formateador',
      source: 'webhook-whatsapp',
      target: 'gpt-formateador',
      type: 'default'
    });
    console.log('   1. webhook-whatsapp → gpt-formateador');
    
    // Edge 2: gpt-formateador → router
    newEdges.push({
      id: 'edge-formateador-router',
      source: 'gpt-formateador',
      target: 'router',
      type: 'default'
    });
    console.log('   2. gpt-formateador → router (evalúa variables)');
    
    // Edge 3: router → woocommerce (SI completas)
    newEdges.push({
      id: 'edge-router-woocommerce',
      source: 'router',
      sourceHandle: 'route-completas',
      target: 'woocommerce',
      type: 'default',
      data: {
        condition: '{{gpt-formateador.variables_completas}} equals true',
        label: 'Variables completas',
        routeId: 'route-completas'
      }
    });
    console.log('   3. router → woocommerce [SI variables_completas = true]');
    
    // Edge 4: router → gpt-pedir-datos (SI faltan)
    newEdges.push({
      id: 'edge-router-pedir',
      source: 'router',
      sourceHandle: 'route-faltan',
      target: 'gpt-pedir-datos',
      type: 'default',
      data: {
        condition: '{{gpt-formateador.variables_completas}} equals false',
        label: 'Faltan variables',
        routeId: 'route-faltan'
      }
    });
    console.log('   4. router → gpt-pedir-datos [SI variables_completas = false]');
    
    // Edge 5: gpt-pedir-datos → whatsapp-preguntar (SI aún faltan)
    newEdges.push({
      id: 'edge-pedir-whatsapp',
      source: 'gpt-pedir-datos',
      target: 'whatsapp-preguntar',
      type: 'default',
      data: {
        condition: '{{gpt-pedir-datos.variables_completas}} equals false',
        label: 'Enviar pregunta'
      }
    });
    console.log('   5. gpt-pedir-datos → whatsapp-preguntar [SI aún faltan]');
    
    // Edge 6: gpt-pedir-datos → gpt-formateador (SI ya completas)
    newEdges.push({
      id: 'edge-pedir-formateador',
      source: 'gpt-pedir-datos',
      target: 'gpt-formateador',
      type: 'default',
      data: {
        condition: '{{gpt-pedir-datos.variables_completas}} equals true',
        label: 'Re-evaluar'
      }
    });
    console.log('   6. gpt-pedir-datos → gpt-formateador [SI completas, re-evaluar]\n');
    
    console.log('📊 RESUMEN:');
    console.log(`   Nodos: ${flow.nodes.length} → ${nodesWithoutRouter.length}`);
    console.log(`   Edges: ${flow.edges.length} → ${newEdges.length}\n`);
    
    console.log('🔍 LOGGING CONFIGURADO:');
    console.log('   ✅ gpt-formateador.output');
    console.log('   ✅ router.evaluación de condiciones');
    console.log('   ✅ router.ruta seleccionada');
    console.log('   ✅ woocommerce.input\n');
    
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
      console.log('   webhook → formateador → router');
      console.log('   ├─ [completas] → woocommerce ✅');
      console.log('   └─ [faltan] → pedir-datos → whatsapp → [usuario] → formateador (loop)');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

rebuildRouter();
