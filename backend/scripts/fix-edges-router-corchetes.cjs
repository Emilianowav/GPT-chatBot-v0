/**
 * Script para Corregir Condiciones de Edges del Router
 * 
 * PROBLEMA:
 * Las condiciones no tienen {{}} para las variables:
 *   "tipo_accion equals comprar"
 * 
 * SOLUCIÓN:
 * Agregar {{}} para que evaluateCondition reconozca el patrón:
 *   "{{tipo_accion}} equals comprar"
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixEdgesRouter() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═'.repeat(80));
    console.log('🔧 CORRIGIENDO CONDICIONES DE EDGES DEL ROUTER');
    console.log('═'.repeat(80));
    
    // Buscar edges que salen del router
    const edgesDesdeRouter = flow.edges.filter(e => e.source === 'router-principal');
    
    console.log(`\n📋 Edges a corregir: ${edgesDesdeRouter.length}\n`);
    
    let cambios = 0;
    
    edgesDesdeRouter.forEach((edge, index) => {
      const condition = edge.data?.condition;
      
      if (!condition) {
        console.log(`${index + 1}. Edge ${edge.id}: Sin condición (skip)`);
        return;
      }
      
      // Verificar si ya tiene {{}}
      if (condition.includes('{{') && condition.includes('}}')) {
        console.log(`${index + 1}. Edge ${edge.id}: Ya tiene {{}} (skip)`);
        return;
      }
      
      // Corregir: agregar {{}} a la variable
      // Patrón: "variable operator value" → "{{variable}} operator value"
      const parts = condition.split(' ');
      if (parts.length >= 3) {
        const variable = parts[0];
        const operator = parts[1];
        const value = parts.slice(2).join(' ');
        
        const nuevaCondicion = `{{${variable}}} ${operator} ${value}`;
        
        console.log(`${index + 1}. Edge ${edge.id}:`);
        console.log(`   Destino: ${edge.target}`);
        console.log(`   Antes:   "${condition}"`);
        console.log(`   Después: "${nuevaCondicion}"`);
        
        // Actualizar en el array
        const edgeIndex = flow.edges.findIndex(e => e.id === edge.id);
        if (edgeIndex !== -1) {
          flow.edges[edgeIndex].data = flow.edges[edgeIndex].data || {};
          flow.edges[edgeIndex].data.condition = nuevaCondicion;
          cambios++;
        }
      }
    });
    
    if (cambios === 0) {
      console.log('\n✅ No hay cambios necesarios');
      return;
    }
    
    // Guardar cambios
    console.log(`\n💾 Guardando ${cambios} cambio(s)...`);
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ EDGES CORREGIDOS');
    console.log('═'.repeat(80));
    
    console.log(`\n📊 Cambios realizados: ${cambios}`);
    
    console.log('\n🧪 TESTING:');
    console.log('   1. NO hay deploy pendiente (cambio solo en BD)');
    console.log('   2. Limpiar estado: node scripts/limpiar-mi-numero.js');
    console.log('   3. Probar: "Busco Harry Potter 3" → "lo quiero"');
    console.log('   4. Verificar en logs:');
    console.log('      ✅ Clasificador extrae: tipo_accion = "comprar"');
    console.log('      ✅ Router evalúa: {{tipo_accion}} equals comprar → TRUE');
    console.log('      ✅ Va a: gpt-armar-carrito');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
fixEdgesRouter()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
