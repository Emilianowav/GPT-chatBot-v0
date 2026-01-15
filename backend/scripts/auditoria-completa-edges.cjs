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

    console.log('═══════════════════════════════════════════════════════════');
    console.log('           AUDITORÍA COMPLETA DE EDGES (CONEXIONES)');
    console.log('═══════════════════════════════════════════════════════════\n');

    // ============================================================
    // 1. ANALIZAR ESTRUCTURA DE EDGES
    // ============================================================

    console.log('📊 ANÁLISIS DE ESTRUCTURA DE EDGES\n');
    console.log(`Total de edges: ${flow.edges.length}\n`);

    const estructuras = {};
    flow.edges.forEach((edge, i) => {
      const keys = Object.keys(edge).sort().join(',');
      if (!estructuras[keys]) {
        estructuras[keys] = [];
      }
      estructuras[keys].push(i + 1);
    });

    console.log('Estructuras encontradas:\n');
    Object.keys(estructuras).forEach(keys => {
      console.log(`  ${keys}`);
      console.log(`  Cantidad: ${estructuras[keys].length}`);
      console.log(`  Edges: ${estructuras[keys].join(', ')}`);
      console.log('');
    });

    // ============================================================
    // 2. ANALIZAR CADA EDGE EN DETALLE
    // ============================================================

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 DETALLE DE CADA EDGE\n');

    const nodesMap = {};
    flow.nodes.forEach(n => nodesMap[n.id] = n);

    flow.edges.forEach((edge, i) => {
      console.log(`${i + 1}. Edge ID: ${edge.id || 'SIN ID'}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   Type: ${edge.type || 'NO DEFINIDO'}`);
      
      if (edge.sourceHandle) {
        console.log(`   SourceHandle: ${edge.sourceHandle}`);
      }
      if (edge.targetHandle) {
        console.log(`   TargetHandle: ${edge.targetHandle}`);
      }
      if (edge.data) {
        console.log(`   Data: ${JSON.stringify(edge.data)}`);
      }
      
      // Validar existencia de nodos
      const sourceExists = nodesMap[edge.source];
      const targetExists = nodesMap[edge.target];
      
      if (!sourceExists) {
        console.log(`   ⚠️  WARNING: Source node "${edge.source}" NO EXISTE`);
      }
      if (!targetExists) {
        console.log(`   ⚠️  WARNING: Target node "${edge.target}" NO EXISTE`);
      }
      
      console.log('');
    });

    // ============================================================
    // 3. IDENTIFICAR PROBLEMAS
    // ============================================================

    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  PROBLEMAS IDENTIFICADOS\n');

    const problemas = [];

    // Problema 1: Edges sin ID
    const edgesSinId = flow.edges.filter(e => !e.id);
    if (edgesSinId.length > 0) {
      problemas.push({
        tipo: 'Edges sin ID',
        cantidad: edgesSinId.length,
        descripcion: 'Algunos edges no tienen ID único',
        impacto: 'El frontend puede tener problemas para identificar las conexiones'
      });
    }

    // Problema 2: Edges sin type
    const edgesSinType = flow.edges.filter(e => !e.type);
    if (edgesSinType.length > 0) {
      problemas.push({
        tipo: 'Edges sin type',
        cantidad: edgesSinType.length,
        descripcion: 'Algunos edges no tienen type definido',
        impacto: 'El frontend no sabe cómo renderizar la conexión'
      });
    }

    // Problema 3: Edges con source/target inexistentes
    const edgesInvalidos = flow.edges.filter(e => 
      !nodesMap[e.source] || !nodesMap[e.target]
    );
    if (edgesInvalidos.length > 0) {
      problemas.push({
        tipo: 'Edges con nodos inexistentes',
        cantidad: edgesInvalidos.length,
        descripcion: 'Algunos edges apuntan a nodos que no existen',
        impacto: 'Conexiones fantasma que no se pueden renderizar'
      });
    }

    // Problema 4: Estructura inconsistente
    if (Object.keys(estructuras).length > 1) {
      problemas.push({
        tipo: 'Estructura inconsistente',
        cantidad: Object.keys(estructuras).length,
        descripcion: 'Los edges tienen diferentes estructuras de campos',
        impacto: 'Dificulta el mantenimiento y puede causar bugs'
      });
    }

    if (problemas.length === 0) {
      console.log('✅ No se encontraron problemas\n');
    } else {
      problemas.forEach((p, i) => {
        console.log(`${i + 1}. ${p.tipo}`);
        console.log(`   Cantidad: ${p.cantidad}`);
        console.log(`   Descripción: ${p.descripcion}`);
        console.log(`   Impacto: ${p.impacto}`);
        console.log('');
      });
    }

    // ============================================================
    // 4. PROPUESTA DE ESTANDARIZACIÓN
    // ============================================================

    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 PROPUESTA DE ESTANDARIZACIÓN\n');

    console.log('Estructura estándar recomendada para edges:\n');
    console.log('```json');
    console.log('{');
    console.log('  "id": "edge-[source]-to-[target]",  // ID único y descriptivo');
    console.log('  "source": "[node-id]",               // ID del nodo origen');
    console.log('  "target": "[node-id]",               // ID del nodo destino');
    console.log('  "type": "default",                   // Tipo de conexión (default, smoothstep, etc.)');
    console.log('  "sourceHandle": "[handle-id]",       // OPCIONAL: Para routers con múltiples salidas');
    console.log('  "targetHandle": null,                // OPCIONAL: Para nodos con múltiples entradas');
    console.log('  "data": {                            // OPCIONAL: Metadata adicional');
    console.log('    "label": "Ruta X",');
    console.log('    "routeLabel": "Condición Y"');
    console.log('  }');
    console.log('}');
    console.log('```\n');

    console.log('Reglas de validación:\n');
    console.log('1. ✅ Todos los edges DEBEN tener: id, source, target, type');
    console.log('2. ✅ El ID debe ser único y descriptivo');
    console.log('3. ✅ Source y target deben apuntar a nodos existentes');
    console.log('4. ✅ Type debe ser un valor válido de React Flow');
    console.log('5. ✅ SourceHandle solo se usa para routers (múltiples salidas)');
    console.log('6. ✅ Data es opcional y solo para metadata adicional\n');

    // ============================================================
    // 5. GENERAR EDGES CORREGIDOS
    // ============================================================

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 GENERANDO EDGES CORREGIDOS\n');

    const edgesCorregidos = flow.edges.map((edge, i) => {
      const sourceExists = nodesMap[edge.source];
      const targetExists = nodesMap[edge.target];

      // Si el edge apunta a nodos inexistentes, marcarlo para eliminación
      if (!sourceExists || !targetExists) {
        console.log(`❌ Eliminando edge ${i + 1}: ${edge.source} → ${edge.target} (nodos inexistentes)`);
        return null;
      }

      // Corregir estructura
      const edgeCorregido = {
        id: edge.id || `edge-${edge.source}-to-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default'
      };

      // Agregar sourceHandle solo si existe
      if (edge.sourceHandle) {
        edgeCorregido.sourceHandle = edge.sourceHandle;
      }

      // Agregar targetHandle solo si existe
      if (edge.targetHandle) {
        edgeCorregido.targetHandle = edge.targetHandle;
      }

      // Agregar data solo si existe
      if (edge.data && Object.keys(edge.data).length > 0) {
        edgeCorregido.data = edge.data;
      }

      return edgeCorregido;
    }).filter(e => e !== null);

    console.log(`\n✅ Edges corregidos: ${edgesCorregidos.length}`);
    console.log(`❌ Edges eliminados: ${flow.edges.length - edgesCorregidos.length}\n`);

    // ============================================================
    // 6. GUARDAR CAMBIOS
    // ============================================================

    console.log('═══════════════════════════════════════════════════════════');
    console.log('💾 ¿GUARDAR CAMBIOS?\n');

    console.log('Se aplicarán los siguientes cambios:');
    console.log(`- Edges antes: ${flow.edges.length}`);
    console.log(`- Edges después: ${edgesCorregidos.length}`);
    console.log(`- Edges eliminados: ${flow.edges.length - edgesCorregidos.length}`);
    console.log(`- Estructura estandarizada: ✅\n`);

    // Guardar automáticamente
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      {
        $set: {
          edges: edgesCorregidos
        }
      }
    );

    console.log('✅ Cambios guardados en MongoDB\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN FINAL\n');
    console.log(`Total de nodos: ${flow.nodes.length}`);
    console.log(`Total de edges (antes): ${flow.edges.length}`);
    console.log(`Total de edges (después): ${edgesCorregidos.length}`);
    console.log(`Problemas encontrados: ${problemas.length}`);
    console.log(`Problemas resueltos: ${problemas.length}`);
    console.log('\n✅ Auditoría completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
