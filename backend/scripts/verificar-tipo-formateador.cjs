const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarTipoFormateador() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICAR CONFIGURACIÓN DEL NODO FORMATEADOR');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    if (!formateador) {
      console.log('❌ Nodo gpt-formateador NO encontrado');
      return;
    }
    
    console.log('✅ Nodo encontrado\n');
    
    const config = formateador.data.config;
    
    console.log('📋 CONFIGURACIÓN COMPLETA:\n');
    console.log(JSON.stringify(config, null, 2));
    console.log('\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 VALIDACIÓN CRÍTICA\n');
    
    const checks = [
      {
        name: 'config.tipo',
        value: config.tipo,
        expected: 'formateador',
        ok: config.tipo === 'formateador'
      },
      {
        name: 'config.extractionConfig existe',
        value: !!config.extractionConfig,
        expected: true,
        ok: !!config.extractionConfig
      },
      {
        name: 'config.extractionConfig.systemPrompt existe',
        value: !!config.extractionConfig?.systemPrompt,
        expected: true,
        ok: !!config.extractionConfig?.systemPrompt
      },
      {
        name: 'config.extractionConfig.enabled',
        value: config.extractionConfig?.enabled,
        expected: true,
        ok: config.extractionConfig?.enabled === true
      },
      {
        name: 'config.extractionConfig.variables existe',
        value: !!config.extractionConfig?.variables,
        expected: true,
        ok: !!config.extractionConfig?.variables
      },
      {
        name: 'Cantidad de variables',
        value: config.extractionConfig?.variables?.length,
        expected: 3,
        ok: config.extractionConfig?.variables?.length === 3
      }
    ];
    
    checks.forEach(check => {
      console.log(`${check.ok ? '✅' : '❌'} ${check.name}`);
      console.log(`   Valor actual: ${JSON.stringify(check.value)}`);
      console.log(`   Esperado: ${JSON.stringify(check.expected)}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 DIAGNÓSTICO\n');
    
    const tipoIncorrecto = config.tipo !== 'formateador';
    const noTieneExtraction = !config.extractionConfig;
    const noTienePrompt = !config.extractionConfig?.systemPrompt;
    
    if (tipoIncorrecto) {
      console.log('❌ PROBLEMA CRÍTICO: config.tipo NO es "formateador"\n');
      console.log(`   Valor actual: "${config.tipo}"`);
      console.log('   Esperado: "formateador"\n');
      console.log('Esto hace que el código NO ejecute la lógica de extracción');
      console.log('que genera variables_completas y variables_faltantes.\n');
      console.log('SOLUCIÓN: Cambiar config.tipo a "formateador"');
      
    } else if (noTieneExtraction) {
      console.log('❌ PROBLEMA: No tiene extractionConfig\n');
      console.log('SOLUCIÓN: Agregar extractionConfig con variables');
      
    } else if (noTienePrompt) {
      console.log('❌ PROBLEMA: No tiene systemPrompt en extractionConfig\n');
      console.log('SOLUCIÓN: Agregar systemPrompt');
      
    } else {
      console.log('✅ CONFIGURACIÓN CORRECTA\n');
      console.log('El nodo debería generar variables_completas y variables_faltantes.');
      console.log('Si no lo está haciendo, el problema está en otro lado.');
    }
    
    // Mostrar variables configuradas
    if (config.extractionConfig?.variables) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📋 VARIABLES CONFIGURADAS:\n');
      
      config.extractionConfig.variables.forEach((v, i) => {
        console.log(`${i + 1}. ${v.nombre}`);
        console.log(`   Tipo: ${v.tipo}`);
        console.log(`   Requerido: ${v.requerido ? 'SÍ ✅' : 'NO ⚪'}`);
        console.log(`   Descripción: ${v.descripcion || 'N/A'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarTipoFormateador();
