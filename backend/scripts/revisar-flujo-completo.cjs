require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revisarFlujoCompleto() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }
    
    console.log('═'.repeat(100));
    console.log(`FLUJO: ${flow.name || 'Sin nombre'}`);
    console.log('═'.repeat(100));
    console.log(`Total de nodos: ${flow.nodes.length}`);
    console.log(`Total de edges: ${flow.edges.length}`);
    
    // Revisar cada nodo
    flow.nodes.forEach((node, index) => {
      console.log('\n' + '─'.repeat(100));
      console.log(`${index + 1}. NODO: ${node.id}`);
      console.log('─'.repeat(100));
      console.log(`   Tipo: ${node.type}`);
      console.log(`   Label: ${node.data.label}`);
      
      const config = node.data.config;
      
      if (!config) {
        console.log('   ⚠️  NO TIENE CONFIG');
        return;
      }
      
      // Analizar según tipo de nodo
      if (node.type === 'gpt') {
        console.log(`   📋 Tipo GPT: ${config.tipo}`);
        console.log(`   📋 Modelo: ${config.modelo}`);
        console.log(`   📋 Temperatura: ${config.temperatura}`);
        console.log(`   📋 Max Tokens: ${config.maxTokens}`);
        
        // System Prompt
        if (config.systemPrompt) {
          console.log(`\n   📝 SYSTEM PROMPT (primeros 200 chars):`);
          console.log(`   ${config.systemPrompt.substring(0, 200)}...`);
        } else {
          console.log(`   ⚠️  NO TIENE systemPrompt`);
        }
        
        // Personalidad
        if (config.personalidad) {
          console.log(`\n   👤 PERSONALIDAD (primeros 150 chars):`);
          console.log(`   ${config.personalidad.substring(0, 150)}...`);
        }
        
        // Tópicos
        if (config.topicos && config.topicos.length > 0) {
          console.log(`\n   📚 TÓPICOS: ${config.topicos.length}`);
          config.topicos.forEach((t, i) => {
            console.log(`      ${i+1}. ${t.titulo}`);
          });
        }
        
        // Extraction Config
        if (config.extractionConfig) {
          console.log(`\n   🔧 EXTRACTION CONFIG:`);
          console.log(`      Enabled: ${config.extractionConfig.enabled}`);
          console.log(`      Method: ${config.extractionConfig.method}`);
          console.log(`      Context Source: ${config.extractionConfig.contextSource}`);
          
          if (config.extractionConfig.systemPrompt) {
            console.log(`      System Prompt (primeros 200 chars):`);
            console.log(`      ${config.extractionConfig.systemPrompt.substring(0, 200)}...`);
          }
          
          if (config.extractionConfig.variables) {
            console.log(`      Variables: ${config.extractionConfig.variables.length}`);
            config.extractionConfig.variables.forEach((v, i) => {
              console.log(`         ${i+1}. ${v.nombre} (${v.tipo}) - ${v.requerido ? 'REQUERIDO' : 'OPCIONAL'}`);
            });
          }
        }
        
        // Configuración de Extracción Legacy
        if (config.configuracionExtraccion) {
          console.log(`\n   ⚠️  TIENE configuracionExtraccion LEGACY (debería usar extractionConfig)`);
        }
        
      } else if (node.type === 'whatsapp') {
        console.log(`   📱 WhatsApp Node`);
        if (config.message) {
          console.log(`   📨 Message: ${config.message.substring(0, 100)}...`);
        }
        if (config.to) {
          console.log(`   📞 To: ${config.to}`);
        }
        
      } else if (node.type === 'router') {
        console.log(`   🔀 Router Node`);
        // Buscar edges que salen de este router
        const routerEdges = flow.edges.filter(e => e.source === node.id);
        console.log(`   📋 Rutas: ${routerEdges.length}`);
        routerEdges.forEach((edge, i) => {
          console.log(`      ${i+1}. ${edge.data?.routeLabel || edge.data?.label || edge.id}`);
          console.log(`         Target: ${edge.target}`);
          console.log(`         Condition: ${edge.data?.condition || 'SIN CONDICIÓN'}`);
        });
        
      } else if (node.type === 'woocommerce') {
        console.log(`   🛍️  WooCommerce Node`);
        console.log(`   Module: ${config.module}`);
        if (config.params) {
          console.log(`   Params:`, JSON.stringify(config.params, null, 2));
        }
      }
    });
    
    console.log('\n' + '═'.repeat(100));
    console.log('ANÁLISIS DE CONFIGURACIÓN');
    console.log('═'.repeat(100));
    
    // Verificar nodos GPT
    const gptNodes = flow.nodes.filter(n => n.type === 'gpt');
    console.log(`\n📊 Nodos GPT: ${gptNodes.length}`);
    
    gptNodes.forEach(node => {
      const config = node.data.config;
      console.log(`\n   ${node.id}:`);
      console.log(`      Tipo: ${config.tipo}`);
      console.log(`      ✓ systemPrompt: ${config.systemPrompt ? 'SÍ' : 'NO'}`);
      console.log(`      ✓ personalidad: ${config.personalidad ? 'SÍ' : 'NO'}`);
      console.log(`      ✓ extractionConfig: ${config.extractionConfig ? 'SÍ' : 'NO'}`);
      
      if (config.tipo === 'formateador' && !config.extractionConfig) {
        console.log(`      ⚠️  PROBLEMA: Formateador sin extractionConfig`);
      }
      
      if (config.configuracionExtraccion) {
        console.log(`      ⚠️  LEGACY: Tiene configuracionExtraccion (debería migrar a extractionConfig)`);
      }
    });
    
    console.log('\n' + '═'.repeat(100));
    console.log('CONCLUSIÓN');
    console.log('═'.repeat(100));
    
    const formateadores = gptNodes.filter(n => n.data.config.tipo === 'formateador');
    const formateadoresConExtraction = formateadores.filter(n => n.data.config.extractionConfig);
    
    console.log(`\n✓ Formateadores: ${formateadores.length}`);
    console.log(`✓ Con extractionConfig: ${formateadoresConExtraction.length}`);
    
    if (formateadores.length === formateadoresConExtraction.length) {
      console.log(`\n✅ TODOS los formateadores tienen extractionConfig`);
    } else {
      console.log(`\n⚠️  FALTAN ${formateadores.length - formateadoresConExtraction.length} formateadores por configurar`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado');
  }
}

revisarFlujoCompleto();
