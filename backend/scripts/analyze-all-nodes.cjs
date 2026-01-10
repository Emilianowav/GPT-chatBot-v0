require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function analyzeAllNodes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 ANÁLISIS EXHAUSTIVO DEL FLUJO: ${flow.nombre}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`📋 Total de nodos: ${flow.nodes.length}`);
    console.log(`🔗 Total de edges: ${flow.edges.length}\n`);
    
    // Analizar cada nodo
    flow.nodes.forEach((node, index) => {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`NODO ${index + 1}: ${node.id}`);
      console.log('='.repeat(70));
      console.log(`📌 Tipo: ${node.type}`);
      console.log(`📂 Categoría: ${node.category}`);
      console.log(`📍 Posición: x=${node.position.x}, y=${node.position.y}`);
      console.log(`🏷️  Label: ${node.data.label}`);
      console.log(`📝 Subtitle: ${node.data.subtitle || 'N/A'}`);
      console.log(`🔢 Execution Count: ${node.data.executionCount}`);
      
      console.log('\n📋 CONFIGURACIÓN:');
      const config = node.data.config;
      
      if (!config) {
        console.log('  ❌ No tiene configuración');
        return;
      }
      
      // Analizar según tipo de nodo
      if (node.type === 'webhook') {
        console.log(`  • Tipo: ${config.tipo || 'N/A'}`);
        console.log(`  • Module: ${config.module || 'N/A'}`);
        console.log(`  • Empresa ID: ${config.empresaId || 'N/A'}`);
        console.log(`  • Phone Number ID: ${config.phoneNumberId || 'N/A'}`);
      }
      
      if (node.type === 'gpt') {
        console.log(`  • Tipo GPT: ${config.tipo || 'N/A'}`);
        console.log(`  • Module: ${config.module || 'N/A'}`);
        console.log(`  • Modelo: ${config.modelo || 'N/A'}`);
        console.log(`  • Temperatura: ${config.temperatura || 'N/A'}`);
        console.log(`  • Max Tokens: ${config.maxTokens || 'N/A'}`);
        console.log(`  • Instrucciones: ${config.instrucciones?.substring(0, 100) || 'N/A'}...`);
        
        if (config.configuracionExtraccion) {
          console.log('\n  🔧 CONFIGURACIÓN DE EXTRACCIÓN:');
          console.log(`    • Fuente de datos: ${config.configuracionExtraccion.fuenteDatos || 'N/A'}`);
          console.log(`    • Formato salida: ${config.configuracionExtraccion.formatoSalida || 'N/A'}`);
          console.log(`    • Campos esperados: ${config.configuracionExtraccion.camposEsperados?.join(', ') || 'N/A'}`);
          console.log(`    • Instrucciones extracción: ${config.configuracionExtraccion.instruccionesExtraccion?.substring(0, 100) || 'N/A'}...`);
        }
        
        if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
          console.log('\n  📊 VARIABLES A RECOPILAR:');
          config.variablesRecopilar.forEach(v => {
            console.log(`    • ${v.nombre} (${v.tipo}): ${v.descripcion} ${v.obligatorio ? '[OBLIGATORIO]' : '[OPCIONAL]'}`);
          });
        }
        
        if (config.variablesAExtraer && config.variablesAExtraer.length > 0) {
          console.log('\n  📊 VARIABLES A EXTRAER (legacy):');
          config.variablesAExtraer.forEach(v => {
            console.log(`    • ${v.nombre} (${v.tipo}): ${v.descripcion} ${v.obligatorio ? '[OBLIGATORIO]' : '[OPCIONAL]'}`);
          });
        }
      }
      
      if (node.type === 'router') {
        console.log(`  • Tipo: ${config.tipo || 'N/A'}`);
        console.log(`  • Número de rutas: ${config.routes?.length || 0}`);
        
        if (config.routes && config.routes.length > 0) {
          console.log('\n  🔀 RUTAS:');
          config.routes.forEach((route, i) => {
            console.log(`    ${i + 1}. ${route.label || route.id}`);
            console.log(`       ID: ${route.id}`);
            console.log(`       Condición: ${route.condition}`);
            console.log(`       Descripción: ${route.descripcion || 'N/A'}`);
          });
        } else {
          console.log('  ⚠️  NO HAY RUTAS CONFIGURADAS');
        }
        
        if (config.conditions && config.conditions.length > 0) {
          console.log('\n  ⚠️  CONDICIONES LEGACY (no se usan):');
          config.conditions.forEach((cond, i) => {
            console.log(`    ${i + 1}. ${cond.label}: ${cond.condition}`);
          });
        }
      }
      
      if (node.type === 'whatsapp') {
        console.log(`  • Module: ${config.module || 'N/A'}`);
        console.log(`  • Message: ${config.message || 'N/A'}`);
        console.log(`  • Teléfono: ${config.telefono || 'N/A'}`);
        console.log(`  • Empresa ID: ${config.empresaId || 'N/A'}`);
        console.log(`  • Phone Number ID: ${config.phoneNumberId || 'N/A'}`);
      }
      
      if (node.type === 'woocommerce') {
        console.log(`  • Module: ${config.module || 'N/A'}`);
        console.log(`  • API Config ID: ${config.apiConfigId || 'N/A'}`);
        console.log(`  • Endpoint ID: ${config.endpointId || 'N/A'}`);
        
        if (config.parametros) {
          console.log('\n  📊 PARÁMETROS:');
          Object.entries(config.parametros).forEach(([key, value]) => {
            console.log(`    • ${key}: ${value}`);
          });
        }
        
        if (config.responseConfig) {
          console.log('\n  📋 RESPONSE CONFIG:');
          Object.entries(config.responseConfig).forEach(([key, value]) => {
            console.log(`    • ${key}: ${value}`);
          });
        }
        
        console.log(`  • Mensaje sin resultados: ${config.mensajeSinResultados || 'N/A'}`);
      }
    });
    
    // Analizar edges
    console.log('\n\n' + '='.repeat(70));
    console.log('ANÁLISIS DE CONEXIONES (EDGES)');
    console.log('='.repeat(70) + '\n');
    
    flow.edges.forEach((edge, index) => {
      console.log(`${index + 1}. ${edge.id}`);
      console.log(`   ${edge.source} → ${edge.target}`);
      console.log(`   Tipo: ${edge.type}, Animated: ${edge.animated}`);
      if (edge.sourceHandle) {
        console.log(`   Source Handle: ${edge.sourceHandle}`);
      }
      console.log('');
    });
    
    // Verificar integridad del flujo
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICACIÓN DE INTEGRIDAD');
    console.log('='.repeat(70) + '\n');
    
    // 1. Verificar que todos los edges apunten a nodos existentes
    const nodeIds = flow.nodes.map(n => n.id);
    let edgesValidos = 0;
    let edgesInvalidos = 0;
    
    flow.edges.forEach(edge => {
      const sourceExists = nodeIds.includes(edge.source);
      const targetExists = nodeIds.includes(edge.target);
      
      if (sourceExists && targetExists) {
        edgesValidos++;
      } else {
        edgesInvalidos++;
        console.log(`❌ Edge inválido: ${edge.id}`);
        if (!sourceExists) console.log(`   Source no existe: ${edge.source}`);
        if (!targetExists) console.log(`   Target no existe: ${edge.target}`);
      }
    });
    
    console.log(`✅ Edges válidos: ${edgesValidos}`);
    console.log(`❌ Edges inválidos: ${edgesInvalidos}`);
    
    // 2. Verificar nodo trigger
    const triggerNodes = flow.nodes.filter(n => n.category === 'trigger');
    console.log(`\n📍 Nodos trigger: ${triggerNodes.length}`);
    if (triggerNodes.length === 0) {
      console.log('❌ NO HAY NODO TRIGGER');
    } else if (triggerNodes.length > 1) {
      console.log('⚠️  HAY MÁS DE UN NODO TRIGGER');
    } else {
      console.log(`✅ Nodo trigger: ${triggerNodes[0].id}`);
    }
    
    // 3. Verificar nodos sin conexiones salientes
    const nodosSinSalida = flow.nodes.filter(node => {
      return !flow.edges.some(edge => edge.source === node.id);
    });
    
    console.log(`\n📤 Nodos sin conexiones salientes: ${nodosSinSalida.length}`);
    nodosSinSalida.forEach(node => {
      console.log(`   • ${node.id} (${node.type})`);
    });
    
    // 4. Verificar nodos sin conexiones entrantes (excepto trigger)
    const nodosSinEntrada = flow.nodes.filter(node => {
      if (node.category === 'trigger') return false;
      return !flow.edges.some(edge => edge.target === node.id);
    });
    
    console.log(`\n📥 Nodos sin conexiones entrantes (excepto trigger): ${nodosSinEntrada.length}`);
    if (nodosSinEntrada.length > 0) {
      console.log('⚠️  Estos nodos nunca se ejecutarán:');
      nodosSinEntrada.forEach(node => {
        console.log(`   • ${node.id} (${node.type})`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('FIN DEL ANÁLISIS');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

analyzeAllNodes();
