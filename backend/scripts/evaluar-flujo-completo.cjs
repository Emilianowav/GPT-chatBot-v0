require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * EVALUAR FLUJO COMPLETO
 * 
 * Este script:
 * 1. Carga el flujo desde MongoDB
 * 2. Simula la ejecución paso a paso
 * 3. Muestra qué prompt se arma en cada nodo GPT
 * 4. Muestra qué datos extrae el formateador
 * 5. Muestra qué ruta toma el router
 * 6. Guarda todo en un archivo de texto para debugging
 */

async function evaluarFlujoCompleto() {
  const client = new MongoClient(MONGODB_URI);
  
  let output = '';
  const log = (msg) => {
    console.log(msg);
    output += msg + '\n';
  };
  
  try {
    await client.connect();
    log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      log('❌ Flow no encontrado');
      return;
    }
    
    log('═══════════════════════════════════════════════════════════');
    log('EVALUACIÓN COMPLETA DEL FLUJO');
    log('═══════════════════════════════════════════════════════════\n');
    log(`Flow: ${flow.nombre}`);
    log(`ID: ${flow._id}`);
    log(`Nodos: ${flow.nodes.length}`);
    log(`Edges: ${flow.edges.length}\n`);
    
    // Historial de conversación para simular
    const historial = [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: '¡Hola! ¿En qué puedo ayudarte?' },
      { role: 'user', content: 'Estoy buscando harry potter 3' },
      { role: 'assistant', content: '¿De qué editorial y edición?' },
      { role: 'user', content: 'no sé la editorial ni la edición' }
    ];
    
    log('📚 HISTORIAL DE CONVERSACIÓN SIMULADO:');
    log('─'.repeat(63));
    historial.forEach((msg, i) => {
      log(`${i + 1}. ${msg.role}: ${msg.content}`);
    });
    log('');
    
    // Variables globales simuladas
    const globalVariables = {
      telefono_cliente: '5493794946066',
      telefono_empresa: '5493794057297',
      phoneNumberId: '906667632531979',
      mensaje_usuario: historial[historial.length - 1].content,
      titulo: null,
      editorial: null,
      edicion: null
    };
    
    log('📋 VARIABLES GLOBALES INICIALES:');
    log('─'.repeat(63));
    Object.entries(globalVariables).forEach(([key, value]) => {
      log(`   ${key} = ${JSON.stringify(value)}`);
    });
    log('');
    
    // ═══════════════════════════════════════════════════════════
    // NODO 1: TRIGGER
    // ═══════════════════════════════════════════════════════════
    const triggerNode = flow.nodes.find(n => n.category === 'trigger');
    
    log('═══════════════════════════════════════════════════════════');
    log('NODO 1: TRIGGER (WhatsApp Watch Events)');
    log('═══════════════════════════════════════════════════════════');
    log(`ID: ${triggerNode?.id}`);
    log(`Tipo: ${triggerNode?.type}`);
    log(`Label: ${triggerNode?.data?.label}`);
    log('');
    log('📥 INPUT:');
    log('   Mensaje de WhatsApp recibido');
    log('');
    log('📤 OUTPUT:');
    log(JSON.stringify({
      message: historial[historial.length - 1].content,
      from: globalVariables.telefono_cliente,
      to: globalVariables.telefono_empresa,
      phoneNumberId: globalVariables.phoneNumberId
    }, null, 2));
    log('');
    
    // ═══════════════════════════════════════════════════════════
    // NODO 2: GPT CONVERSACIONAL
    // ═══════════════════════════════════════════════════════════
    const edge1 = flow.edges.find(e => e.source === triggerNode?.id);
    const gptConversacional = flow.nodes.find(n => n.id === edge1?.target);
    
    log('═══════════════════════════════════════════════════════════');
    log('NODO 2: GPT CONVERSACIONAL');
    log('═══════════════════════════════════════════════════════════');
    log(`ID: ${gptConversacional?.id}`);
    log(`Tipo: ${gptConversacional?.type}`);
    log(`Label: ${gptConversacional?.data?.label}`);
    log(`Config Tipo: ${gptConversacional?.data?.config?.tipo}`);
    log(`Modelo: ${gptConversacional?.data?.config?.modelo}`);
    log('');
    log('📋 PERSONALIDAD:');
    log('─'.repeat(63));
    log(gptConversacional?.data?.config?.personalidad || 'N/A');
    log('');
    log('📚 TÓPICOS:');
    log('─'.repeat(63));
    if (gptConversacional?.data?.config?.topicos) {
      gptConversacional.data.config.topicos.forEach((topico, i) => {
        log(`\n${i + 1}. ${topico.titulo}`);
        log(`   ${topico.contenido.substring(0, 100)}...`);
      });
    } else {
      log('   Sin tópicos configurados');
    }
    log('');
    log('🔧 SYSTEM PROMPT CONSTRUIDO:');
    log('─'.repeat(63));
    log('# PERSONALIDAD');
    log(gptConversacional?.data?.config?.personalidad || 'N/A');
    log('');
    log('# INFORMACIÓN DISPONIBLE');
    if (gptConversacional?.data?.config?.topicos) {
      gptConversacional.data.config.topicos.forEach((topico, i) => {
        log(`## ${i + 1}. ${topico.titulo}`);
        log(topico.contenido.substring(0, 80) + '...');
      });
    }
    log('');
    log('📨 USER MESSAGE:');
    log(`"${historial[historial.length - 1].content}"`);
    log('');
    log('🤖 RESPUESTA ESPERADA:');
    log('   (GPT responde basado en personalidad + tópicos + historial)');
    log('   Debería reconocer que el usuario no sabe editorial/edición');
    log('');
    
    // ═══════════════════════════════════════════════════════════
    // NODO 3: GPT FORMATEADOR (CRÍTICO)
    // ═══════════════════════════════════════════════════════════
    const edge2 = flow.edges.find(e => e.source === gptConversacional?.id);
    const gptFormateador = flow.nodes.find(n => n.id === edge2?.target);
    
    log('═══════════════════════════════════════════════════════════');
    log('NODO 3: GPT FORMATEADOR (CRÍTICO)');
    log('═══════════════════════════════════════════════════════════');
    log(`ID: ${gptFormateador?.id}`);
    log(`Tipo: ${gptFormateador?.type}`);
    log(`Label: ${gptFormateador?.data?.label}`);
    log(`Config Tipo: ${gptFormateador?.data?.config?.tipo}`);
    log(`Modelo: ${gptFormateador?.data?.config?.modelo}`);
    log('');
    log('📋 EXTRACTION CONFIG - SYSTEM PROMPT:');
    log('─'.repeat(63));
    log(gptFormateador?.data?.config?.extractionConfig?.systemPrompt || 'N/A');
    log('');
    log('📝 VARIABLES A EXTRAER:');
    log('─'.repeat(63));
    if (gptFormateador?.data?.config?.extractionConfig?.variables) {
      gptFormateador.data.config.extractionConfig.variables.forEach(v => {
        log(`   - ${v.nombre}: ${v.descripcion}`);
        log(`     Tipo: ${v.tipo}, Obligatoria: ${v.obligatoria}`);
      });
    } else {
      log('   Sin variables configuradas');
    }
    log('');
    log('🔍 CONTEXTO PARA EXTRACCIÓN (historial_completo):');
    log('─'.repeat(63));
    historial.forEach(msg => {
      log(`${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`);
    });
    log('');
    log('❓ PREGUNTA CRÍTICA:');
    log('─'.repeat(63));
    log('¿Cómo interpreta el formateador "no sé la editorial ni la edición"?');
    log('');
    log('OPCIONES:');
    log('A) { titulo: "harry potter 3", editorial: null, edicion: null }');
    log('   ❌ INCORRECTO - Causa loop infinito');
    log('');
    log('B) { titulo: "harry potter 3", editorial: "cualquiera", edicion: "cualquiera" }');
    log('   ✅ CORRECTO - Va a WooCommerce');
    log('');
    log('🔍 VERIFICAR EN EL PROMPT:');
    log('─'.repeat(63));
    const prompt = gptFormateador?.data?.config?.extractionConfig?.systemPrompt || '';
    const tieneCualquiera = prompt.includes('cualquiera');
    const tieneNoSe = prompt.includes('no sé') || prompt.includes('no se');
    const tieneDameOpciones = prompt.includes('dame opciones');
    
    log(`   ✓ Menciona "cualquiera": ${tieneCualquiera ? '✅ SÍ' : '❌ NO'}`);
    log(`   ✓ Menciona "no sé": ${tieneNoSe ? '✅ SÍ' : '❌ NO'}`);
    log(`   ✓ Menciona "dame opciones": ${tieneDameOpciones ? '✅ SÍ' : '❌ NO'}`);
    log('');
    
    // Simular extracción
    let datosExtraidos = {
      titulo: 'harry potter 3',
      editorial: null,
      edicion: null
    };
    
    // Si el prompt tiene los casos correctos, simular extracción correcta
    if (tieneNoSe && tieneDameOpciones) {
      datosExtraidos = {
        titulo: 'harry potter 3',
        editorial: 'cualquiera',
        edicion: 'cualquiera'
      };
    }
    
    log('✅ DATOS EXTRAÍDOS (SIMULADOS):');
    log(JSON.stringify(datosExtraidos, null, 2));
    log('');
    
    // Actualizar variables globales
    globalVariables.titulo = datosExtraidos.titulo;
    globalVariables.editorial = datosExtraidos.editorial;
    globalVariables.edicion = datosExtraidos.edicion;
    
    log('📋 VARIABLES GLOBALES ACTUALIZADAS:');
    log('─'.repeat(63));
    Object.entries(globalVariables).forEach(([key, value]) => {
      log(`   ${key} = ${JSON.stringify(value)}`);
    });
    log('');
    
    // ═══════════════════════════════════════════════════════════
    // NODO 4: ROUTER
    // ═══════════════════════════════════════════════════════════
    const edge3 = flow.edges.find(e => e.source === gptFormateador?.id);
    const router = flow.nodes.find(n => n.id === edge3?.target);
    
    log('═══════════════════════════════════════════════════════════');
    log('NODO 4: ROUTER');
    log('═══════════════════════════════════════════════════════════');
    log(`ID: ${router?.id}`);
    log(`Tipo: ${router?.type}`);
    log(`Label: ${router?.data?.label}`);
    log('');
    log('📋 RUTAS DISPONIBLES:');
    log('─'.repeat(63));
    const routerEdges = flow.edges.filter(e => e.source === router?.id);
    routerEdges.forEach((edge, i) => {
      log(`\n${i + 1}. ${edge.data?.label || edge.id}`);
      log(`   Target: ${edge.target}`);
      log(`   Condición: ${edge.data?.condition || 'SIN CONDICIÓN'}`);
    });
    log('');
    log('🔍 EVALUACIÓN DE CONDICIONES:');
    log('─'.repeat(63));
    
    routerEdges.forEach((edge, i) => {
      const condition = edge.data?.condition || '';
      log(`\nRuta ${i + 1}: ${edge.data?.label}`);
      log(`Condición: ${condition}`);
      
      // Evaluar condición manualmente
      let resultado = false;
      
      if (condition.includes('OR')) {
        // Evaluar OR
        const parts = condition.split(' OR ');
        const results = parts.map(part => {
          if (part.includes('not exists')) {
            const varName = part.match(/\{\{([^}]+)\}\}/)?.[1];
            const value = globalVariables[varName];
            return value === null || value === undefined;
          }
          return false;
        });
        resultado = results.some(r => r === true);
        log(`   Partes: ${parts.length}`);
        log(`   Resultados: ${results.join(', ')}`);
        log(`   OR resultado: ${resultado}`);
      } else if (condition.includes('AND')) {
        // Evaluar AND
        const parts = condition.split(' AND ');
        const results = parts.map(part => {
          if (part.includes('exists') && !part.includes('not')) {
            const varName = part.match(/\{\{([^}]+)\}\}/)?.[1];
            const value = globalVariables[varName];
            return value !== null && value !== undefined && value !== '';
          }
          return false;
        });
        resultado = results.every(r => r === true);
        log(`   Partes: ${parts.length}`);
        log(`   Resultados: ${results.join(', ')}`);
        log(`   AND resultado: ${resultado}`);
      }
      
      log(`   ${resultado ? '✅ TRUE - RUTA SELECCIONADA' : '❌ FALSE'}`);
    });
    log('');
    
    // ═══════════════════════════════════════════════════════════
    // DIAGNÓSTICO FINAL
    // ═══════════════════════════════════════════════════════════
    log('═══════════════════════════════════════════════════════════');
    log('DIAGNÓSTICO FINAL');
    log('═══════════════════════════════════════════════════════════\n');
    
    if (datosExtraidos.editorial === null || datosExtraidos.edicion === null) {
      log('🔴 PROBLEMA DETECTADO:');
      log('   El formateador extrajo editorial/edicion como null');
      log('   Esto causa que el router vaya a "Faltan datos"');
      log('   → LOOP INFINITO ❌');
      log('');
      log('✅ SOLUCIÓN:');
      log('   Actualizar extractionConfig.systemPrompt para reconocer:');
      log('   - "no sé" → "cualquiera"');
      log('   - "no tengo idea" → "cualquiera"');
      log('   - "dame opciones" → "cualquiera"');
    } else {
      log('✅ FLUJO CORRECTO:');
      log('   El formateador extrajo editorial/edicion como "cualquiera"');
      log('   El router va a "Datos completos"');
      log('   → VA A WOOCOMMERCE ✅');
    }
    
    // Guardar output en archivo
    const outputPath = path.join(__dirname, 'evaluacion-flujo-output.txt');
    fs.writeFileSync(outputPath, output, 'utf8');
    log('');
    log(`📄 Output guardado en: ${outputPath}`);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`);
  } finally {
    await client.close();
  }
}

evaluarFlujoCompleto();
