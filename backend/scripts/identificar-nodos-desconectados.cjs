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

    console.log('🔍 IDENTIFICANDO NODOS DESCONECTADOS\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Crear mapa de nodos
    const nodesMap = {};
    flow.nodes.forEach(n => {
      nodesMap[n.id] = {
        id: n.id,
        type: n.type,
        label: n.data?.label || n.id,
        hasIncoming: false,
        hasOutgoing: false,
        incomingFrom: [],
        outgoingTo: []
      };
    });

    // Analizar edges
    flow.edges.forEach(edge => {
      if (nodesMap[edge.source]) {
        nodesMap[edge.source].hasOutgoing = true;
        nodesMap[edge.source].outgoingTo.push(edge.target);
      }
      if (nodesMap[edge.target]) {
        nodesMap[edge.target].hasIncoming = true;
        nodesMap[edge.target].incomingFrom.push(edge.source);
      }
    });

    // Identificar nodos sin conexiones
    const nodosDesconectados = [];
    const nodosSinEntrada = [];
    const nodosSinSalida = [];

    Object.values(nodesMap).forEach(node => {
      if (!node.hasIncoming && !node.hasOutgoing) {
        nodosDesconectados.push(node);
      } else if (!node.hasIncoming && node.type !== 'webhook') {
        nodosSinEntrada.push(node);
      } else if (!node.hasOutgoing) {
        nodosSinSalida.push(node);
      }
    });

    // Encontrar grupos desconectados
    const visitados = new Set();
    const grupos = [];

    function dfs(nodeId, grupo) {
      if (visitados.has(nodeId)) return;
      visitados.add(nodeId);
      grupo.push(nodeId);

      const node = nodesMap[nodeId];
      node.outgoingTo.forEach(targetId => dfs(targetId, grupo));
      node.incomingFrom.forEach(sourceId => dfs(sourceId, grupo));
    }

    Object.keys(nodesMap).forEach(nodeId => {
      if (!visitados.has(nodeId)) {
        const grupo = [];
        dfs(nodeId, grupo);
        grupos.push(grupo);
      }
    });

    console.log('📊 ANÁLISIS DE CONECTIVIDAD\n');
    console.log(`Total de nodos: ${flow.nodes.length}`);
    console.log(`Total de edges: ${flow.edges.length}`);
    console.log(`Grupos desconectados: ${grupos.length}\n`);

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔗 GRUPOS DE NODOS\n');

    grupos.forEach((grupo, i) => {
      console.log(`Grupo ${i + 1} (${grupo.length} nodos):`);
      grupo.forEach(nodeId => {
        const node = nodesMap[nodeId];
        console.log(`  - [${node.type}] ${node.label}`);
        if (node.incomingFrom.length > 0) {
          console.log(`    ← Desde: ${node.incomingFrom.join(', ')}`);
        }
        if (node.outgoingTo.length > 0) {
          console.log(`    → Hacia: ${node.outgoingTo.join(', ')}`);
        }
      });
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('⚠️  NODOS PROBLEMÁTICOS\n');

    if (nodosDesconectados.length > 0) {
      console.log(`❌ Nodos completamente desconectados (${nodosDesconectados.length}):`);
      nodosDesconectados.forEach(node => {
        console.log(`  - [${node.type}] ${node.label} (${node.id})`);
      });
      console.log('');
    }

    if (nodosSinEntrada.length > 0) {
      console.log(`⚠️  Nodos sin entrada (${nodosSinEntrada.length}):`);
      nodosSinEntrada.forEach(node => {
        console.log(`  - [${node.type}] ${node.label} (${node.id})`);
        console.log(`    → Hacia: ${node.outgoingTo.join(', ')}`);
      });
      console.log('');
    }

    if (nodosSinSalida.length > 0) {
      console.log(`⚠️  Nodos sin salida (${nodosSinSalida.length}):`);
      nodosSinSalida.forEach(node => {
        console.log(`  - [${node.type}] ${node.label} (${node.id})`);
        console.log(`    ← Desde: ${node.incomingFrom.join(', ')}`);
      });
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 RECOMENDACIONES\n');

    if (grupos.length > 1) {
      console.log(`Se detectaron ${grupos.length} grupos separados. Recomendaciones:\n`);
      
      // Identificar el grupo principal (el que tiene el webhook)
      const grupoPrincipalIndex = grupos.findIndex(grupo => 
        grupo.some(nodeId => nodesMap[nodeId].type === 'webhook')
      );

      if (grupoPrincipalIndex !== -1) {
        console.log(`Grupo principal (con webhook): Grupo ${grupoPrincipalIndex + 1} (${grupos[grupoPrincipalIndex].length} nodos)`);
        console.log('');
        
        grupos.forEach((grupo, i) => {
          if (i !== grupoPrincipalIndex) {
            console.log(`Grupo ${i + 1} (${grupo.length} nodos) - DESCONECTADO:`);
            grupo.forEach(nodeId => {
              const node = nodesMap[nodeId];
              console.log(`  - [${node.type}] ${node.label}`);
            });
            console.log(`  → Necesita conectarse al flujo principal\n`);
          }
        });
      }
    } else {
      console.log('✅ Todos los nodos están en un solo grupo conectado');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN\n');
    console.log(`Nodos totales: ${flow.nodes.length}`);
    console.log(`Grupos: ${grupos.length}`);
    console.log(`Nodos desconectados: ${nodosDesconectados.length}`);
    console.log(`Nodos sin entrada: ${nodosSinEntrada.length}`);
    console.log(`Nodos sin salida: ${nodosSinSalida.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
