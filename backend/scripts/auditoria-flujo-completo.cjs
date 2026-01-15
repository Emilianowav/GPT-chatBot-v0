/**
 * Script de Auditoría Completa del Flujo de Carrito
 * 
 * OBJETIVO:
 * 1. Verificar configuración en BD (backend)
 * 2. Evaluar flujo paso a paso
 * 3. Identificar problemas o configuraciones faltantes
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function auditarFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log('='.repeat(70));
    console.log('📊 AUDITORÍA COMPLETA DEL FLUJO DE CARRITO');
    console.log('='.repeat(70));
    
    console.log(`\n🔍 Flujo: ${flow.nombre}`);
    console.log(`   ID: ${flow._id}`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    
    // ============================================================
    // PARTE 1: INVENTARIO DE NODOS
    // ============================================================
    
    console.log('\n' + '='.repeat(70));
    console.log('📦 PARTE 1: INVENTARIO DE NODOS');
    console.log('='.repeat(70));
    
    console.log('\n📋 Todos los nodos del flujo:\n');
    
    flow.nodes.forEach((node, index) => {
      console.log(`${index + 1}. [${node.type.toUpperCase()}] ${node.id}`);
      console.log(`   Label: ${node.data?.label || 'Sin label'}`);
      
      // Mostrar configuración específica según tipo
      if (node.type === 'gpt') {
        const config = node.data?.config || {};
        console.log(`   Tipo GPT: ${config.tipo || 'no especificado'}`);
        console.log(`   Tiene prompt: ${config.systemPrompt ? '✅' : '❌'}`);
        console.log(`   Tiene extractionConfig: ${config.extractionConfig ? '✅' : '❌'}`);
        if (config.extractionConfig) {
          const vars = config.extractionConfig.variablesToExtract || [];
          console.log(`   Variables: ${vars.map(v => v.nombre).join(', ')}`);
        }
      } else if (node.type === 'router') {
        const config = node.data?.config || {};
        console.log(`   Variable a evaluar: ${config.variable || '❌ NO CONFIGURADO'}`);
        console.log(`   Rutas: ${config.routes?.length || 0}`);
        if (config.routes) {
          config.routes.forEach(r => {
            console.log(`      - ${r.label}: ${r.value} (${r.condition})`);
          });
        }
      } else if (node.type === 'whatsapp') {
        const config = node.data?.config || {};
        console.log(`   Action: ${config.action || 'no especificado'}`);
        console.log(`   Tiene mensaje: ${config.message ? '✅' : '❌'}`);
      } else if (node.type === 'mercadopago') {
        const config = node.data?.config || {};
        console.log(`   Module: ${config.module || 'no especificado'}`);
        console.log(`   Tiene notification_url: ${config.notification_url ? '✅' : '❌'}`);
      }
      console.log('');
    });
    
    // ============================================================
    // PARTE 2: MAPA DE CONEXIONES
    // ============================================================
    
    console.log('='.repeat(70));
    console.log('🔗 PARTE 2: MAPA DE CONEXIONES');
    console.log('='.repeat(70));
    
    console.log('\n📋 Todas las conexiones (edges):\n');
    
    flow.edges.forEach((edge, index) => {
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      
      console.log(`${index + 1}. ${edge.source} → ${edge.target}`);
      console.log(`   Source: [${sourceNode?.type}] ${sourceNode?.data?.label || edge.source}`);
      console.log(`   Target: [${targetNode?.type}] ${targetNode?.data?.label || edge.target}`);
      console.log(`   Condition: ${edge.data?.condition || 'ninguna'}`);
      console.log(`   Label: ${edge.data?.label || 'sin label'}`);
      console.log('');
    });
    
    // ============================================================
    // PARTE 3: EVALUACIÓN PASO A PASO DEL FLUJO
    // ============================================================
    
    console.log('='.repeat(70));
    console.log('🎯 PARTE 3: EVALUACIÓN PASO A PASO');
    console.log('='.repeat(70));
    
    // Encontrar el trigger (punto de inicio)
    const trigger = flow.nodes.find(n => n.type === 'trigger');
    
    if (!trigger) {
      console.log('\n❌ ERROR: No se encontró el nodo trigger');
      return;
    }
    
    console.log(`\n🚀 INICIO: ${trigger.id}\n`);
    
    // Función recursiva para seguir el flujo
    function seguirFlujo(nodeId, nivel = 0, visitados = new Set(), ruta = '') {
      if (visitados.has(nodeId)) {
        console.log(`${'  '.repeat(nivel)}⚠️  LOOP DETECTADO: ${nodeId} ya fue visitado`);
        return;
      }
      
      visitados.add(nodeId);
      
      const node = flow.nodes.find(n => n.id === nodeId);
      if (!node) {
        console.log(`${'  '.repeat(nivel)}❌ Nodo ${nodeId} no encontrado`);
        return;
      }
      
      const indent = '  '.repeat(nivel);
      const prefix = nivel === 0 ? '🚀' : '→';
      
      console.log(`${indent}${prefix} [${node.type.toUpperCase()}] ${node.data?.label || nodeId}`);
      
      // Mostrar detalles según tipo
      if (node.type === 'gpt') {
        const config = node.data?.config || {};
        console.log(`${indent}   Tipo: ${config.tipo || 'no especificado'}`);
        console.log(`${indent}   Configurado: ${config.systemPrompt && config.extractionConfig ? '✅' : '❌'}`);
      } else if (node.type === 'router') {
        const config = node.data?.config || {};
        console.log(`${indent}   Evalúa: ${config.variable || '❌ NO CONFIGURADO'}`);
        console.log(`${indent}   Rutas: ${config.routes?.length || 0}`);
      }
      
      // Encontrar conexiones salientes
      const conexionesSalientes = flow.edges.filter(e => e.source === nodeId);
      
      if (conexionesSalientes.length === 0) {
        console.log(`${indent}   🏁 FIN DE RAMA\n`);
        return;
      }
      
      if (conexionesSalientes.length > 1) {
        console.log(`${indent}   ├─ ${conexionesSalientes.length} rutas posibles:`);
      }
      
      conexionesSalientes.forEach((edge, index) => {
        const esUltima = index === conexionesSalientes.length - 1;
        const simbolo = esUltima ? '└─' : '├─';
        
        if (edge.data?.condition) {
          console.log(`${indent}   ${simbolo} Si: ${edge.data.condition}`);
        } else if (edge.data?.label) {
          console.log(`${indent}   ${simbolo} ${edge.data.label}`);
        }
        
        seguirFlujo(edge.target, nivel + 1, new Set(visitados), ruta + ' → ' + nodeId);
      });
    }
    
    seguirFlujo(trigger.id);
    
    // ============================================================
    // PARTE 4: VERIFICACIÓN DE NODOS CRÍTICOS
    // ============================================================
    
    console.log('\n' + '='.repeat(70));
    console.log('🔍 PARTE 4: VERIFICACIÓN DE NODOS CRÍTICOS');
    console.log('='.repeat(70));
    
    const nodosCriticos = [
      { id: 'gpt-clasificador-inteligente', nombre: 'Clasificador Inteligente' },
      { id: 'router-principal', nombre: 'Router Principal' },
      { id: 'gpt-formateador', nombre: 'Formateador' },
      { id: 'gpt-armar-carrito', nombre: 'Armar Carrito' },
      { id: 'router-carrito', nombre: 'Router Carrito' },
      { id: 'mercadopago-crear-preference', nombre: 'MercadoPago' },
      { id: 'whatsapp-solicitar-datos', nombre: 'WhatsApp Solicitar Datos' },
      { id: 'whatsapp-link-pago', nombre: 'WhatsApp Link Pago' }
    ];
    
    console.log('\n');
    
    nodosCriticos.forEach(critico => {
      const node = flow.nodes.find(n => n.id === critico.id);
      
      console.log(`📌 ${critico.nombre} (${critico.id})`);
      
      if (!node) {
        console.log('   ❌ NO EXISTE\n');
        return;
      }
      
      console.log('   ✅ Existe');
      
      // Verificar configuración según tipo
      if (node.type === 'gpt') {
        const config = node.data?.config || {};
        console.log(`   Prompt: ${config.systemPrompt ? '✅' : '❌'}`);
        console.log(`   ExtractionConfig: ${config.extractionConfig ? '✅' : '❌'}`);
        
        if (config.extractionConfig) {
          const vars = config.extractionConfig.variablesToExtract || [];
          console.log(`   Variables: ${vars.map(v => v.nombre).join(', ')}`);
        }
      } else if (node.type === 'router') {
        const config = node.data?.config || {};
        console.log(`   Variable: ${config.variable || '❌ NO CONFIGURADO'}`);
        console.log(`   Rutas: ${config.routes?.length || 0}`);
      } else if (node.type === 'whatsapp') {
        const config = node.data?.config || {};
        console.log(`   Action: ${config.action || '❌'}`);
        console.log(`   Mensaje: ${config.message ? '✅' : '❌'}`);
      } else if (node.type === 'mercadopago') {
        const config = node.data?.config || {};
        console.log(`   Module: ${config.module || '❌'}`);
        console.log(`   Items: ${config.items || '❌'}`);
        console.log(`   Notification URL: ${config.notification_url || '❌'}`);
      }
      
      // Verificar conexiones
      const entradas = flow.edges.filter(e => e.target === critico.id);
      const salidas = flow.edges.filter(e => e.source === critico.id);
      
      console.log(`   Entradas: ${entradas.length}`);
      console.log(`   Salidas: ${salidas.length}`);
      
      if (entradas.length === 0 && node.type !== 'trigger') {
        console.log('   ⚠️  NODO DESCONECTADO (sin entradas)');
      }
      
      if (salidas.length === 0) {
        console.log('   ⚠️  NODO TERMINAL (sin salidas)');
      }
      
      console.log('');
    });
    
    // ============================================================
    // PARTE 5: PROBLEMAS DETECTADOS
    // ============================================================
    
    console.log('='.repeat(70));
    console.log('⚠️  PARTE 5: PROBLEMAS DETECTADOS');
    console.log('='.repeat(70));
    
    const problemas = [];
    
    // Verificar nodos sin configuración
    flow.nodes.forEach(node => {
      if (node.type === 'gpt') {
        const config = node.data?.config || {};
        if (!config.systemPrompt) {
          problemas.push(`❌ ${node.id}: GPT sin prompt`);
        }
        if (config.tipo === 'formateador' && !config.extractionConfig) {
          problemas.push(`❌ ${node.id}: Formateador sin extractionConfig`);
        }
      } else if (node.type === 'router') {
        const config = node.data?.config || {};
        if (!config.variable) {
          problemas.push(`❌ ${node.id}: Router sin variable configurada`);
        }
        if (!config.routes || config.routes.length === 0) {
          problemas.push(`❌ ${node.id}: Router sin rutas`);
        }
      }
    });
    
    // Verificar nodos desconectados
    flow.nodes.forEach(node => {
      if (node.type !== 'trigger') {
        const entradas = flow.edges.filter(e => e.target === node.id);
        if (entradas.length === 0) {
          problemas.push(`⚠️  ${node.id}: Nodo desconectado (sin entradas)`);
        }
      }
    });
    
    // Verificar loops
    const visitados = new Set();
    function detectarLoop(nodeId, ruta = []) {
      if (ruta.includes(nodeId)) {
        problemas.push(`⚠️  LOOP: ${ruta.join(' → ')} → ${nodeId}`);
        return;
      }
      
      if (visitados.has(nodeId)) return;
      visitados.add(nodeId);
      
      const salidas = flow.edges.filter(e => e.source === nodeId);
      salidas.forEach(edge => {
        detectarLoop(edge.target, [...ruta, nodeId]);
      });
    }
    
    if (trigger) {
      detectarLoop(trigger.id);
    }
    
    console.log('\n');
    
    if (problemas.length === 0) {
      console.log('✅ No se detectaron problemas\n');
    } else {
      console.log(`Se detectaron ${problemas.length} problema(s):\n`);
      problemas.forEach((p, i) => {
        console.log(`${i + 1}. ${p}`);
      });
      console.log('');
    }
    
    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    
    console.log('='.repeat(70));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(70));
    
    console.log('\n✅ Configuración en BD (Backend):');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Conexiones: ${flow.edges.length}`);
    console.log(`   Problemas: ${problemas.length}`);
    
    console.log('\n⚠️  Configuración en Frontend:');
    console.log('   El frontend lee de la BD, por lo que si está en BD, está en frontend');
    console.log('   Refresca el navegador para ver los cambios');
    
    console.log('\n🎯 Estado del flujo:');
    if (problemas.length === 0) {
      console.log('   ✅ FLUJO COMPLETO Y FUNCIONAL');
    } else {
      console.log('   ⚠️  FLUJO CON PROBLEMAS (ver arriba)');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
auditarFlujo()
  .then(() => {
    console.log('✅ Auditoría completada\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Auditoría falló:', error);
    process.exit(1);
  });
