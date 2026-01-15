const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function debugRouterProblema() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 DEBUG: POR QUÉ EL FLUJO NO LLEGA A WOOCOMMERCE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. ANALIZAR NODO FORMATEADOR
    console.log('PASO 1: CONFIGURACIÓN DEL FORMATEADOR\n');
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    const extractionConfig = formateador.data.config.extractionConfig;
    
    console.log('Variables configuradas:');
    extractionConfig.variables.forEach(v => {
      console.log(`   - ${v.nombre}: ${v.requerido ? 'REQUERIDA ✅' : 'OPCIONAL ⚪'}`);
    });
    console.log('');
    
    // 2. SIMULAR OUTPUT DEL FORMATEADOR
    console.log('PASO 2: SIMULACIÓN DEL OUTPUT DEL FORMATEADOR\n');
    
    console.log('Cuando el usuario dice: "Busco harry potter"\n');
    console.log('El formateador extrae:');
    console.log('   titulo: "Harry Potter" ✅');
    console.log('   editorial: null (no mencionada)');
    console.log('   edicion: null (no mencionada)\n');
    
    console.log('Lógica de variables_completas (líneas 654-664 de FlowExecutor.ts):');
    console.log('   - titulo: REQUERIDA + tiene valor → OK ✅');
    console.log('   - editorial: OPCIONAL + sin valor → NO se marca como faltante ✅');
    console.log('   - edicion: OPCIONAL + sin valor → NO se marca como faltante ✅\n');
    
    console.log('Resultado esperado:');
    console.log('   variables_completas: true ✅');
    console.log('   variables_faltantes: [] (array vacío) ✅\n');
    
    // 3. ANALIZAR ROUTER
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 3: CONDICIONES DEL ROUTER\n');
    
    const routerEdges = flow.edges.filter(e => e.source === 'router');
    
    console.log('Rutas configuradas:\n');
    routerEdges.forEach((edge, i) => {
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      console.log(`RUTA ${i + 1}: ${edge.data?.label || edge.id}`);
      console.log(`   Target: ${edge.target} (${targetNode?.data?.label})`);
      console.log(`   Condición: ${edge.data?.condition}`);
      console.log('');
    });
    
    // 4. EVALUAR CONDICIONES CON DATOS SIMULADOS
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 4: EVALUACIÓN DE CONDICIONES\n');
    
    const simulatedVars = {
      'gpt-formateador.variables_completas': true,
      'gpt-formateador.variables_faltantes': []
    };
    
    console.log('Variables globales simuladas:');
    Object.entries(simulatedVars).forEach(([key, value]) => {
      console.log(`   ${key}: ${JSON.stringify(value)}`);
    });
    console.log('');
    
    routerEdges.forEach((edge, i) => {
      const condition = edge.data?.condition;
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      
      console.log(`Evaluando RUTA ${i + 1}: ${edge.data?.label}`);
      console.log(`   Condición: ${condition}`);
      
      if (!condition) {
        console.log(`   ⚠️  Sin condición → TRUE por defecto`);
      } else {
        // Parsear condición
        let result = false;
        
        if (condition.includes('not_empty')) {
          const match = condition.match(/\{\{([^}]+)\}\}\s+not_empty/);
          if (match) {
            const varName = match[1];
            const value = simulatedVars[varName];
            result = Array.isArray(value) ? value.length > 0 : !!value;
            console.log(`   Variable: ${varName}`);
            console.log(`   Valor: ${JSON.stringify(value)}`);
            console.log(`   Evaluación: not_empty → ${result ? 'TRUE' : 'FALSE'}`);
          }
        } else if (condition.includes('equals')) {
          const match = condition.match(/\{\{([^}]+)\}\}\s+equals\s+(.+)$/);
          if (match) {
            const varName = match[1];
            const expectedValue = match[2];
            const value = simulatedVars[varName];
            result = String(value).toLowerCase() === expectedValue.toLowerCase();
            console.log(`   Variable: ${varName}`);
            console.log(`   Valor: ${JSON.stringify(value)}`);
            console.log(`   Esperado: ${expectedValue}`);
            console.log(`   Evaluación: equals → ${result ? 'TRUE' : 'FALSE'}`);
          }
        }
        
        console.log(`   Resultado: ${result ? '✅ TRUE → Toma esta ruta' : '❌ FALSE → Continúa'}`);
      }
      console.log('');
    });
    
    // 5. IDENTIFICAR EL PROBLEMA
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 5: DIAGNÓSTICO DEL PROBLEMA\n');
    
    const ruta1 = routerEdges[0];
    const ruta2 = routerEdges[1];
    
    console.log('❌ PROBLEMA IDENTIFICADO:\n');
    
    if (ruta1.data?.condition?.includes('not_empty')) {
      console.log('La RUTA 1 evalúa: {{gpt-formateador.variables_faltantes}} not_empty');
      console.log('');
      console.log('Con variables_faltantes = [] (array vacío):');
      console.log('   [].length > 0 = FALSE ❌');
      console.log('   → No toma esta ruta (correcto)');
      console.log('');
      console.log('Pero el router evalúa las rutas EN ORDEN.');
      console.log('Si la RUTA 1 es FALSE, pasa a evaluar la RUTA 2.');
      console.log('');
    }
    
    if (ruta2.data?.condition?.includes('equals true')) {
      console.log('La RUTA 2 evalúa: {{gpt-formateador.variables_completas}} equals true');
      console.log('');
      console.log('Con variables_completas = true:');
      console.log('   true === true = TRUE ✅');
      console.log('   → Debería tomar esta ruta hacia WooCommerce');
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICACIÓN EN LOGS DE LA PRUEBA ANTERIOR\n');
    
    console.log('En los logs vimos:');
    console.log('   "titulo": "Harry Potter" ✅');
    console.log('   "variables_completas": true ✅');
    console.log('   "variables_faltantes": [] ✅');
    console.log('');
    console.log('Pero el flujo fue a: gpt-pedir-datos ❌');
    console.log('');
    console.log('Esto significa que:');
    console.log('   1. La RUTA 1 (not_empty) evaluó TRUE incorrectamente, O');
    console.log('   2. La RUTA 2 (equals true) no se evaluó, O');
    console.log('   3. El orden de las rutas está invertido');
    console.log('');
    
    // 6. VERIFICAR ORDEN DE RUTAS
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 6: VERIFICAR ORDEN DE LAS RUTAS\n');
    
    console.log('Orden actual en MongoDB:');
    routerEdges.forEach((edge, i) => {
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      console.log(`   ${i + 1}. ${edge.data?.label} → ${targetNode?.data?.label}`);
      console.log(`      Condición: ${edge.data?.condition}`);
    });
    console.log('');
    
    console.log('⚠️  PROBLEMA CRÍTICO:');
    console.log('');
    console.log('Si la RUTA 1 va a "gpt-pedir-datos" y se evalúa primero,');
    console.log('y la condición es "variables_faltantes not_empty",');
    console.log('entonces cuando variables_faltantes = [],');
    console.log('debería evaluar FALSE y pasar a la RUTA 2.');
    console.log('');
    console.log('Pero en los logs vimos que fue a gpt-pedir-datos.');
    console.log('');
    console.log('Esto sugiere que:');
    console.log('   ❌ El formateador está devolviendo variables_faltantes con valores');
    console.log('   ❌ La evaluación de "not_empty" está incorrecta');
    console.log('   ❌ El output del formateador no se está guardando correctamente');
    console.log('');
    
    // 7. REVISAR OUTPUT REAL DEL FORMATEADOR EN LOGS
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 7: ANÁLISIS DEL OUTPUT REAL DEL FORMATEADOR\n');
    
    console.log('En los logs de la prueba anterior vimos:');
    console.log('');
    console.log('Nodo gpt-pedir-datos output:');
    console.log('   "variables_completas": true ✅');
    console.log('   "variables_faltantes": [] ✅');
    console.log('');
    console.log('Pero ANTES del router, el output del gpt-formateador debería ser:');
    console.log('   {');
    console.log('     "titulo": "Harry Potter",');
    console.log('     "editorial": null,');
    console.log('     "edicion": null,');
    console.log('     "variables_completas": true,');
    console.log('     "variables_faltantes": []');
    console.log('   }');
    console.log('');
    console.log('Si el router está evaluando variables_faltantes y tomando la ruta');
    console.log('hacia gpt-pedir-datos, significa que:');
    console.log('');
    console.log('   ❌ variables_faltantes NO está vacío en el momento de la evaluación');
    console.log('   ❌ El formateador está marcando editorial y edicion como faltantes');
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SOLUCIÓN\n');
    
    console.log('El problema está en la lógica del formateador en FlowExecutor.ts');
    console.log('');
    console.log('Necesito revisar las líneas 654-664 para asegurar que:');
    console.log('   1. Solo variables REQUERIDAS se marcan como faltantes');
    console.log('   2. Variables OPCIONALES con valor null NO se marcan como faltantes');
    console.log('   3. variables_completas = true cuando todas las REQUERIDAS tienen valor');
    console.log('');
    console.log('Luego, probar nuevamente con un mensaje que solo tenga el título.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugRouterProblema();
