require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * DEBUG FLOW PASO A PASO
 * Simula el flujo completo y muestra qué procesa cada nodo
 */

async function debugFlowPasoAPaso() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DEBUG FLOW PASO A PASO');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`Flow: ${flow.nombre}`);
    console.log(`Nodos: ${flow.nodes.length}, Edges: ${flow.edges.length}\n`);
    
    // Simular conversación
    const historial = [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: '¡Hola! ¿En qué puedo ayudarte?' },
      { role: 'user', content: 'Estoy buscando harry potter 3' },
      { role: 'assistant', content: '¿De qué editorial y edición?' },
      { role: 'user', content: 'no sé la editorial ni la edición' }
    ];
    
    const mensajeActual = historial[historial.length - 1].content;
    
    console.log('📚 HISTORIAL DE CONVERSACIÓN:');
    console.log('─'.repeat(63));
    historial.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.role}: ${msg.content.substring(0, 60)}...`);
    });
    console.log('');
    
    console.log('📨 MENSAJE ACTUAL A PROCESAR:');
    console.log(`"${mensajeActual}"`);
    console.log('');
    
    // Encontrar nodo trigger
    const triggerNode = flow.nodes.find(n => n.category === 'trigger');
    if (!triggerNode) {
      console.log('❌ No se encontró nodo trigger');
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 1: TRIGGER (WhatsApp Watch Events)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Input: Mensaje de WhatsApp');
    console.log('Output:');
    console.log(JSON.stringify({
      message: mensajeActual,
      from: '5493794946066',
      to: '5493794057297'
    }, null, 2));
    console.log('');
    
    // Buscar siguiente nodo (GPT Conversacional)
    const edge1 = flow.edges.find(e => e.source === triggerNode.id);
    const gptConversacional = flow.nodes.find(n => n.id === edge1?.target);
    
    if (gptConversacional) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('PASO 2: GPT CONVERSACIONAL');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Nodo: ${gptConversacional.data.label}`);
      console.log(`Tipo: ${gptConversacional.data.config?.tipo}`);
      console.log('');
      console.log('📋 PERSONALIDAD:');
      console.log(gptConversacional.data.config?.personalidad || 'N/A');
      console.log('');
      console.log('📚 TÓPICOS:');
      if (gptConversacional.data.config?.topicos) {
        gptConversacional.data.config.topicos.forEach((t, i) => {
          console.log(`${i + 1}. ${t.titulo}`);
        });
      }
      console.log('');
      console.log('🤖 RESPUESTA ESPERADA:');
      console.log('(Depende del GPT, pero debería reconocer que el usuario no sabe editorial/edición)');
      console.log('');
    }
    
    // Buscar GPT Formateador
    const edge2 = flow.edges.find(e => e.source === gptConversacional?.id);
    const gptFormateador = flow.nodes.find(n => n.id === edge2?.target);
    
    if (gptFormateador) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('PASO 3: GPT FORMATEADOR (CRÍTICO)');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Nodo: ${gptFormateador.data.label}`);
      console.log('');
      console.log('📋 EXTRACTION CONFIG:');
      console.log(gptFormateador.data.config?.extractionConfig?.systemPrompt || 'N/A');
      console.log('');
      console.log('📝 VARIABLES A EXTRAER:');
      if (gptFormateador.data.config?.extractionConfig?.variables) {
        gptFormateador.data.config.extractionConfig.variables.forEach(v => {
          console.log(`- ${v.nombre}: ${v.descripcion} (${v.obligatoria ? 'OBLIGATORIA' : 'opcional'})`);
        });
      }
      console.log('');
      console.log('🔍 CONTEXTO PARA EXTRACCIÓN:');
      console.log(historial.map(h => `${h.role}: ${h.content}`).join('\n'));
      console.log('');
      console.log('❓ PREGUNTA CRÍTICA:');
      console.log('¿Cómo interpreta el formateador "no sé la editorial ni la edición"?');
      console.log('');
      console.log('OPCIONES:');
      console.log('A) { editorial: null, edicion: null } ❌ LOOP INFINITO');
      console.log('B) { editorial: "cualquiera", edicion: "cualquiera" } ✅ CORRECTO');
      console.log('');
    }
    
    // Buscar Router
    const edge3 = flow.edges.find(e => e.source === gptFormateador?.id);
    const router = flow.nodes.find(n => n.id === edge3?.target);
    
    if (router) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('PASO 4: ROUTER');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Nodo: ${router.data.label}`);
      console.log('');
      console.log('📋 RUTAS DISPONIBLES:');
      const routerEdges = flow.edges.filter(e => e.source === router.id);
      routerEdges.forEach((edge, i) => {
        console.log(`\n${i + 1}. ${edge.data?.label || edge.id}`);
        console.log(`   Condición: ${edge.data?.condition || 'SIN CONDICIÓN'}`);
      });
      console.log('');
      console.log('🔍 EVALUACIÓN:');
      console.log('Si formateador extrajo { editorial: null, edicion: null }:');
      console.log('  → editorial = null OR edicion = null → TRUE');
      console.log('  → Ruta 1 (Faltan datos) ❌ LOOP INFINITO');
      console.log('');
      console.log('Si formateador extrajo { editorial: "cualquiera", edicion: "cualquiera" }:');
      console.log('  → editorial = "cualquiera" AND edicion = "cualquiera" → EXISTS');
      console.log('  → Ruta 2 (Datos completos) ✅ VA A WOOCOMMERCE');
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DIAGNÓSTICO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🔴 PROBLEMA IDENTIFICADO:');
    console.log('El GPT Formateador NO está interpretando correctamente:');
    console.log('  "no sé la editorial ni la edición"');
    console.log('');
    console.log('Debería extraer:');
    console.log('  { editorial: "cualquiera", edicion: "cualquiera" }');
    console.log('');
    console.log('Pero probablemente extrae:');
    console.log('  { editorial: null, edicion: null }');
    console.log('');
    console.log('Esto causa que el Router vaya a "Faltan datos" en loop infinito.');
    console.log('');
    console.log('✅ SOLUCIÓN:');
    console.log('Actualizar extractionConfig.systemPrompt del formateador para que:');
    console.log('1. Reconozca "no sé", "no tengo idea", "no me acuerdo" como "cualquiera"');
    console.log('2. Sea EXPLÍCITO en los ejemplos');
    console.log('3. Sea SIMPLE y GENERAL para todos los formateadores');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugFlowPasoAPaso();
