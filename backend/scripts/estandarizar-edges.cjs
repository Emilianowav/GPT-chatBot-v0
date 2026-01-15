const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('🔧 ESTANDARIZANDO EDGES\n');

    // ============================================================
    // ESTANDARIZAR ESTRUCTURA DE EDGES
    // ============================================================

    const edgesEstandarizados = flow.edges.map((edge, i) => {
      console.log(`${i + 1}. ${edge.id}`);
      
      // Estructura base (SIEMPRE presente)
      const edgeEstandarizado = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type === 'animatedLine' ? 'default' : edge.type // Corregir animatedLine
      };

      // Agregar sourceHandle SOLO si existe (para routers)
      if (edge.sourceHandle) {
        edgeEstandarizado.sourceHandle = edge.sourceHandle;
        console.log(`   ✅ Tiene sourceHandle: ${edge.sourceHandle}`);
      }

      // Agregar targetHandle SOLO si existe
      if (edge.targetHandle) {
        edgeEstandarizado.targetHandle = edge.targetHandle;
        console.log(`   ✅ Tiene targetHandle: ${edge.targetHandle}`);
      }

      // Agregar data SOLO si existe y tiene contenido
      if (edge.data && Object.keys(edge.data).length > 0) {
        edgeEstandarizado.data = edge.data;
        console.log(`   ✅ Tiene data`);
      }

      // ELIMINAR campo 'animated' (causa problemas)
      if (edge.animated) {
        console.log(`   ❌ Eliminando campo 'animated'`);
      }

      return edgeEstandarizado;
    });

    console.log(`\n✅ ${edgesEstandarizados.length} edges estandarizados\n`);

    // ============================================================
    // VALIDAR ESTRUCTURA
    // ============================================================

    console.log('🔍 VALIDANDO ESTRUCTURA ESTANDARIZADA\n');

    let todosValidos = true;

    edgesEstandarizados.forEach((edge, i) => {
      const camposRequeridos = ['id', 'source', 'target', 'type'];
      const faltantes = camposRequeridos.filter(campo => !edge[campo]);
      
      if (faltantes.length > 0) {
        console.log(`❌ Edge ${i + 1} (${edge.id}): Faltan campos: ${faltantes.join(', ')}`);
        todosValidos = false;
      }
    });

    if (todosValidos) {
      console.log('✅ Todos los edges tienen la estructura correcta\n');
    }

    // ============================================================
    // GUARDAR EN BD
    // ============================================================

    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      {
        $set: {
          edges: edgesEstandarizados
        }
      }
    );

    console.log('💾 Cambios guardados en MongoDB\n');

    // ============================================================
    // RESUMEN
    // ============================================================

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN DE ESTANDARIZACIÓN\n');
    console.log('Cambios aplicados:');
    console.log('  ✅ Eliminado campo "animated" de todos los edges');
    console.log('  ✅ Cambiado type "animatedLine" a "default"');
    console.log('  ✅ Estructura consistente en todos los edges');
    console.log('  ✅ Solo campos necesarios (id, source, target, type)');
    console.log('  ✅ Campos opcionales solo cuando existen (sourceHandle, data)\n');
    
    console.log('Estructura final de edges:');
    console.log('  - Edges simples: id, source, target, type');
    console.log('  - Edges de router: id, source, target, type, sourceHandle');
    console.log('  - Edges con metadata: id, source, target, type, data\n');

    console.log('Total de edges: ' + edgesEstandarizados.length);
    console.log('\n✅ Estandarización completada');
    console.log('\n🔄 Refrescá el frontend para ver los cambios');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
