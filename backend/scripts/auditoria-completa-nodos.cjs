const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * AUDITORÍA COMPLETA DE TODOS LOS NODOS Y EDGES
 * 
 * Revisa:
 * 1. Configuración de cada nodo (personalidad, system prompts, etc.)
 * 2. Configuración de edges (condiciones en conexiones)
 * 3. Identifica qué falta configurar
 */

async function auditoriaCompleta() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔍 AUDITORÍA COMPLETA DEL FLUJO\n');
    console.log('═'.repeat(80));
    
    const problemas = [];
    
    // ============================================================================
    // AUDITORÍA DE NODOS
    // ============================================================================
    console.log('\n📍 AUDITORÍA DE NODOS\n');
    console.log('─'.repeat(80));
    
    flow.nodes.forEach((node, index) => {
      console.log(`\n${index + 1}. ${node.id} (${node.type}):`);
      
      const config = node.data?.config;
      
      if (node.type === 'gpt') {
        // Verificar configuración de nodos GPT
        console.log(`   Model: ${config?.model || '❌ FALTA'}`);
        console.log(`   Temperature: ${config?.temperature !== undefined ? config.temperature : '❌ FALTA'}`);
        console.log(`   MaxTokens: ${config?.maxTokens || '❌ FALTA'}`);
        console.log(`   SystemPrompt: ${config?.systemPrompt ? '✅ ' + config.systemPrompt.substring(0, 50) + '...' : '❌ FALTA'}`);
        console.log(`   TopicHandling: ${config?.topicHandling || '❌ FALTA'}`);
        
        if (config?.topicos && config.topicos.length > 0) {
          console.log(`   Tópicos: ✅ ${config.topicos.length} configurados`);
        }
        
        if (config?.variablesRecopilar && config.variablesRecopilar.length > 0) {
          console.log(`   Variables a recopilar: ✅ ${config.variablesRecopilar.length} configuradas`);
        }
        
        // Detectar problemas
        if (!config?.systemPrompt) {
          problemas.push(`${node.id}: Falta systemPrompt`);
        }
        if (!config?.model) {
          problemas.push(`${node.id}: Falta model`);
        }
        if (config?.temperature === undefined) {
          problemas.push(`${node.id}: Falta temperature`);
        }
        
      } else if (node.type === 'router') {
        // Verificar configuración de routers
        console.log(`   Rutas: ${config?.routes?.length || '❌ FALTA'}`);
        
        if (config?.routes) {
          config.routes.forEach(route => {
            console.log(`      - ${route.id}: ${route.label || 'Sin label'}`);
            if (route.condition) {
              console.log(`        Condición: ${JSON.stringify(route.condition)}`);
            } else {
              console.log(`        Condición: ❌ FALTA`);
              problemas.push(`${node.id} - ${route.id}: Falta condición`);
            }
          });
        } else {
          problemas.push(`${node.id}: Falta configuración de rutas`);
        }
        
      } else if (node.type === 'whatsapp') {
        // Verificar configuración de nodos WhatsApp
        console.log(`   Action: ${config?.action || '❌ FALTA'}`);
        console.log(`   Module: ${config?.module || '❌ FALTA'}`);
        console.log(`   Message: ${config?.message || '❌ FALTA'}`);
        console.log(`   PhoneNumberId: ${config?.phoneNumberId || '❌ FALTA'}`);
        
        if (!config?.module) {
          problemas.push(`${node.id}: Falta module`);
        }
        if (!config?.message && config?.action === 'send_message') {
          problemas.push(`${node.id}: Falta message`);
        }
        
      } else if (node.type === 'woocommerce') {
        // Verificar configuración de WooCommerce
        console.log(`   Action: ${config?.action || '❌ FALTA'}`);
        console.log(`   API Config: ${config?.apiConfigId || '❌ FALTA'}`);
        
        if (!config?.action) {
          problemas.push(`${node.id}: Falta action`);
        }
        
      } else if (node.type === 'mercadopago') {
        // Verificar configuración de MercadoPago
        console.log(`   Action: ${config?.action || '❌ FALTA'}`);
        console.log(`   Items: ${config?.items || '❌ FALTA'}`);
        console.log(`   Total: ${config?.total || '❌ FALTA'}`);
        
        if (!config?.action) {
          problemas.push(`${node.id}: Falta action`);
        }
      }
    });
    
    // ============================================================================
    // AUDITORÍA DE EDGES (CONEXIONES)
    // ============================================================================
    console.log('\n\n📍 AUDITORÍA DE EDGES (CONEXIONES)\n');
    console.log('─'.repeat(80));
    
    flow.edges.forEach((edge, index) => {
      console.log(`\n${index + 1}. ${edge.id}:`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   SourceHandle: ${edge.sourceHandle || 'default'}`);
      console.log(`   Type: ${edge.type || 'default'}`);
      
      // Verificar si tiene configuración (filtros/condiciones)
      if (edge.data) {
        console.log(`   Data: ${JSON.stringify(edge.data)}`);
      } else {
        console.log(`   Data: ❌ Sin configuración`);
      }
      
      // Verificar si es un edge de router sin handle
      const sourceNode = flow.nodes.find(n => n.id === edge.source);
      if (sourceNode?.type === 'router' && !edge.sourceHandle) {
        problemas.push(`Edge ${edge.id}: Router sin sourceHandle definido`);
      }
    });
    
    // ============================================================================
    // RESUMEN DE PROBLEMAS
    // ============================================================================
    console.log('\n\n📊 RESUMEN DE PROBLEMAS\n');
    console.log('═'.repeat(80));
    
    if (problemas.length === 0) {
      console.log('\n✅ NO SE ENCONTRARON PROBLEMAS\n');
    } else {
      console.log(`\n⚠️  ${problemas.length} PROBLEMAS ENCONTRADOS:\n`);
      problemas.forEach((problema, i) => {
        console.log(`   ${i + 1}. ${problema}`);
      });
    }
    
    console.log('\n📋 ESTADÍSTICAS:');
    console.log(`   Nodos totales: ${flow.nodes.length}`);
    console.log(`   Edges totales: ${flow.edges.length}`);
    console.log(`   Nodos GPT: ${flow.nodes.filter(n => n.type === 'gpt').length}`);
    console.log(`   Nodos Router: ${flow.nodes.filter(n => n.type === 'router').length}`);
    console.log(`   Nodos WhatsApp: ${flow.nodes.filter(n => n.type === 'whatsapp').length}`);
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

auditoriaCompleta();
