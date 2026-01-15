/**
 * Script para Eliminar variablesRecopilar del Clasificador
 * 
 * PROBLEMA:
 * El clasificador tiene variablesRecopilar (legacy) que hace que use código viejo
 * en lugar del nuevo extractionConfig
 * 
 * SOLUCIÓN:
 * Eliminar variablesRecopilar para forzar uso de extractionConfig
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixClasificador() {
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
    console.log('   tipo:', clasificador.data?.config?.tipo);
    console.log('   variablesRecopilar:', clasificador.data?.config?.variablesRecopilar ? 'SÍ (LEGACY)' : 'NO');
    console.log('   extractionConfig:', clasificador.data?.config?.extractionConfig ? 'SÍ' : 'NO');
    
    if (clasificador.data?.config?.variablesRecopilar) {
      console.log('\n⚠️  PROBLEMA ENCONTRADO:');
      console.log('   El clasificador tiene variablesRecopilar (código legacy)');
      console.log('   Esto hace que use código viejo en lugar de extractionConfig');
      
      console.log('\n🔧 CORRECCIÓN:');
      console.log('   Eliminando variablesRecopilar...');
      
      delete flow.nodes[indexClasificador].data.config.variablesRecopilar;
      
      console.log('   ✅ variablesRecopilar eliminado');
    } else {
      console.log('\n✅ El clasificador NO tiene variablesRecopilar');
      console.log('   Debería usar extractionConfig correctamente');
    }
    
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
    console.log('   tipo: formateador');
    console.log('   extractionConfig: ✅');
    console.log('   variablesRecopilar: ❌ (eliminado)');
    
    console.log('\n🧪 Próximo paso:');
    console.log('   El deploy actual debería usar extractionConfig correctamente');
    console.log('   Esperá 1-2 min y probá de nuevo');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
fixClasificador()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
