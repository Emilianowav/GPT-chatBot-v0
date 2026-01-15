const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixFormateador() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX: FORMATEADOR - VARIABLES COMPLETAS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    const config = formateador.data.config;
    
    console.log('📋 PROBLEMA IDENTIFICADO:\n');
    console.log('El nodo tiene:');
    console.log(`   - tipo: "${config.tipo}" ✅`);
    console.log(`   - extractionConfig: ${config.extractionConfig ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   - extractionConfig.systemPrompt: ${config.extractionConfig?.systemPrompt ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   - variablesRecopilar: ${config.variablesRecopilar?.length || 0} variables`);
    console.log('');
    
    console.log('Condición en FlowExecutor.ts línea 584:');
    console.log('   if (config.tipo === "formateador" && config.extractionConfig?.systemPrompt)');
    console.log('');
    
    const cumpleCondicion = config.tipo === 'formateador' && config.extractionConfig?.systemPrompt;
    console.log(`   Resultado: ${cumpleCondicion ? 'TRUE ✅' : 'FALSE ❌'}`);
    console.log('');
    
    if (!cumpleCondicion) {
      console.log('❌ El nodo NO cumple la condición, por eso usa el modo legacy.\n');
      
      if (config.tipo !== 'formateador') {
        console.log('   Problema: config.tipo no es "formateador"');
      }
      if (!config.extractionConfig?.systemPrompt) {
        console.log('   Problema: No tiene extractionConfig.systemPrompt');
      }
      
      console.log('\nSOLUCIÓN: Asegurar que ambas condiciones se cumplan.');
      
    } else {
      console.log('✅ El nodo SÍ cumple la condición.\n');
      console.log('Si está usando el modo legacy, el problema está en otro lado.');
      console.log('Posiblemente hay un error en el código o en la lógica de ejecución.');
    }
    
    // Verificar si variablesRecopilar está vacío
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICAR MODO LEGACY\n');
    
    console.log('Condición para modo legacy (línea 674):');
    console.log('   else if (config.variablesRecopilar && config.variablesRecopilar.length > 0)');
    console.log('');
    console.log(`   config.variablesRecopilar: ${JSON.stringify(config.variablesRecopilar)}`);
    console.log(`   Longitud: ${config.variablesRecopilar?.length || 0}`);
    console.log(`   Resultado: ${config.variablesRecopilar && config.variablesRecopilar.length > 0 ? 'TRUE (entra al legacy)' : 'FALSE'}`);
    console.log('');
    
    // SOLUCIÓN
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SOLUCIÓN\n');
    
    console.log('Para que el formateador genere variables_completas y variables_faltantes:');
    console.log('');
    console.log('1. Asegurar que variablesRecopilar esté VACÍO');
    console.log('   (para que NO entre al modo legacy)');
    console.log('');
    console.log('2. Asegurar que extractionConfig.systemPrompt exista');
    console.log('   (para que entre al modo formateador)');
    console.log('');
    
    if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
      console.log('🔧 Aplicando fix: Vaciar variablesRecopilar...\n');
      
      const result = await flowsCollection.updateOne(
        { 
          _id: new ObjectId(FLOW_ID),
          'nodes.id': 'gpt-formateador'
        },
        {
          $set: {
            'nodes.$.data.config.variablesRecopilar': []
          }
        }
      );
      
      console.log(`✅ Fix aplicado: ${result.modifiedCount} nodo actualizado`);
      console.log('');
      console.log('Ahora el formateador debería:');
      console.log('   1. Usar extractionConfig (modo avanzado)');
      console.log('   2. Generar variables_completas y variables_faltantes');
      console.log('   3. Permitir que el router evalúe correctamente');
      
    } else {
      console.log('✅ variablesRecopilar ya está vacío, no se necesita fix.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateador();
