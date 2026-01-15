const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function debugFormateador() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    console.log('📊 CONFIGURACIÓN DEL FORMATEADOR:\n');
    console.log('Tipo:', formateador.data.config.tipo);
    console.log('\nVariables a extraer:');
    formateador.data.config.extractionConfig.variables.forEach(v => {
      console.log(`  - ${v.nombre} (${v.tipo}, requerido: ${v.requerido})`);
    });
    
    console.log('\n🔍 LÓGICA DE VALIDACIÓN:');
    console.log('El formateador genera:');
    console.log('  - variables_completas: true/false');
    console.log('  - variables_faltantes: array de nombres');
    
    console.log('\n⚠️ PROBLEMA DETECTADO:');
    console.log('Cuando el usuario dice "cualquiera":');
    console.log('  1. GPT extrae: {"titulo": "Harry Potter 5", "editorial": null, "edicion": null}');
    console.log('  2. Código valida: editorial y edicion son null');
    console.log('  3. Resultado: variables_faltantes = ["editorial", "edicion"]');
    console.log('  4. Router evalúa: {{gpt-formateador.variables_faltantes}} not_empty = TRUE');
    console.log('  5. Toma route-1 (pedir datos) en lugar de route-2 (WooCommerce)');
    
    console.log('\n💡 SOLUCIÓN:');
    console.log('El problema NO es el prompt del formateador.');
    console.log('El problema es que el código de validación (líneas 647-665 de FlowExecutor.ts)');
    console.log('considera que una variable con valor null = falta.');
    console.log('\nPero "cualquiera" debería ser un valor VÁLIDO para variables opcionales.');
    
    console.log('\n🔧 OPCIONES:');
    console.log('1. Modificar la validación para que "cualquiera" cuente como valor válido');
    console.log('2. Cambiar las variables editorial/edicion a NO requeridas y aceptar null');
    console.log('3. Usar una condición diferente en el router');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugFormateador();
