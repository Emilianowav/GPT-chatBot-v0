/**
 * Script para Corregir ExtractionConfig del Clasificador
 * 
 * PROBLEMA:
 * El clasificador tiene systemPrompt en config.systemPrompt
 * pero FlowExecutor busca en config.extractionConfig.systemPrompt
 * 
 * SOLUCIÓN:
 * Mover systemPrompt a extractionConfig.systemPrompt
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixClasificadorExtraction() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('📊 Flujo:', flow.nombre);
    
    // Encontrar clasificador
    const indexClasificador = flow.nodes.findIndex(n => n.id === 'gpt-clasificador-inteligente');
    
    if (indexClasificador === -1) {
      console.log('❌ Clasificador no encontrado');
      return;
    }
    
    const clasificador = flow.nodes[indexClasificador];
    
    console.log('\n🔍 Configuración ACTUAL del clasificador:');
    console.log('   tipo:', clasificador.data?.config?.tipo);
    console.log('   systemPrompt en config:', clasificador.data?.config?.systemPrompt ? 'SÍ' : 'NO');
    console.log('   extractionConfig:', clasificador.data?.config?.extractionConfig ? 'SÍ' : 'NO');
    if (clasificador.data?.config?.extractionConfig) {
      console.log('   extractionConfig.systemPrompt:', clasificador.data.config.extractionConfig.systemPrompt ? 'SÍ' : 'NO');
    }
    
    // Obtener el systemPrompt actual
    const systemPrompt = clasificador.data?.config?.systemPrompt;
    const extractionConfig = clasificador.data?.config?.extractionConfig || {};
    
    if (!systemPrompt) {
      console.log('\n❌ No hay systemPrompt para mover');
      return;
    }
    
    console.log('\n🔧 CORRECCIÓN:');
    console.log('   Moviendo systemPrompt de config.systemPrompt a config.extractionConfig.systemPrompt');
    
    // Crear nueva configuración
    const nuevaConfig = {
      tipo: 'formateador',
      modelo: 'gpt-4',
      temperatura: 0.3,
      extractionConfig: {
        systemPrompt: systemPrompt,
        contextSource: 'historial_completo',
        variablesToExtract: extractionConfig.variablesToExtract || [
          { nombre: 'tipo_accion', tipo: 'string', requerido: true },
          { nombre: 'confianza', tipo: 'number', requerido: true }
        ]
      }
    };
    
    // Actualizar nodo
    flow.nodes[indexClasificador].data.config = nuevaConfig;
    
    console.log('\n✅ Nueva configuración:');
    console.log('   tipo:', nuevaConfig.tipo);
    console.log('   extractionConfig.systemPrompt:', nuevaConfig.extractionConfig.systemPrompt ? 'SÍ' : 'NO');
    console.log('   extractionConfig.contextSource:', nuevaConfig.extractionConfig.contextSource);
    console.log('   extractionConfig.variablesToExtract:', nuevaConfig.extractionConfig.variablesToExtract.map(v => v.nombre).join(', '));
    
    // Guardar
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CLASIFICADOR CORREGIDO');
    console.log('='.repeat(60));
    
    console.log('\n📋 Ahora el clasificador:');
    console.log('   1. Se ejecutará como formateador');
    console.log('   2. Extraerá tipo_accion y confianza');
    console.log('   3. El router podrá evaluar tipo_accion');
    console.log('   4. El flujo de carrito funcionará');
    
    console.log('\n🧪 Próximo paso:');
    console.log('   1. Limpiar estado: node scripts/limpiar-mi-numero.js');
    console.log('   2. Enviar: "quiero comprarlo"');
    console.log('   3. Verificar en logs que tipo_accion se extrae');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
fixClasificadorExtraction()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
