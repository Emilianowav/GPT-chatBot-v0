require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';
const FLUJO_ID = '695a156681f6d67f0ae9cf40'; // Flujo activo de Veo Veo

async function rebuildRouter() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLUJO_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('📊 FLUJO ACTIVO DE VEO VEO:');
    console.log(`   Nombre: ${flow.nombre}`);
    console.log(`   ID: ${flow._id}`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);
    
    console.log('🗑️  PASO 1: ELIMINANDO TODO LO VIEJO\n');
    
    // Eliminar router si existe
    let nodes = flow.nodes.filter(n => n.id !== 'router');
    console.log(`   ❌ Router: ${flow.nodes.length} → ${nodes.length} nodos`);
    
    // Eliminar TODOS los edges viejos relacionados con formateador, router y pedir-datos
    let edges = flow.edges.filter(e => 
      e.source !== 'router' && 
      e.target !== 'router' &&
      !(e.source === 'gpt-formateador' && e.target !== 'webhook-whatsapp') &&
      !(e.source === 'gpt-pedir-datos')
    );
    console.log(`   ❌ Edges viejos: ${flow.edges.length} → ${edges.length} edges\n`);
    
    console.log('🔨 PASO 2: CREANDO ROUTER NUEVO CON LOGGING\n');
    
    // Crear router
    const routerNode = {
      id: 'router',
      type: 'router',
      position: { x: 600, y: 200 },
      data: {
        label: 'Router Variables',
        subtitle: 'Evalúa completitud',
        config: {
          routes: [
            {
              id: 'route-completas',
              label: '✅ Variables completas',
              condition: '{{gpt-formateador.variables_completas}} equals true'
            },
            {
              id: 'route-faltan',
              label: '❌ Faltan variables',
              condition: '{{gpt-formateador.variables_completas}} equals false'
            }
          ]
        },
        executionCount: 0
      }
    };
    
    nodes.push(routerNode);
    console.log('   ✅ Router creado');
    
    console.log('\n🔗 PASO 3: CREANDO EDGES CON CONDICIONES Y LOGGING\n');
    
    // Edge 1: webhook → formateador
    edges.push({
      id: 'edge-1-webhook-formateador',
      source: 'webhook-whatsapp',
      target: 'gpt-formateador',
      type: 'default'
    });
    console.log('   1️⃣  webhook → formateador');
    
    // Edge 2: formateador → router
    edges.push({
      id: 'edge-2-formateador-router',
      source: 'gpt-formateador',
      target: 'router',
      type: 'default'
    });
    console.log('   2️⃣  formateador → router (🔍 EVALÚA VARIABLES)');
    
    // Edge 3: router → woocommerce (SI completas)
    edges.push({
      id: 'edge-3-router-woocommerce',
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
    console.log('   3️⃣  router → woocommerce [SI variables_completas = true] ✅');
    
    // Edge 4: router → pedir-datos (SI faltan)
    edges.push({
      id: 'edge-4-router-pedir',
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
    console.log('   4️⃣  router → pedir-datos [SI variables_completas = false] ❌');
    
    // Edge 5: pedir-datos → whatsapp (SI aún faltan)
    edges.push({
      id: 'edge-5-pedir-whatsapp',
      source: 'gpt-pedir-datos',
      target: 'whatsapp-preguntar',
      type: 'default',
      data: {
        condition: '{{gpt-pedir-datos.variables_completas}} equals false',
        label: 'Enviar pregunta'
      }
    });
    console.log('   5️⃣  pedir-datos → whatsapp [SI aún faltan]');
    
    // Edge 6: pedir-datos → formateador (SI completas, re-evaluar)
    edges.push({
      id: 'edge-6-pedir-formateador',
      source: 'gpt-pedir-datos',
      target: 'gpt-formateador',
      type: 'default',
      data: {
        condition: '{{gpt-pedir-datos.variables_completas}} equals true',
        label: 'Re-evaluar'
      }
    });
    console.log('   6️⃣  pedir-datos → formateador [SI completas, LOOP] 🔄');
    
    console.log('\n📊 RESUMEN:');
    console.log(`   Nodos: ${flow.nodes.length} → ${nodes.length}`);
    console.log(`   Edges: ${flow.edges.length} → ${edges.length}`);
    
    console.log('\n🔍 LOGGING AUTOMÁTICO:');
    console.log('   ✅ formateador.output → variables_completas, variables_faltantes');
    console.log('   ✅ router.evaluación → condiciones evaluadas');
    console.log('   ✅ router.ruta → ruta seleccionada');
    console.log('   ✅ woocommerce.input → params recibidos\n');
    
    // Actualizar
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLUJO_ID) },
      { 
        $set: { 
          nodes,
          edges,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ FLUJO ACTUALIZADO EN MONGODB\n');
      console.log('📋 FLUJO FINAL:');
      console.log('   webhook → formateador → router');
      console.log('   ├─ [completas=true] → woocommerce ✅');
      console.log('   └─ [completas=false] → pedir-datos → whatsapp → [usuario] → formateador 🔄\n');
      console.log('🚀 Render cargará este flujo en el próximo deploy');
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
