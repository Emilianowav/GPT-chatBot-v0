require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Script para debuggear la ejecución del flujo
 * Analiza qué entra y sale de cada nodo sin ejecutar realmente
 */

async function debugFlowExecution() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    const contactosCollection = db.collection('contactos_empresa');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    // Buscar historial del contacto
    const contacto = await contactosCollection.findOne({ telefono: '5493794946066' });
    const historial = contacto?.conversaciones?.historial || [];
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DEBUG DE EJECUCIÓN DEL FLUJO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`📋 Flujo: ${flow.name || 'Sin nombre'}`);
    console.log(`📞 Contacto: 5493794946066`);
    console.log(`📚 Historial: ${historial.length} mensajes\n`);
    
    if (historial.length > 0) {
      console.log('Últimos mensajes del historial:');
      historial.slice(-4).forEach((msg, i) => {
        const role = i % 2 === 0 ? 'Usuario' : 'Bot';
        console.log(`   ${role}: ${msg.substring(0, 60)}${msg.length > 60 ? '...' : ''}`);
      });
      console.log('');
    }
    
    // Simular variables globales iniciales
    const globalVariables = {
      telefono_cliente: '5493794946066',
      telefono_empresa: '906667632531979',
      phoneNumberId: '906667632531979',
      mensaje_usuario: 'Quiero harry potter 3',
      empresaId: '6940a9a181b92bfce970fdb5'
    };
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VARIABLES GLOBALES INICIALES');
    console.log('═══════════════════════════════════════════════════════════\n');
    Object.entries(globalVariables).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');
    
    // Analizar cada nodo
    const debugLog = [];
    
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      const nodeDebug = {
        index: i + 1,
        id: node.id,
        type: node.type,
        label: node.data.label,
        input: {},
        config: {},
        systemPrompt: null,
        output: {},
        errors: []
      };
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`NODO ${i + 1}: ${node.data.label} (${node.type})`);
      console.log('═══════════════════════════════════════════════════════════\n');
      
      // Determinar input del nodo (desde edge anterior)
      const incomingEdge = flow.edges.find(e => e.target === node.id);
      if (incomingEdge) {
        const sourceNode = flow.nodes.find(n => n.id === incomingEdge.source);
        console.log(`📥 INPUT (desde: ${sourceNode?.data.label || incomingEdge.source})`);
        
        if (node.type === 'webhook') {
          nodeDebug.input = {
            message: globalVariables.mensaje_usuario,
            from: globalVariables.telefono_cliente,
            to: globalVariables.telefono_empresa,
            phoneNumberId: globalVariables.phoneNumberId
          };
        } else {
          nodeDebug.input = { ...globalVariables };
        }
        
        console.log(JSON.stringify(nodeDebug.input, null, 2));
        console.log('');
      } else {
        console.log('📥 INPUT: Nodo inicial (sin input previo)\n');
      }
      
      // Analizar configuración del nodo
      const config = node.data.config;
      console.log('⚙️  CONFIGURACIÓN DEL NODO:\n');
      
      switch (node.type) {
        case 'webhook':
          nodeDebug.config = {
            module: config.module,
            phoneNumberId: config.phoneNumberId,
            empresaId: config.empresaId
          };
          console.log(`   Módulo: ${config.module}`);
          console.log(`   Phone Number ID: ${config.phoneNumberId}`);
          console.log(`   Empresa ID: ${config.empresaId}`);
          
          nodeDebug.output = {
            message: globalVariables.mensaje_usuario,
            from: globalVariables.telefono_cliente,
            to: globalVariables.telefono_empresa,
            phoneNumberId: globalVariables.phoneNumberId,
            timestamp: new Date().toISOString(),
            profileName: 'Usuario Test'
          };
          break;
          
        case 'gpt':
          nodeDebug.config = {
            tipo: config.tipo,
            modelo: config.modelo,
            temperatura: config.temperatura,
            maxTokens: config.maxTokens
          };
          
          console.log(`   Tipo: ${config.tipo}`);
          console.log(`   Modelo: ${config.modelo}`);
          console.log(`   Temperatura: ${config.temperatura}`);
          console.log(`   Max Tokens: ${config.maxTokens}`);
          console.log('');
          
          // Determinar cómo se construye el systemPrompt
          if (config.personalidad || config.topicos || config.variablesRecopilar) {
            console.log('   🔧 SystemPrompt: CONSTRUIDO AUTOMÁTICAMENTE desde:');
            
            if (config.personalidad) {
              console.log(`      ✅ Personalidad: "${config.personalidad.substring(0, 80)}..."`);
              nodeDebug.config.personalidad = config.personalidad;
            } else {
              console.log('      ❌ Personalidad: NO');
            }
            
            if (config.topicos && config.topicos.length > 0) {
              console.log(`      ✅ Tópicos: ${config.topicos.length}`);
              config.topicos.forEach(t => {
                console.log(`         - ${t.titulo || t}`);
              });
              nodeDebug.config.topicos = config.topicos;
            } else {
              console.log('      ❌ Tópicos: NO');
            }
            
            if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
              console.log(`      ✅ Variables a recopilar: ${config.variablesRecopilar.length}`);
              config.variablesRecopilar.forEach(v => {
                console.log(`         - ${v.nombre} (${v.tipo}) ${v.obligatorio ? '- OBLIGATORIO' : ''}`);
              });
              nodeDebug.config.variablesRecopilar = config.variablesRecopilar;
            } else {
              console.log('      ❌ Variables a recopilar: NO');
            }
            
            // Construir systemPrompt simulado
            let systemPromptParts = [];
            
            if (config.personalidad) {
              systemPromptParts.push('# PERSONALIDAD');
              systemPromptParts.push(config.personalidad);
              systemPromptParts.push('');
            }
            
            if (config.topicos && config.topicos.length > 0) {
              systemPromptParts.push('# INFORMACIÓN DISPONIBLE');
              systemPromptParts.push('Tienes acceso a la siguiente información para responder consultas del usuario:');
              systemPromptParts.push('');
              config.topicos.forEach((t, idx) => {
                systemPromptParts.push(`## ${idx + 1}. ${t.titulo}`);
                systemPromptParts.push(t.contenido);
                if (t.keywords && t.keywords.length > 0) {
                  systemPromptParts.push(`📌 Palabras clave: ${t.keywords.join(', ')}`);
                }
                systemPromptParts.push('');
              });
            }
            
            if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
              systemPromptParts.push('# RECOPILACIÓN DE DATOS');
              systemPromptParts.push('Tu tarea principal es recopilar los siguientes datos del cliente:');
              systemPromptParts.push('');
              
              const obligatorias = config.variablesRecopilar.filter(v => v.obligatorio);
              if (obligatorias.length > 0) {
                systemPromptParts.push('## DATOS OBLIGATORIOS:');
                obligatorias.forEach((v, idx) => {
                  systemPromptParts.push(`${idx + 1}. **${v.nombre}** - ${v.descripcion}`);
                  if (v.tipo) systemPromptParts.push(`   Tipo: ${v.tipo}`);
                  systemPromptParts.push('');
                });
              }
            }
            
            nodeDebug.systemPrompt = systemPromptParts.join('\n');
            
          } else if (config.systemPrompt) {
            console.log('   🔧 SystemPrompt: LEGACY (guardado en BD)');
            console.log(`      "${config.systemPrompt.substring(0, 100)}..."`);
            nodeDebug.systemPrompt = config.systemPrompt;
          } else {
            console.log('   ⚠️  SystemPrompt: FALLBACK ("Eres un asistente útil.")');
            nodeDebug.systemPrompt = 'Eres un asistente útil.';
            nodeDebug.errors.push('No tiene personalidad, topicos, variables ni systemPrompt legacy');
          }
          
          console.log('');
          
          // Determinar userMessage
          let userMessage;
          if (config.tipo === 'transform') {
            userMessage = JSON.stringify(nodeDebug.input, null, 2);
          } else {
            userMessage = nodeDebug.input.mensaje_usuario 
              || nodeDebug.input.message 
              || globalVariables.mensaje_usuario 
              || JSON.stringify(nodeDebug.input);
          }
          
          console.log(`   📨 Mensaje del usuario que se enviará a GPT:`);
          console.log(`      "${userMessage}"`);
          console.log('');
          
          // Determinar historial
          if (config.tipo === 'conversacional' && historial.length > 0) {
            console.log(`   📚 Historial de conversación: ${historial.length} mensajes`);
            console.log('      Se agregarán al contexto de GPT alternando user/assistant');
            console.log('');
          }
          
          // Configuración de extracción
          if (config.configuracionExtraccion) {
            console.log('   🔍 Configuración de extracción:');
            console.log(`      Fuente: ${config.configuracionExtraccion.fuenteDatos}`);
            console.log(`      Formato: ${config.configuracionExtraccion.formatoSalida?.tipo || config.configuracionExtraccion.formatoSalida}`);
            if (config.configuracionExtraccion.camposEsperados) {
              console.log('      Campos esperados:');
              config.configuracionExtraccion.camposEsperados.forEach(c => {
                console.log(`         - ${c.nombre || c} (${c.tipoDato || 'string'}) ${c.requerido ? '- REQUERIDO' : ''}`);
              });
            }
            console.log('');
            nodeDebug.config.configuracionExtraccion = config.configuracionExtraccion;
          }
          
          // Output simulado
          nodeDebug.output = {
            respuesta_gpt: '[Respuesta de GPT - no ejecutada]',
            tokens: 0,
            costo: 0
          };
          
          if (config.variablesRecopilar) {
            config.variablesRecopilar.forEach(v => {
              nodeDebug.output[v.nombre] = null;
            });
          }
          
          break;
          
        case 'router':
          const routes = config.routes || [];
          console.log(`   Rutas configuradas: ${routes.length}`);
          routes.forEach(r => {
            console.log(`      - ${r.label} (${r.id}): ${r.condition}`);
          });
          console.log('');
          
          // Evaluar condiciones (simulado)
          console.log('   🔍 Evaluación de condiciones:');
          routes.forEach(r => {
            const condition = r.condition;
            console.log(`      ${r.label}: ${condition}`);
            
            // Simular evaluación
            if (condition.includes('{{titulo}} exists')) {
              const hasTitulo = globalVariables.titulo !== undefined && globalVariables.titulo !== null;
              console.log(`         Resultado: ${hasTitulo ? '✅ TRUE' : '❌ FALSE'} (titulo = ${globalVariables.titulo || 'undefined'})`);
            } else if (condition.includes('{{titulo}} not exists')) {
              const hasTitulo = globalVariables.titulo !== undefined && globalVariables.titulo !== null;
              console.log(`         Resultado: ${!hasTitulo ? '✅ TRUE' : '❌ FALSE'} (titulo = ${globalVariables.titulo || 'undefined'})`);
            }
          });
          console.log('');
          
          nodeDebug.config.routes = routes;
          nodeDebug.output = {
            _routerPath: '[Depende de evaluación]',
            _routerLabel: '[Depende de evaluación]'
          };
          break;
          
        case 'woocommerce':
          console.log(`   API Config ID: ${config.apiConfigId}`);
          console.log(`   Endpoint ID: ${config.endpointId}`);
          console.log('   Parámetros:');
          Object.entries(config.parametros || {}).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
          });
          console.log('');
          
          nodeDebug.config = {
            apiConfigId: config.apiConfigId,
            endpointId: config.endpointId,
            parametros: config.parametros
          };
          
          nodeDebug.output = {
            productos: '[Array de productos de WooCommerce]',
            total_encontrados: 0
          };
          break;
          
        case 'whatsapp':
          console.log(`   Mensaje: ${config.message || config.mensaje || 'N/A'}`);
          console.log(`   Teléfono: ${config.telefono || config.to || 'N/A'}`);
          console.log('');
          
          nodeDebug.config = {
            message: config.message || config.mensaje,
            telefono: config.telefono || config.to
          };
          
          nodeDebug.output = {
            status: 'sent',
            to: config.telefono || config.to,
            message: config.message || config.mensaje
          };
          break;
      }
      
      console.log('📤 OUTPUT (simulado):\n');
      console.log(JSON.stringify(nodeDebug.output, null, 2));
      console.log('');
      
      if (nodeDebug.errors.length > 0) {
        console.log('⚠️  ERRORES/ADVERTENCIAS:\n');
        nodeDebug.errors.forEach(err => {
          console.log(`   ❌ ${err}`);
        });
        console.log('');
      }
      
      // Buscar edges salientes
      const outgoingEdges = flow.edges.filter(e => e.source === node.id);
      if (outgoingEdges.length > 0) {
        console.log('🔗 CONEXIONES SALIENTES:\n');
        outgoingEdges.forEach(edge => {
          const targetNode = flow.nodes.find(n => n.id === edge.target);
          console.log(`   → ${targetNode?.data.label || edge.target}`);
          if (edge.sourceHandle) {
            console.log(`      Handle: ${edge.sourceHandle}`);
          }
          if (edge.data?.routeId) {
            console.log(`      Ruta: ${edge.data.routeLabel} (${edge.data.routeId})`);
          }
        });
        console.log('');
      }
      
      debugLog.push(nodeDebug);
    }
    
    // Guardar debug log
    const debugPath = path.join(__dirname, '../docs/flow-debug.json');
    fs.writeFileSync(debugPath, JSON.stringify(debugLog, null, 2));
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Debug completado');
    console.log(`📄 Archivo: ${debugPath}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugFlowExecution();
