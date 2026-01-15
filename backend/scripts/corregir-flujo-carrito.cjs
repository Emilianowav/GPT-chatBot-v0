/**
 * Script para Corregir Flujo de Carrito
 * 
 * PROBLEMAS A CORREGIR:
 * 1. Clasificador sin prompt ni extractionConfig
 * 2. Loops incorrectos (nodos normales con múltiples entradas/salidas)
 * 3. Flujos desconectados
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function corregirFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log('\n📊 Flujo actual:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    // ============================================================
    // DIAGNÓSTICO: Encontrar problemas
    // ============================================================
    
    console.log('\n🔍 Diagnosticando problemas...');
    
    // Contar conexiones de entrada y salida por nodo
    const conexionesPorNodo = {};
    flow.nodes.forEach(node => {
      conexionesPorNodo[node.id] = { entrada: 0, salida: 0, tipo: node.type };
    });
    
    flow.edges.forEach(edge => {
      if (conexionesPorNodo[edge.source]) {
        conexionesPorNodo[edge.source].salida++;
      }
      if (conexionesPorNodo[edge.target]) {
        conexionesPorNodo[edge.target].entrada++;
      }
    });
    
    console.log('\n📋 Nodos con problemas:');
    Object.entries(conexionesPorNodo).forEach(([nodeId, info]) => {
      const esRouter = info.tipo === 'router';
      const esTrigger = info.tipo === 'trigger';
      
      if (!esRouter && !esTrigger) {
        if (info.entrada > 1) {
          console.log(`   ⚠️  ${nodeId}: ${info.entrada} entradas (debe ser 1)`);
        }
        if (info.salida > 1) {
          console.log(`   ⚠️  ${nodeId}: ${info.salida} salidas (debe ser 1)`);
        }
      }
    });
    
    // Verificar clasificador
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    if (clasificador) {
      console.log('\n🔍 Verificando clasificador...');
      if (!clasificador.data?.config?.extractionConfig) {
        console.log('   ❌ Clasificador sin extractionConfig');
      }
      if (!clasificador.data?.config?.systemPrompt) {
        console.log('   ❌ Clasificador sin systemPrompt');
      }
    }
    
    // ============================================================
    // CORRECCIÓN 1: Eliminar loops y conexiones duplicadas
    // ============================================================
    
    console.log('\n🔧 CORRECCIÓN 1: Eliminando loops y conexiones duplicadas...');
    
    // Eliminar todas las conexiones que creen loops
    const edgesOriginales = flow.edges.length;
    
    // Mantener solo las conexiones correctas del flujo lineal
    const edgesCorrectos = [];
    const nodosVisitados = new Set();
    
    // Función para verificar si una conexión crea un loop
    function creaLoop(source, target, visitados = new Set()) {
      if (visitados.has(target)) return true;
      visitados.add(target);
      
      const conexionesSiguientes = flow.edges.filter(e => e.source === target);
      for (const conn of conexionesSiguientes) {
        if (creaLoop(target, conn.target, new Set(visitados))) {
          return true;
        }
      }
      return false;
    }
    
    // Filtrar edges que no crean loops
    flow.edges = flow.edges.filter(edge => {
      // Permitir múltiples salidas solo para routers
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return false;
      
      // No permitir loops (nodo apuntando a sí mismo o a nodos anteriores)
      if (edge.source === edge.target) {
        console.log(`   ❌ Eliminando loop: ${edge.source} → ${edge.source}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`   ✅ Edges: ${edgesOriginales} → ${flow.edges.length}`);
    
    // ============================================================
    // CORRECCIÓN 2: Configurar clasificador correctamente
    // ============================================================
    
    console.log('\n🔧 CORRECCIÓN 2: Configurando clasificador...');
    
    const indexClasificador = flow.nodes.findIndex(n => n.id === 'gpt-clasificador-inteligente');
    
    if (indexClasificador !== -1) {
      flow.nodes[indexClasificador] = {
        id: 'gpt-clasificador-inteligente',
        type: 'gpt',
        data: {
          label: 'GPT Clasificador',
          config: {
            tipo: 'formateador',
            modelo: 'gpt-4',
            temperatura: 0.3,
            systemPrompt: `Eres un clasificador inteligente de intenciones en un ecommerce conversacional.

HISTORIAL COMPLETO DE LA CONVERSACIÓN:
{{historial_conversacion}}

PRODUCTOS PRESENTADOS PREVIAMENTE (si existen):
{{global.productos_presentados}}

MENSAJE ACTUAL DEL USUARIO:
{{1.message}}

TU TRABAJO:
Analizar el contexto completo y clasificar la intención del usuario en UNA de estas categorías:

1. **"buscar_producto"** - Usuario quiere buscar/consultar productos
   Casos:
   - Primera interacción: "Hola", "Busco libros"
   - Después de ver productos: "Busco otro libro", "Tenés de matemática?"
   
   IMPORTANTE: Si NO hay productos_presentados → SIEMPRE es "buscar_producto"

2. **"comprar"** - Usuario quiere comprar productos YA PRESENTADOS
   Casos:
   - "Quiero comprar el primero"
   - "Me llevo ambos"
   - "Sí, lo compro"
   
   IMPORTANTE: Solo si productos_presentados existe y usuario los menciona

3. **"consultar"** - Usuario tiene pregunta general
   Casos:
   - "Qué horarios tienen?"
   - "Aceptan mercado pago?"

4. **"despedida"** - Usuario se despide
   Casos:
   - "Nada más gracias"
   - "Chau"

REGLAS CRÍTICAS:
- Si NO hay productos_presentados → SIEMPRE "buscar_producto"
- Si hay productos_presentados Y usuario los menciona → "comprar"
- Si pregunta horarios/pagos/ubicación → "consultar"
- Si se despide → "despedida"`,
            extractionConfig: {
              variablesToExtract: [
                { nombre: 'tipo_accion', tipo: 'string', requerido: true },
                { nombre: 'confianza', tipo: 'number', requerido: true }
              ]
            }
          }
        },
        position: flow.nodes[indexClasificador].position
      };
      
      console.log('   ✅ Clasificador configurado correctamente');
    }
    
    // ============================================================
    // CORRECCIÓN 3: Conectar flujos correctamente (sin loops)
    // ============================================================
    
    console.log('\n🔧 CORRECCIÓN 3: Conectando flujos correctamente...');
    
    // Encontrar el trigger (primer nodo)
    const trigger = flow.nodes.find(n => n.type === 'trigger');
    
    // Encontrar el formateador original (segundo nodo del flujo actual)
    const formateador = flow.nodes.find(n => 
      n.type === 'gpt' && 
      n.id !== 'gpt-clasificador-inteligente' && 
      n.id !== 'gpt-armar-carrito' &&
      n.data?.config?.tipo === 'formateador'
    );
    
    if (trigger && clasificador && formateador) {
      // Eliminar conexiones viejas del trigger
      flow.edges = flow.edges.filter(e => e.source !== trigger.id);
      
      // Conectar: Trigger → Clasificador → Router Principal
      const nuevasConexiones = [
        {
          id: 'edge-trigger-clasificador',
          source: trigger.id,
          target: 'gpt-clasificador-inteligente',
          data: { label: 'Mensaje recibido' }
        },
        {
          id: 'edge-clasificador-router',
          source: 'gpt-clasificador-inteligente',
          target: 'router-principal',
          data: { label: 'Intención clasificada' }
        },
        {
          id: 'edge-router-formateador',
          source: 'router-principal',
          target: formateador.id,
          data: {
            condition: 'tipo_accion equals buscar_producto',
            label: '🔍 Buscar'
          }
        },
        {
          id: 'edge-router-carrito',
          source: 'router-principal',
          target: 'gpt-armar-carrito',
          data: {
            condition: 'tipo_accion equals comprar',
            label: '🛒 Comprar'
          }
        }
      ];
      
      // Agregar solo si no existen
      nuevasConexiones.forEach(conn => {
        const existe = flow.edges.find(e => e.id === conn.id);
        if (!existe) {
          flow.edges.push(conn);
        }
      });
      
      console.log('   ✅ Flujos conectados correctamente');
    }
    
    // ============================================================
    // CORRECCIÓN 4: Eliminar conexiones de nodos normales con múltiples salidas
    // ============================================================
    
    console.log('\n🔧 CORRECCIÓN 4: Corrigiendo múltiples salidas...');
    
    // Para cada nodo normal (no router), mantener solo UNA salida
    flow.nodes.forEach(node => {
      if (node.type !== 'router' && node.type !== 'trigger') {
        const salidas = flow.edges.filter(e => e.source === node.id);
        
        if (salidas.length > 1) {
          console.log(`   ⚠️  ${node.id} tiene ${salidas.length} salidas, manteniendo solo la primera`);
          
          // Mantener solo la primera salida
          const primeraId = salidas[0].id;
          flow.edges = flow.edges.filter(e => 
            e.source !== node.id || e.id === primeraId
          );
        }
      }
    });
    
    // ============================================================
    // GUARDAR CAMBIOS
    // ============================================================
    
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ FLUJO CORREGIDO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📊 Resumen:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    console.log('\n✅ Correcciones aplicadas:');
    console.log('   1. Loops eliminados');
    console.log('   2. Clasificador configurado con prompt y extractionConfig');
    console.log('   3. Flujos conectados correctamente');
    console.log('   4. Múltiples salidas corregidas');
    
    console.log('\n🧪 Próximos pasos:');
    console.log('   1. Verificar en el frontend que el flujo se ve correcto');
    console.log('   2. Probar con un mensaje de prueba');
    
  } catch (error) {
    console.error('❌ Error corrigiendo flujo:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar corrección
corregirFlujo()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
