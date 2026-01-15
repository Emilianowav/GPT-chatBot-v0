require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Script para documentar la ejecución completa de un flujo
 * Captura toda la información de cada nodo y genera documentación
 */

async function documentFlowExecution() {
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
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DOCUMENTACIÓN DE FLUJO: ' + flow.name);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const documentation = {
      flowName: flow.name,
      flowId: flow._id.toString(),
      timestamp: new Date().toISOString(),
      nodes: [],
      edges: [],
      globalVariables: [],
      executionFlow: []
    };
    
    // Documentar cada nodo
    console.log('📋 NODOS DEL FLUJO:\n');
    
    flow.nodes.forEach((node, index) => {
      const nodeDoc = {
        index: index + 1,
        id: node.id,
        type: node.type,
        label: node.data.label,
        config: {},
        purpose: '',
        inputs: [],
        outputs: [],
        variables: []
      };
      
      console.log(`${index + 1}. ${node.data.label} (${node.type})`);
      console.log(`   ID: ${node.id}`);
      
      // Documentar según tipo de nodo
      switch (node.type) {
        case 'webhook':
          nodeDoc.purpose = 'Recibe mensajes de WhatsApp vía webhook de Meta';
          nodeDoc.config = {
            module: node.data.config.module,
            phoneNumberId: node.data.config.phoneNumberId,
            empresaId: node.data.config.empresaId
          };
          nodeDoc.outputs = [
            'message (texto del mensaje)',
            'from (teléfono del cliente)',
            'to (teléfono de la empresa)',
            'phoneNumberId',
            'timestamp',
            'profileName'
          ];
          console.log(`   📥 Recibe: Mensajes de WhatsApp`);
          console.log(`   📤 Envía: message, from, to, phoneNumberId, timestamp, profileName`);
          break;
          
        case 'gpt':
          const gptConfig = node.data.config;
          nodeDoc.purpose = gptConfig.tipo === 'conversacional' 
            ? 'Conversa con el usuario y recopila información'
            : gptConfig.tipo === 'formateador'
            ? 'Extrae y estructura datos del historial de conversación'
            : 'Procesa y transforma datos';
          
          nodeDoc.config = {
            tipo: gptConfig.tipo,
            modelo: gptConfig.modelo,
            temperatura: gptConfig.temperatura,
            maxTokens: gptConfig.maxTokens
          };
          
          if (gptConfig.instrucciones) {
            console.log(`   📝 Instrucciones:`);
            console.log(`      ${gptConfig.instrucciones.substring(0, 100)}...`);
            nodeDoc.config.instrucciones = gptConfig.instrucciones;
          }
          
          if (gptConfig.personalidad) {
            console.log(`   👤 Personalidad: ${gptConfig.personalidad.substring(0, 80)}...`);
            nodeDoc.config.personalidad = gptConfig.personalidad;
          }
          
          if (gptConfig.topicos && gptConfig.topicos.length > 0) {
            console.log(`   📚 Tópicos: ${gptConfig.topicos.length}`);
            gptConfig.topicos.forEach(t => {
              console.log(`      - ${t.titulo || t}`);
            });
            nodeDoc.config.topicos = gptConfig.topicos;
          }
          
          if (gptConfig.variablesRecopilar && gptConfig.variablesRecopilar.length > 0) {
            console.log(`   📊 Variables a recopilar:`);
            gptConfig.variablesRecopilar.forEach(v => {
              console.log(`      - ${v.nombre} (${v.tipo}) ${v.obligatorio ? '- OBLIGATORIO' : ''}`);
              nodeDoc.variables.push({
                nombre: v.nombre,
                tipo: v.tipo,
                obligatorio: v.obligatorio,
                descripcion: v.descripcion
              });
            });
          }
          
          if (gptConfig.configuracionExtraccion) {
            console.log(`   🔧 Configuración de extracción:`);
            console.log(`      Fuente: ${gptConfig.configuracionExtraccion.fuenteDatos}`);
            console.log(`      Formato: ${gptConfig.configuracionExtraccion.formatoSalida?.tipo || gptConfig.configuracionExtraccion.formatoSalida}`);
            if (gptConfig.configuracionExtraccion.camposEsperados) {
              console.log(`      Campos: ${gptConfig.configuracionExtraccion.camposEsperados.map(c => c.nombre || c).join(', ')}`);
            }
            nodeDoc.config.configuracionExtraccion = gptConfig.configuracionExtraccion;
          }
          
          nodeDoc.outputs = ['respuesta_gpt', 'tokens', 'costo'];
          if (gptConfig.variablesRecopilar) {
            nodeDoc.outputs.push(...gptConfig.variablesRecopilar.map(v => v.nombre));
          }
          break;
          
        case 'router':
          nodeDoc.purpose = 'Evalúa condiciones y dirige el flujo por diferentes rutas';
          const routes = node.data.config.routes || [];
          console.log(`   🔀 Rutas: ${routes.length}`);
          routes.forEach(r => {
            console.log(`      - ${r.label}: ${r.condition}`);
          });
          nodeDoc.config.routes = routes;
          nodeDoc.outputs = ['_routerPath', '_routerLabel'];
          break;
          
        case 'woocommerce':
          nodeDoc.purpose = 'Consulta productos en WooCommerce';
          console.log(`   🛒 API: ${node.data.config.apiConfigId}`);
          console.log(`   🔍 Endpoint: ${node.data.config.endpointId}`);
          nodeDoc.config = {
            apiConfigId: node.data.config.apiConfigId,
            endpointId: node.data.config.endpointId,
            parametros: node.data.config.parametros
          };
          nodeDoc.inputs = ['titulo', 'editorial', 'edicion'];
          nodeDoc.outputs = ['productos', 'total_encontrados'];
          break;
          
        case 'whatsapp':
          nodeDoc.purpose = 'Envía mensaje de WhatsApp al cliente';
          console.log(`   📱 Mensaje: ${node.data.config.message || node.data.config.mensaje || 'N/A'}`);
          console.log(`   📞 Teléfono: ${node.data.config.telefono || node.data.config.to || 'N/A'}`);
          nodeDoc.config = {
            message: node.data.config.message || node.data.config.mensaje,
            telefono: node.data.config.telefono || node.data.config.to
          };
          nodeDoc.inputs = ['message', 'telefono'];
          nodeDoc.outputs = ['status', 'to', 'message'];
          break;
      }
      
      console.log('');
      documentation.nodes.push(nodeDoc);
    });
    
    // Documentar edges
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('CONEXIONES (EDGES):\n');
    
    flow.edges.forEach((edge, index) => {
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      
      const edgeDoc = {
        index: index + 1,
        id: edge.id,
        from: {
          id: edge.source,
          label: sourceNode?.data.label
        },
        to: {
          id: edge.target,
          label: targetNode?.data.label
        },
        sourceHandle: edge.sourceHandle,
        routeId: edge.data?.routeId,
        routeLabel: edge.data?.routeLabel
      };
      
      console.log(`${index + 1}. ${sourceNode?.data.label || edge.source} → ${targetNode?.data.label || edge.target}`);
      if (edge.sourceHandle) {
        console.log(`   Handle: ${edge.sourceHandle}`);
      }
      if (edge.data?.routeId) {
        console.log(`   Ruta: ${edge.data.routeLabel} (${edge.data.routeId})`);
      }
      
      documentation.edges.push(edgeDoc);
    });
    
    // Buscar el contacto de prueba para ver historial
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('HISTORIAL DE CONVERSACIÓN (Ejemplo):\n');
    
    const contacto = await contactosCollection.findOne({ telefono: '5493794946066' });
    if (contacto && contacto.conversaciones?.historial) {
      console.log(`📚 Mensajes en historial: ${contacto.conversaciones.historial.length}`);
      contacto.conversaciones.historial.slice(0, 6).forEach((msg, i) => {
        const role = i % 2 === 0 ? 'Usuario' : 'Asistente';
        console.log(`   ${role}: ${msg.substring(0, 80)}${msg.length > 80 ? '...' : ''}`);
      });
      
      documentation.executionFlow.push({
        step: 'Historial cargado',
        messages: contacto.conversaciones.historial
      });
    }
    
    // Generar archivo de documentación
    const docPath = path.join(__dirname, '../docs/flow-documentation.json');
    const docDir = path.dirname(docPath);
    
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }
    
    fs.writeFileSync(docPath, JSON.stringify(documentation, null, 2));
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Documentación generada exitosamente');
    console.log(`📄 Archivo: ${docPath}`);
    
    // Generar también un README en markdown
    const readmePath = path.join(__dirname, '../docs/FLOW-DOCUMENTATION.md');
    let markdown = `# Documentación del Flujo: ${flow.name}\n\n`;
    markdown += `**ID del Flujo:** ${flow._id}\n`;
    markdown += `**Generado:** ${new Date().toLocaleString()}\n\n`;
    
    markdown += `## Descripción General\n\n`;
    markdown += `Este flujo maneja la conversación con clientes de Veo Veo Libros para ayudarles a buscar libros.\n\n`;
    
    markdown += `## Nodos del Flujo\n\n`;
    documentation.nodes.forEach(node => {
      markdown += `### ${node.index}. ${node.label}\n\n`;
      markdown += `- **ID:** \`${node.id}\`\n`;
      markdown += `- **Tipo:** \`${node.type}\`\n`;
      markdown += `- **Propósito:** ${node.purpose}\n\n`;
      
      if (node.config && Object.keys(node.config).length > 0) {
        markdown += `**Configuración:**\n\n`;
        markdown += `\`\`\`json\n${JSON.stringify(node.config, null, 2)}\n\`\`\`\n\n`;
      }
      
      if (node.inputs && node.inputs.length > 0) {
        markdown += `**Entradas:**\n`;
        node.inputs.forEach(input => {
          markdown += `- ${input}\n`;
        });
        markdown += `\n`;
      }
      
      if (node.outputs && node.outputs.length > 0) {
        markdown += `**Salidas:**\n`;
        node.outputs.forEach(output => {
          markdown += `- ${output}\n`;
        });
        markdown += `\n`;
      }
      
      if (node.variables && node.variables.length > 0) {
        markdown += `**Variables a Recopilar:**\n\n`;
        markdown += `| Variable | Tipo | Obligatorio | Descripción |\n`;
        markdown += `|----------|------|-------------|-------------|\n`;
        node.variables.forEach(v => {
          markdown += `| ${v.nombre} | ${v.tipo} | ${v.obligatorio ? '✅' : '❌'} | ${v.descripcion} |\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    });
    
    markdown += `## Conexiones (Edges)\n\n`;
    markdown += `| # | Desde | Hacia | Ruta |\n`;
    markdown += `|---|-------|-------|------|\n`;
    documentation.edges.forEach(edge => {
      const route = edge.routeLabel ? `${edge.routeLabel} (${edge.routeId})` : '-';
      markdown += `| ${edge.index} | ${edge.from.label} | ${edge.to.label} | ${route} |\n`;
    });
    markdown += `\n`;
    
    markdown += `## Flujo de Ejecución\n\n`;
    markdown += `1. **Webhook WhatsApp** recibe mensaje del cliente\n`;
    markdown += `2. **GPT Conversacional** conversa y recopila: título, editorial, edición\n`;
    markdown += `3. **GPT Formateador** extrae datos estructurados del historial\n`;
    markdown += `4. **Router** evalúa si tiene los datos completos\n`;
    markdown += `   - ❌ Si faltan datos → GPT Pedir Datos → WhatsApp (vuelve al paso 2)\n`;
    markdown += `   - ✅ Si tiene datos → WooCommerce busca productos\n`;
    markdown += `5. **GPT Resultados** formatea los productos encontrados\n`;
    markdown += `6. **WhatsApp** envía resultados al cliente\n\n`;
    
    markdown += `## Variables Globales\n\n`;
    markdown += `- \`telefono_cliente\`: Teléfono del cliente que envía el mensaje\n`;
    markdown += `- \`telefono_empresa\`: Teléfono de la empresa (Veo Veo)\n`;
    markdown += `- \`phoneNumberId\`: ID del número de WhatsApp Business\n`;
    markdown += `- \`mensaje_usuario\`: Último mensaje enviado por el usuario\n`;
    markdown += `- \`titulo\`: Título del libro (extraído por GPT)\n`;
    markdown += `- \`editorial\`: Editorial del libro (extraído por GPT)\n`;
    markdown += `- \`edicion\`: Edición del libro (extraído por GPT)\n\n`;
    
    fs.writeFileSync(readmePath, markdown);
    
    console.log(`📄 Markdown: ${readmePath}`);
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

documentFlowExecution();
