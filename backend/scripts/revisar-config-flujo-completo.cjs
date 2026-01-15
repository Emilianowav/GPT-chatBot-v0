const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function revisarFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 REVISIÓN COMPLETA DEL FLUJO WOOCOMMERCE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Orden de ejecución esperado
    const nodosOrdenados = [
      '1',                      // webhook-whatsapp
      'gpt-formateador',        // Extracción de variables
      'router',                 // Decisión basada en variables
      'woocommerce',            // Búsqueda de productos
      'gpt-asistente-ventas',   // Presentación de productos
      'whatsapp-asistente'      // Envío de mensaje
    ];
    
    nodosOrdenados.forEach((nodeId, index) => {
      const nodo = flow.nodes.find(n => n.id === nodeId);
      
      if (!nodo) {
        console.log(`❌ NODO ${index + 1}: ${nodeId} - NO ENCONTRADO\n`);
        return;
      }
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`NODO ${index + 1}: ${nodo.data.label || nodeId}`);
      console.log(`ID: ${nodeId}`);
      console.log(`Tipo: ${nodo.type}`);
      console.log(`${'='.repeat(60)}\n`);
      
      // Configuración específica por tipo de nodo
      const config = nodo.data.config || {};
      
      switch(nodo.type) {
        case 'webhook':
          console.log('📥 CONFIGURACIÓN WEBHOOK:');
          console.log(`   Tipo: ${config.webhookType || 'whatsapp'}`);
          console.log(`   Mapeo de variables:`);
          if (config.mapping) {
            Object.entries(config.mapping).forEach(([key, value]) => {
              console.log(`      ${key} ← ${value}`);
            });
          }
          break;
          
        case 'gpt':
          console.log('🤖 CONFIGURACIÓN GPT:');
          console.log(`   Tipo: ${config.tipo || 'N/A'}`);
          console.log(`   Modelo: ${config.modelo || 'gpt-4'}`);
          
          if (config.tipo === 'formateador') {
            console.log('\n   📋 EXTRACTION CONFIG:');
            console.log(`      Enabled: ${config.extractionConfig?.enabled}`);
            console.log(`      Method: ${config.extractionConfig?.method}`);
            console.log(`      Context Source: ${config.extractionConfig?.contextSource}`);
            
            console.log('\n   📝 VARIABLES A EXTRAER:');
            if (config.extractionConfig?.variables) {
              config.extractionConfig.variables.forEach((v, i) => {
                console.log(`      ${i + 1}. ${v.nombre} (${v.tipo}) - ${v.requerido ? 'REQUERIDO' : 'OPCIONAL'}`);
                if (v.descripcion) console.log(`         "${v.descripcion}"`);
              });
            }
            
            console.log('\n   💬 SYSTEM PROMPT:');
            const prompt = config.extractionConfig?.systemPrompt || config.systemPrompt || 'N/A';
            console.log(`      ${prompt.substring(0, 200)}...`);
            
          } else if (config.tipo === 'conversacional') {
            console.log('\n   💬 SYSTEM PROMPT:');
            const prompt = config.systemPrompt || 'N/A';
            console.log(`      ${prompt.substring(0, 200)}...`);
          }
          break;
          
        case 'router':
          console.log('🔀 CONFIGURACIÓN ROUTER:');
          console.log(`   Rutas configuradas: ${config.routes?.length || 0}`);
          
          // Buscar edges que salen de este router
          const routerEdges = flow.edges.filter(e => e.source === nodeId);
          console.log(`   Edges encontrados: ${routerEdges.length}\n`);
          
          routerEdges.forEach((edge, i) => {
            console.log(`   RUTA ${i + 1}:`);
            console.log(`      ID: ${edge.id}`);
            console.log(`      Label: ${edge.data?.label || 'Sin label'}`);
            console.log(`      Target: ${edge.target}`);
            console.log(`      Condición: ${edge.data?.condition || 'Sin condición'}`);
            console.log('');
          });
          break;
          
        case 'woocommerce':
          console.log('🛍️  CONFIGURACIÓN WOOCOMMERCE:');
          console.log(`   API Config ID: ${config.apiConfigId || 'NO CONFIGURADO ❌'}`);
          console.log(`   Módulo: ${config.module || 'N/A'}`);
          console.log(`   Parámetros:`);
          if (config.params) {
            Object.entries(config.params).forEach(([key, value]) => {
              console.log(`      ${key}: ${value}`);
            });
          }
          break;
          
        case 'whatsapp':
          console.log('📱 CONFIGURACIÓN WHATSAPP:');
          console.log(`   Acción: ${config.action || 'N/A'}`);
          console.log(`   Mensaje: ${config.message || config.mensaje || 'N/A'}`);
          break;
      }
      
      // Mostrar edges de salida
      const outgoingEdges = flow.edges.filter(e => e.source === nodeId);
      if (outgoingEdges.length > 0) {
        console.log('\n📤 EDGES DE SALIDA:');
        outgoingEdges.forEach(edge => {
          console.log(`   → ${edge.target} ${edge.data?.condition ? `(Condición: ${edge.data.condition})` : ''}`);
        });
      }
    });
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('✅ REVISIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verificar configuración de API de WooCommerce
    console.log('🔍 VERIFICANDO API DE WOOCOMMERCE...\n');
    const apisCollection = db.collection('api_configs');
    const wooApi = await apisCollection.findOne({ _id: new ObjectId('695320fda03785dacc8d950b') });
    
    if (wooApi) {
      console.log('✅ API de WooCommerce encontrada:');
      console.log(`   Nombre: ${wooApi.nombre}`);
      console.log(`   Base URL: ${wooApi.baseUrl}`);
      console.log(`   Activo: ${wooApi.activo}`);
      console.log(`   Endpoints: ${wooApi.endpoints?.length || 0}`);
    } else {
      console.log('❌ API de WooCommerce NO encontrada');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

revisarFlujo();
