/**
 * Script para REVERTIR todas las conexiones agregadas
 * Eliminar las 4 conexiones que agregamos
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revertirConexiones() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    const flow = await db.collection('flows').findOne({ 
      _id: new ObjectId(FLOW_ID) 
    });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⏪ REVIRTIENDO CONEXIONES AGREGADAS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`Total edges ANTES: ${flow.edges.length}`);
    
    // IDs de las conexiones que agregamos
    const conexionesAEliminar = [
      'edge-router-solicitar',
      'edge-preguntar-solicitar',
      'edge-router-consultar',
      'edge-router-despedida'
    ];
    
    // Filtrar edges para eliminar las conexiones agregadas
    const edgesOriginales = flow.edges.filter(edge => 
      !conexionesAEliminar.includes(edge.id)
    );
    
    console.log(`Total edges DESPUÉS: ${edgesOriginales.length}`);
    console.log(`\nConexiones eliminadas: ${flow.edges.length - edgesOriginales.length}`);
    
    conexionesAEliminar.forEach(id => {
      const edge = flow.edges.find(e => e.id === id);
      if (edge) {
        console.log(`   ❌ ${id}: ${edge.source} → ${edge.target}`);
      }
    });
    
    // Guardar
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          edges: edgesOriginales,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Conexiones revertidas correctamente');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
revertirConexiones()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
