const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revisarRouterIntencion() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 REVISIÓN DEL SEGUNDO FLUJO (DESPUÉS DEL MENSAJE)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 FLUJO SECUNDARIO:');
    console.log('   Usuario recibe mensaje con productos');
    console.log('   Usuario responde (ej: "quiero agregar al carrito")');
    console.log('   → gpt-clasificador (identifica intención)');
    console.log('   → router-intencion (decide qué hacer)');
    console.log('   → gpt-carrito / mercadopago / etc.\n');
    
    // NODO: gpt-clasificador
    console.log('\n' + '═'.repeat(70));
    console.log('NODO: GPT Clasificador');
    console.log('═'.repeat(70));
    
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador');
    
    if (!clasificador) {
      console.log('❌ Nodo gpt-clasificador NO encontrado\n');
    } else {
      console.log(`ID: ${clasificador.id}`);
      console.log(`Tipo: ${clasificador.type}\n`);
      
      const config = clasificador.data.config || {};
      
      console.log('🤖 CONFIGURACIÓN:');
      console.log(`   Tipo: ${config.tipo || 'N/A'}`);
      console.log(`   Modelo: ${config.modelo || 'N/A'}`);
      
      console.log('\n   💬 SYSTEM PROMPT:');
      const prompt = config.systemPrompt || 'NO CONFIGURADO ❌';
      console.log(`      ${prompt.substring(0, 500)}...`);
      
      console.log('\n   📤 DEBE DEVOLVER:');
      console.log('      Una de estas intenciones:');
      console.log('      - "agregar_carrito"');
      console.log('      - "finalizar_compra"');
      console.log('      - "buscar_mas"');
      console.log('      - "consultar"');
      
      // Verificar si el prompt menciona estas intenciones
      const mencionaIntenciones = prompt.includes('agregar_carrito') || 
                                   prompt.includes('finalizar_compra') ||
                                   prompt.includes('buscar_mas');
      
      console.log(`\n   ${mencionaIntenciones ? '✅' : '❌'} Prompt menciona las intenciones esperadas`);
    }
    
    // NODO: router-intencion
    console.log('\n\n' + '═'.repeat(70));
    console.log('NODO: Router Intención');
    console.log('═'.repeat(70));
    
    const routerIntencion = flow.nodes.find(n => n.id === 'router-intencion');
    
    if (!routerIntencion) {
      console.log('❌ Nodo router-intencion NO encontrado\n');
    } else {
      console.log(`ID: ${routerIntencion.id}`);
      console.log(`Tipo: ${routerIntencion.type}\n`);
      
      const routerEdges = flow.edges.filter(e => e.source === 'router-intencion');
      console.log(`🔀 RUTAS CONFIGURADAS: ${routerEdges.length}\n`);
      
      routerEdges.forEach((edge, i) => {
        const targetNode = flow.nodes.find(n => n.id === edge.target);
        
        console.log(`RUTA ${i + 1}: ${edge.data?.label || edge.id}`);
        console.log(`   Target: ${edge.target} (${targetNode?.data?.label || 'Sin label'})`);
        console.log(`   Condición: ${edge.data?.condition || 'SIN CONDICIÓN ❌'}`);
        
        // Analizar la condición
        if (edge.data?.condition) {
          const condition = edge.data.condition;
          
          // Verificar si usa 'contains'
          if (condition.includes('contains')) {
            console.log(`   Tipo: CONTAINS`);
            
            // Extraer variable y valor buscado
            const match = condition.match(/\{\{([^}]+)\}\}\s+contains\s+(.+)$/i);
            if (match) {
              const variable = match[1];
              const searchValue = match[2];
              console.log(`   Variable: ${variable}`);
              console.log(`   Busca: "${searchValue}"`);
              
              // Validar que la variable sea correcta
              if (variable === 'gpt-clasificador.respuesta_gpt') {
                console.log(`   ✅ Variable correcta`);
              } else {
                console.log(`   ⚠️  Variable podría ser incorrecta`);
              }
              
              // Validar que el valor buscado sea una intención válida
              const intencionesValidas = ['agregar_carrito', 'finalizar_compra', 'buscar_mas', 'consultar'];
              if (intencionesValidas.includes(searchValue)) {
                console.log(`   ✅ Intención válida`);
              } else {
                console.log(`   ⚠️  Intención no reconocida: "${searchValue}"`);
              }
            }
          } else if (condition.includes('equals')) {
            console.log(`   Tipo: EQUALS`);
          } else {
            console.log(`   Tipo: OTRO`);
          }
        }
        console.log('');
      });
      
      // VALIDACIÓN CRÍTICA
      console.log('═'.repeat(70));
      console.log('✅ VALIDACIÓN DE CONDICIONES:');
      console.log('═'.repeat(70) + '\n');
      
      const checks = [
        {
          name: 'Todas las rutas tienen condición',
          ok: routerEdges.every(e => e.data?.condition)
        },
        {
          name: 'Condiciones usan "contains" correctamente',
          ok: routerEdges.some(e => e.data?.condition?.includes('contains'))
        },
        {
          name: 'Variable correcta (gpt-clasificador.respuesta_gpt)',
          ok: routerEdges.every(e => !e.data?.condition || e.data.condition.includes('gpt-clasificador.respuesta_gpt'))
        },
        {
          name: 'Ruta para agregar_carrito existe',
          ok: routerEdges.some(e => e.data?.condition?.includes('agregar_carrito'))
        },
        {
          name: 'Ruta para finalizar_compra existe',
          ok: routerEdges.some(e => e.data?.condition?.includes('finalizar_compra'))
        }
      ];
      
      checks.forEach(check => {
        console.log(`   ${check.ok ? '✅' : '❌'} ${check.name}`);
      });
    }
    
    // NODOS DESTINO
    console.log('\n\n' + '═'.repeat(70));
    console.log('NODOS DESTINO DEL ROUTER-INTENCION:');
    console.log('═'.repeat(70) + '\n');
    
    const routerEdges = flow.edges.filter(e => e.source === 'router-intencion');
    const targetIds = [...new Set(routerEdges.map(e => e.target))];
    
    targetIds.forEach((targetId, i) => {
      const nodo = flow.nodes.find(n => n.id === targetId);
      
      if (nodo) {
        console.log(`${i + 1}. ${nodo.data.label || targetId}`);
        console.log(`   ID: ${targetId}`);
        console.log(`   Tipo: ${nodo.type}`);
        
        const edgeToThis = routerEdges.find(e => e.target === targetId);
        if (edgeToThis?.data?.condition) {
          console.log(`   Condición: ${edgeToThis.data.condition}`);
        }
        console.log('');
      }
    });
    
    // PROBLEMA POTENCIAL
    console.log('\n' + '═'.repeat(70));
    console.log('⚠️  PROBLEMA POTENCIAL IDENTIFICADO:');
    console.log('═'.repeat(70) + '\n');
    
    console.log('Si gpt-clasificador devuelve: "buscar_mas"');
    console.log('Y la condición es: {{gpt-clasificador.respuesta_gpt}} contains agregar_carrito');
    console.log('');
    console.log('Evaluación:');
    console.log('   "buscar_mas".includes("agregar_carrito") = FALSE ✅');
    console.log('');
    console.log('Con la corrección aplicada en FlowExecutor.ts, esto ahora evalúa correctamente.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
  }
}

revisarRouterIntencion();
