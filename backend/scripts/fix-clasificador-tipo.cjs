/**
 * Script para Forzar tipo='formateador' en el Clasificador
 * 
 * PROBLEMA ENCONTRADO:
 * Los logs muestran que el clasificador tiene tipo='conversacional' en runtime
 * aunque en la BD está como 'formateador'
 * 
 * CAUSA:
 * El frontend puede estar sobrescribiendo el tipo al guardar
 * 
 * SOLUCIÓN:
 * Forzar tipo='formateador' y verificar que se mantenga
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixClasificadorTipo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    const indexClasificador = flow.nodes.findIndex(n => n.id === 'gpt-clasificador-inteligente');
    
    if (indexClasificador === -1) {
      console.log('❌ Clasificador no encontrado');
      return;
    }
    
    const clasificador = flow.nodes[indexClasificador];
    
    console.log('🔍 Configuración ACTUAL del clasificador:');
    console.log('   ID:', clasificador.id);
    console.log('   type:', clasificador.type);
    console.log('   data.config.tipo:', clasificador.data?.config?.tipo);
    console.log('   data.config.extractionConfig:', clasificador.data?.config?.extractionConfig ? 'SÍ' : 'NO');
    
    console.log('\n📋 extractionConfig completo:');
    console.log(JSON.stringify(clasificador.data?.config?.extractionConfig, null, 2));
    
    // FORZAR tipo='formateador'
    if (clasificador.data?.config) {
      const tipoAnterior = clasificador.data.config.tipo;
      clasificador.data.config.tipo = 'formateador';
      
      console.log('\n🔧 CORRECCIÓN:');
      console.log(`   Tipo anterior: "${tipoAnterior}"`);
      console.log(`   Tipo nuevo: "formateador"`);
      
      // Guardar
      console.log('\n💾 Guardando cambios...');
      
      await db.collection('flows').updateOne(
        { _id: new ObjectId(FLOW_ID) },
        { $set: { nodes: flow.nodes } }
      );
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ CLASIFICADOR CORREGIDO');
      console.log('='.repeat(60));
      
      console.log('\n📋 Configuración final:');
      console.log('   tipo: formateador ✅');
      console.log('   extractionConfig: ✅');
      console.log('   extractionConfig.systemPrompt: ✅');
      
      console.log('\n🧪 Próximo paso:');
      console.log('   1. Esperá que el deploy termine (si está en progreso)');
      console.log('   2. Limpiá el estado: node scripts/limpiar-mi-numero.js');
      console.log('   3. Probá de nuevo con "Hola" y luego "lo quiero"');
      console.log('   4. Verificá que los logs muestren:');
      console.log('      🔍 [DEBUG] Tipo de nodo: "formateador"');
      console.log('         ¿Es formateador?: true');
      
    } else {
      console.log('\n❌ No se pudo acceder a data.config');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
fixClasificadorTipo()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
