/**
 * Script para agregar las conexiones faltantes en el flujo Veo Veo
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function agregarConexionesFaltantes() {
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
    console.log('🔗 AGREGANDO CONEXIONES FALTANTES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const nuevasConexiones = [];
    
    // 1. router (route-2) → whatsapp-solicitar-datos
    console.log('1. Agregando: router (route-2) → whatsapp-solicitar-datos');
    nuevasConexiones.push({
      id: 'edge-router-solicitar',
      source: 'router',
      target: 'whatsapp-solicitar-datos',
      sourceHandle: 'route-2',
      type: 'default',
      animated: false
    });
    
    // 2. whatsapp-preguntar → whatsapp-solicitar-datos
    console.log('2. Agregando: whatsapp-preguntar → whatsapp-solicitar-datos');
    nuevasConexiones.push({
      id: 'edge-preguntar-solicitar',
      source: 'whatsapp-preguntar',
      target: 'whatsapp-solicitar-datos',
      type: 'default',
      animated: false
    });
    
    // 3. router-principal (route-consultar) → gpt-asistente-ventas (para consultas generales)
    console.log('3. Agregando: router-principal (route-consultar) → gpt-asistente-ventas');
    nuevasConexiones.push({
      id: 'edge-router-consultar',
      source: 'router-principal',
      target: 'gpt-asistente-ventas',
      sourceHandle: 'route-consultar',
      type: 'default',
      animated: false
    });
    
    // 4. router-principal (route-despedida) → whatsapp-asistente (mensaje de despedida)
    console.log('4. Agregando: router-principal (route-despedida) → whatsapp-asistente');
    nuevasConexiones.push({
      id: 'edge-router-despedida',
      source: 'router-principal',
      target: 'whatsapp-asistente',
      sourceHandle: 'route-despedida',
      type: 'default',
      animated: false
    });
    
    console.log('\n📋 Conexiones a agregar:', nuevasConexiones.length);
    
    // Agregar las nuevas conexiones
    flow.edges.push(...nuevasConexiones);
    
    // Actualizar hasConnection en los nodos afectados
    const nodosActualizar = ['whatsapp-preguntar', 'whatsapp-solicitar-datos'];
    
    flow.nodes.forEach(node => {
      if (nodosActualizar.includes(node.id)) {
        node.data.hasConnection = true;
      }
    });
    
    // Guardar
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          edges: flow.edges,
          nodes: flow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Conexiones agregadas correctamente');
    console.log(`   Total edges ahora: ${flow.edges.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
agregarConexionesFaltantes()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
