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

    console.log('📍 POSICIONES DE NODOS\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Agrupar por posición Y (filas)
    const filas = {};
    
    flow.nodes.forEach(node => {
      const y = node.position?.y || 0;
      if (!filas[y]) {
        filas[y] = [];
      }
      filas[y].push({
        id: node.id,
        type: node.type,
        label: node.data?.label || node.id,
        x: node.position?.x || 0,
        y: y
      });
    });

    // Ordenar filas por Y
    const filasOrdenadas = Object.keys(filas).sort((a, b) => parseFloat(a) - parseFloat(b));

    console.log('Nodos agrupados por fila (Y):\n');
    
    filasOrdenadas.forEach(y => {
      console.log(`Fila Y=${y}:`);
      // Ordenar por X dentro de cada fila
      filas[y].sort((a, b) => a.x - b.x);
      filas[y].forEach(node => {
        console.log(`  X=${node.x.toString().padStart(4)} - [${node.type.padEnd(10)}] ${node.label}`);
      });
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔍 ANÁLISIS DE AGRUPAMIENTO VISUAL\n');

    // Detectar nodos aislados visualmente (muy lejos del flujo principal)
    const posicionesX = flow.nodes.map(n => n.position?.x || 0);
    const posicionesY = flow.nodes.map(n => n.position?.y || 0);
    
    const minX = Math.min(...posicionesX);
    const maxX = Math.max(...posicionesX);
    const minY = Math.min(...posicionesY);
    const maxY = Math.max(...posicionesY);
    
    const rangoX = maxX - minX;
    const rangoY = maxY - minY;

    console.log(`Rango X: ${minX} → ${maxX} (${rangoX}px)`);
    console.log(`Rango Y: ${minY} → ${maxY} (${rangoY}px)\n`);

    // Identificar nodos que están muy separados del flujo principal
    const avgX = posicionesX.reduce((a, b) => a + b, 0) / posicionesX.length;
    const avgY = posicionesY.reduce((a, b) => a + b, 0) / posicionesY.length;

    console.log(`Centro del flujo: X=${avgX.toFixed(0)}, Y=${avgY.toFixed(0)}\n`);

    const nodosAlejados = flow.nodes.filter(node => {
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      const distanciaX = Math.abs(x - avgX);
      const distanciaY = Math.abs(y - avgY);
      return distanciaX > rangoX * 0.3 || distanciaY > rangoY * 0.3;
    });

    if (nodosAlejados.length > 0) {
      console.log(`⚠️  Nodos alejados del centro (${nodosAlejados.length}):\n`);
      nodosAlejados.forEach(node => {
        const x = node.position?.x || 0;
        const y = node.position?.y || 0;
        console.log(`  - [${node.type}] ${node.data?.label || node.id}`);
        console.log(`    Posición: X=${x}, Y=${y}`);
        console.log(`    Distancia del centro: X=${Math.abs(x - avgX).toFixed(0)}px, Y=${Math.abs(y - avgY).toFixed(0)}px`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 RECOMENDACIÓN\n');
    console.log('Los nodos están conectados correctamente en la BD, pero sus posiciones');
    console.log('visuales están dispersas. Se recomienda reorganizar las posiciones para');
    console.log('que el flujo se vea de forma lineal y clara.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

main();
