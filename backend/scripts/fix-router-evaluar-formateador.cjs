require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixRouter() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 FLUJO:', flow.nombre);
    console.log('═══════════════════════════════════════\n');

    // 1. Eliminar gpt-conversacional
    console.log('🗑️  PASO 1: Eliminar nodo gpt-conversacional\n');
    
    const conversacionalNode = flow.nodes.find(n => n.id === 'gpt-conversacional');
    if (conversacionalNode) {
      console.log(`   Eliminando nodo: ${conversacionalNode.id}`);
      flow.nodes = flow.nodes.filter(n => n.id !== 'gpt-conversacional');
      
      // Eliminar edges relacionados
      const edgesEliminados = flow.edges.filter(e => 
        e.source === 'gpt-conversacional' || e.target === 'gpt-conversacional'
      );
      console.log(`   Eliminando ${edgesEliminados.length} edges relacionados:`);
      edgesEliminados.forEach(e => {
        console.log(`      - ${e.id}: ${e.source} → ${e.target}`);
      });
      
      flow.edges = flow.edges.filter(e => 
        e.source !== 'gpt-conversacional' && e.target !== 'gpt-conversacional'
      );
    } else {
      console.log('   ✅ gpt-conversacional ya no existe');
    }

    // 2. Actualizar configuración del router
    console.log('\n🔧 PASO 2: Actualizar configuración del Router\n');
    
    const router = flow.nodes.find(n => n.id === 'router');
    if (router) {
      console.log('   Router encontrado, actualizando rutas...');
      
      router.data.config.routes = [
        {
          id: 'route-1',
          label: 'Pedir Datos',
          condition: '{{gpt-formateador.variables_faltantes}} not_empty'
        },
        {
          id: 'route-2',
          label: 'Buscar en WooCommerce',
          condition: '{{gpt-formateador.variables_completas}} equals true'
        }
      ];
      
      console.log('   ✅ Rutas actualizadas:');
      router.data.config.routes.forEach(r => {
        console.log(`      - ${r.label}: ${r.condition}`);
      });
    }

    // 3. Actualizar edges del router
    console.log('\n🔗 PASO 3: Actualizar edges del Router\n');
    
    const edgeRouterPedirDatos = flow.edges.find(e => 
      e.source === 'router' && e.target === 'gpt-pedir-datos'
    );
    
    if (edgeRouterPedirDatos) {
      edgeRouterPedirDatos.data = {
        ...edgeRouterPedirDatos.data,
        label: 'Faltan variables',
        condition: '{{gpt-formateador.variables_faltantes}} not_empty'
      };
      console.log('   ✅ Edge router → gpt-pedir-datos actualizado');
    }

    const edgeRouterWoo = flow.edges.find(e => 
      e.source === 'router' && e.target === 'woocommerce'
    );
    
    if (edgeRouterWoo) {
      edgeRouterWoo.data = {
        ...edgeRouterWoo.data,
        label: 'Variables completas',
        condition: '{{gpt-formateador.variables_completas}} equals true'
      };
      console.log('   ✅ Edge router → woocommerce actualizado');
    }

    // 4. Verificar edge: gpt-formateador → router
    console.log('\n🔗 PASO 4: Verificar edge gpt-formateador → router\n');
    
    const edgeFormateadorRouter = flow.edges.find(e => 
      e.source === 'gpt-formateador' && e.target === 'router'
    );
    
    if (edgeFormateadorRouter) {
      console.log('   ✅ Edge gpt-formateador → router existe');
    } else {
      console.log('   ⚠️  Edge gpt-formateador → router NO existe, creando...');
      
      const nuevoEdge = {
        id: 'edge-formateador-router',
        source: 'gpt-formateador',
        target: 'router',
        type: 'default',
        data: {
          label: 'Variables extraídas'
        }
      };
      
      flow.edges.push(nuevoEdge);
      console.log('   ✅ Edge creado');
    }

    // Guardar cambios
    console.log('\n💾 Guardando cambios en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges 
        } 
      }
    );

    console.log('✅ Cambios guardados exitosamente\n');
    console.log('📊 RESUMEN:');
    console.log(`   Total nodos: ${flow.nodes.length}`);
    console.log(`   Total edges: ${flow.edges.length}`);
    console.log('');
    console.log('🎯 FLUJO ACTUALIZADO:');
    console.log('   Webhook → gpt-formateador → router');
    console.log('                                 ├─ Faltan variables → gpt-pedir-datos → whatsapp-preguntar');
    console.log('                                 └─ Variables completas → woocommerce → ...');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

fixRouter();
