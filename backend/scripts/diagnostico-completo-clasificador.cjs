/**
 * Script de Diagnóstico Completo del Clasificador
 * 
 * VERIFICA:
 * 1. Configuración en BD (tipo, extractionConfig, systemPrompt)
 * 2. Router y sus condiciones
 * 3. Edges y conexiones
 * 
 * DEDUCE:
 * - Si el problema es de configuración en BD
 * - Si el problema es de código (parsing JSON)
 * - Si el problema es de conexiones (router)
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function diagnosticoCompleto() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═'.repeat(80));
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL CLASIFICADOR');
    console.log('═'.repeat(80));
    
    // ============================================================
    // 1. VERIFICAR CLASIFICADOR
    // ============================================================
    console.log('\n📋 1. CONFIGURACIÓN DEL CLASIFICADOR');
    console.log('─'.repeat(80));
    
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    
    if (!clasificador) {
      console.log('❌ PROBLEMA CRÍTICO: Clasificador no encontrado en BD');
      return;
    }
    
    const config = clasificador.data?.config;
    const extractionConfig = config?.extractionConfig;
    
    console.log('✅ Clasificador encontrado');
    console.log(`   ID: ${clasificador.id}`);
    console.log(`   Tipo: ${clasificador.type}`);
    console.log(`   Label: ${clasificador.data?.label}`);
    console.log(`   config.tipo: ${config?.tipo}`);
    console.log(`   config.modelo: ${config?.modelo}`);
    console.log(`   config.temperatura: ${config?.temperatura}`);
    
    // Verificar extractionConfig
    let problemaExtraction = false;
    if (!extractionConfig) {
      console.log('   ❌ extractionConfig: NO EXISTE');
      problemaExtraction = true;
    } else {
      console.log('   ✅ extractionConfig: EXISTE');
      console.log(`      systemPrompt length: ${extractionConfig.systemPrompt?.length || 0}`);
      console.log(`      variablesToExtract: ${extractionConfig.variablesToExtract?.length || 0} variables`);
      
      if (extractionConfig.variablesToExtract) {
        extractionConfig.variablesToExtract.forEach(v => {
          console.log(`         - ${v.nombre} (${v.tipo}, requerido: ${v.requerido})`);
        });
      }
    }
    
    // Verificar systemPrompt
    let problemaPrompt = false;
    if (!extractionConfig?.systemPrompt) {
      console.log('   ❌ systemPrompt: NO EXISTE');
      problemaPrompt = true;
    } else {
      const prompt = extractionConfig.systemPrompt;
      const tieneJSON = prompt.includes('JSON') || prompt.includes('json');
      const tieneFormato = prompt.includes('FORMATO DE RESPUESTA');
      const tieneEstructura = prompt.includes('tipo_accion') && prompt.includes('confianza');
      
      console.log('   ✅ systemPrompt: EXISTE');
      console.log(`      Menciona JSON: ${tieneJSON ? '✅' : '❌'}`);
      console.log(`      Tiene "FORMATO DE RESPUESTA": ${tieneFormato ? '✅' : '❌'}`);
      console.log(`      Define estructura (tipo_accion, confianza): ${tieneEstructura ? '✅' : '❌'}`);
      
      if (!tieneJSON || !tieneFormato || !tieneEstructura) {
        problemaPrompt = true;
      }
    }
    
    // ============================================================
    // 2. VERIFICAR ROUTER
    // ============================================================
    console.log('\n📋 2. CONFIGURACIÓN DEL ROUTER PRINCIPAL');
    console.log('─'.repeat(80));
    
    const router = flow.nodes.find(n => n.id === 'router-principal');
    
    if (!router) {
      console.log('❌ PROBLEMA CRÍTICO: Router no encontrado');
      return;
    }
    
    console.log('✅ Router encontrado');
    console.log(`   ID: ${router.id}`);
    console.log(`   Rutas configuradas: ${router.data?.config?.routes?.length || 0}`);
    
    if (router.data?.config?.routes) {
      router.data.config.routes.forEach((route, i) => {
        console.log(`   ${i + 1}. ${route.label}`);
        console.log(`      Condición: ${route.condition}`);
      });
    }
    
    // ============================================================
    // 3. VERIFICAR EDGES
    // ============================================================
    console.log('\n📋 3. EDGES Y CONEXIONES');
    console.log('─'.repeat(80));
    
    const edgesDesdeClasificador = flow.edges.filter(e => e.source === 'gpt-clasificador-inteligente');
    const edgesDesdeRouter = flow.edges.filter(e => e.source === 'router-principal');
    
    console.log(`Edges desde clasificador: ${edgesDesdeClasificador.length}`);
    edgesDesdeClasificador.forEach(e => {
      console.log(`   → ${e.target} (condición: ${e.data?.condition || 'ninguna'})`);
    });
    
    console.log(`\nEdges desde router: ${edgesDesdeRouter.length}`);
    let edgeACarrito = null;
    edgesDesdeRouter.forEach(e => {
      console.log(`   → ${e.target} (condición: ${e.data?.condition || 'ninguna'})`);
      if (e.target === 'gpt-armar-carrito') {
        edgeACarrito = e;
      }
    });
    
    // ============================================================
    // 4. VERIFICAR NODO DESTINO
    // ============================================================
    console.log('\n📋 4. NODO DESTINO: gpt-armar-carrito');
    console.log('─'.repeat(80));
    
    const nodoCarrito = flow.nodes.find(n => n.id === 'gpt-armar-carrito');
    
    let problemaCarrito = false;
    if (!nodoCarrito) {
      console.log('❌ Nodo gpt-armar-carrito NO EXISTE');
      problemaCarrito = true;
    } else {
      console.log('✅ Nodo encontrado');
      console.log(`   Label: ${nodoCarrito.data?.label}`);
      console.log(`   Tipo: ${nodoCarrito.type}`);
      console.log(`   Tiene config: ${!!nodoCarrito.data?.config}`);
      
      if (!nodoCarrito.data?.config?.systemPrompt && !nodoCarrito.data?.config?.extractionConfig) {
        console.log('   ⚠️  ADVERTENCIA: Nodo sin configuración (sin systemPrompt ni extractionConfig)');
      }
    }
    
    // ============================================================
    // 5. DIAGNÓSTICO Y CONCLUSIONES
    // ============================================================
    console.log('\n\n═'.repeat(80));
    console.log('📊 DIAGNÓSTICO Y CONCLUSIONES');
    console.log('═'.repeat(80));
    
    const problemas = [];
    
    // Verificar configuración del clasificador
    if (config?.tipo !== 'formateador') {
      problemas.push({
        tipo: 'CONFIGURACIÓN BD',
        severidad: 'CRÍTICO',
        problema: 'Clasificador no tiene tipo="formateador"',
        solucion: 'Ejecutar: node scripts/fix-clasificador-tipo.cjs'
      });
    }
    
    if (problemaExtraction) {
      problemas.push({
        tipo: 'CONFIGURACIÓN BD',
        severidad: 'CRÍTICO',
        problema: 'Clasificador no tiene extractionConfig',
        solucion: 'Ejecutar: node scripts/fix-clasificador-extraction.cjs'
      });
    }
    
    if (problemaPrompt) {
      problemas.push({
        tipo: 'CONFIGURACIÓN BD',
        severidad: 'ALTO',
        problema: 'SystemPrompt no tiene instrucciones JSON correctas',
        solucion: 'Ejecutar: node scripts/fix-clasificador-json-format.cjs'
      });
    }
    
    if (!edgeACarrito) {
      problemas.push({
        tipo: 'CONFIGURACIÓN BD',
        severidad: 'CRÍTICO',
        problema: 'No hay edge del router a gpt-armar-carrito',
        solucion: 'Crear edge en el frontend con condición: tipo_accion equals comprar'
      });
    } else if (!edgeACarrito.data?.condition || !edgeACarrito.data.condition.includes('comprar')) {
      problemas.push({
        tipo: 'CONFIGURACIÓN BD',
        severidad: 'ALTO',
        problema: 'Edge a carrito no tiene condición correcta',
        solucion: 'Verificar condición del edge: debe ser "tipo_accion equals comprar"'
      });
    }
    
    if (problemaCarrito) {
      problemas.push({
        tipo: 'CONFIGURACIÓN BD',
        severidad: 'ALTO',
        problema: 'Nodo gpt-armar-carrito no existe',
        solucion: 'Crear nodo en el frontend'
      });
    }
    
    // Mostrar problemas
    if (problemas.length === 0) {
      console.log('\n✅ CONFIGURACIÓN EN BD: CORRECTA');
      console.log('   Todas las configuraciones están bien en la base de datos.');
      console.log('\n🔍 POSIBLE PROBLEMA: CÓDIGO');
      console.log('   Si el clasificador sigue sin funcionar, el problema está en:');
      console.log('   1. GPT no respeta las instrucciones JSON');
      console.log('   2. El parsing de JSON falla');
      console.log('   3. El código no está actualizado en producción (deploy pendiente)');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   - Verificar que el último deploy se completó');
      console.log('   - Revisar logs de producción para ver si el JSON se extrae correctamente');
      console.log('   - El código ya tiene extracción con regex para manejar respuestas con texto adicional');
    } else {
      console.log('\n❌ PROBLEMAS ENCONTRADOS:');
      problemas.forEach((p, i) => {
        console.log(`\n${i + 1}. [${p.severidad}] ${p.tipo}`);
        console.log(`   Problema: ${p.problema}`);
        console.log(`   Solución: ${p.solucion}`);
      });
      
      console.log('\n💡 RECOMENDACIÓN:');
      console.log('   Ejecutar los scripts de corrección en el orden listado arriba.');
    }
    
    // Estado esperado vs actual
    console.log('\n\n═'.repeat(80));
    console.log('📋 ESTADO ESPERADO VS ACTUAL');
    console.log('═'.repeat(80));
    
    console.log('\n✅ ESTADO ESPERADO:');
    console.log('   1. Clasificador:');
    console.log('      - tipo: "formateador"');
    console.log('      - extractionConfig.systemPrompt: con instrucciones JSON');
    console.log('      - extractionConfig.variablesToExtract: [tipo_accion, confianza]');
    console.log('   2. Router:');
    console.log('      - Edge a gpt-armar-carrito con condición: tipo_accion equals comprar');
    console.log('   3. Nodo gpt-armar-carrito:');
    console.log('      - Existe y tiene configuración');
    
    console.log('\n📊 ESTADO ACTUAL:');
    console.log(`   1. Clasificador tipo: ${config?.tipo === 'formateador' ? '✅' : '❌'} "${config?.tipo}"`);
    console.log(`   2. extractionConfig: ${extractionConfig ? '✅' : '❌'}`);
    console.log(`   3. systemPrompt con JSON: ${!problemaPrompt ? '✅' : '❌'}`);
    console.log(`   4. Edge a carrito: ${edgeACarrito ? '✅' : '❌'}`);
    console.log(`   5. Nodo carrito existe: ${nodoCarrito ? '✅' : '❌'}`);
    
    console.log('\n\n═'.repeat(80));
    console.log('🎯 CONCLUSIÓN FINAL');
    console.log('═'.repeat(80));
    
    if (problemas.length === 0) {
      console.log('\n✅ CONFIGURACIÓN BD: CORRECTA');
      console.log('❓ PROBLEMA: Probablemente en CÓDIGO o DEPLOY');
      console.log('\n🔧 ACCIONES:');
      console.log('   1. Verificar que el deploy se completó (revisar Render)');
      console.log('   2. Limpiar estado: node scripts/limpiar-mi-numero.js');
      console.log('   3. Probar flujo: "Busco Harry Potter 3" → "lo quiero"');
      console.log('   4. Revisar logs para ver si el JSON se extrae con regex');
    } else {
      console.log('\n❌ CONFIGURACIÓN BD: INCORRECTA');
      console.log('🔧 PROBLEMA: En BASE DE DATOS');
      console.log('\n🔧 ACCIONES:');
      console.log('   1. Ejecutar scripts de corrección listados arriba');
      console.log('   2. Verificar cambios en BD');
      console.log('   3. Probar flujo nuevamente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
diagnosticoCompleto()
  .then(() => {
    console.log('\n✅ Diagnóstico completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnóstico falló:', error);
    process.exit(1);
  });
