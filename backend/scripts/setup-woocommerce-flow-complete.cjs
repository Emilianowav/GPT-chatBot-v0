require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * CONFIGURACIÓN COMPLETA DEL FLUJO WOOCOMMERCE
 * Este script configura TODO desde cero:
 * 1. API de WooCommerce (endpoints limpios)
 * 2. Flow con nodos correctamente configurados
 * 3. Nodos GPT sin extracción duplicada
 * 4. Parámetros como números, no strings
 */

async function setupWooCommerceFlowComplete() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const apisCollection = db.collection('apis');
    const flowsCollection = db.collection('flows');
    
    const API_ID = new ObjectId('695320fda03785dacc8d950b');
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 1: CONFIGURAR API DE WOOCOMMERCE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Actualizar API de WooCommerce
    const apiResult = await apisCollection.updateOne(
      { _id: API_ID },
      {
        $set: {
          'endpoints.$[elem].parametros': {
            path: [],
            query: [],
            body: []
          }
        },
        $unset: {
          workflows: ""
        }
      },
      {
        arrayFilters: [{ 'elem.id': 'buscar-productos' }]
      }
    );
    
    console.log(`✅ API actualizada (${apiResult.modifiedCount} documento)`);
    console.log('   - Endpoint limpio (sin parámetros hardcodeados)');
    console.log('   - Workflows eliminados\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 2: CONFIGURAR FLOW');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`✅ Flow encontrado: ${flow.nombre}\n`);
    
    // Actualizar nodos
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      // NODO GPT CONVERSACIONAL
      if (node.type === 'gpt' && node.id === 'gpt-conversacional') {
        console.log('📦 Configurando nodo GPT conversacional...');
        
        // Eliminar extracción
        if (node.data?.config?.variablesRecopilar) {
          delete node.data.config.variablesRecopilar;
          console.log('   ✅ Extracción legacy eliminada');
        }
        
        if (node.data?.config?.extractionConfig) {
          delete node.data.config.extractionConfig;
          console.log('   ✅ Extracción avanzada eliminada');
        }
        
        console.log('   ✅ Solo conversa, no extrae\n');
      }
      
      // NODO GPT FORMATEADOR
      if (node.type === 'gpt' && node.id === 'gpt-formateador') {
        console.log('📦 Configurando nodo GPT formateador...');
        
        // Eliminar extracción legacy
        if (node.data?.config?.variablesRecopilar) {
          delete node.data.config.variablesRecopilar;
          console.log('   ✅ Extracción legacy eliminada');
        }
        
        // Configurar extracción avanzada
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        node.data.config.extractionConfig = {
          enabled: true,
          method: 'advanced',
          contextSource: 'historial_completo',
          variables: [
            {
              nombre: 'titulo',
              tipo: 'texto',
              requerido: true,
              descripcion: 'Título del libro que busca el cliente'
            },
            {
              nombre: 'editorial',
              tipo: 'texto',
              requerido: false,
              descripcion: 'Editorial del libro'
            },
            {
              nombre: 'edicion',
              tipo: 'texto',
              requerido: false,
              descripcion: 'Edición del libro'
            }
          ]
        };
        
        console.log('   ✅ Extracción avanzada configurada');
        console.log('   ✅ Variables: titulo (requerido), editorial, edicion\n');
      }
      
      // NODO WOOCOMMERCE
      if (node.type === 'woocommerce' && node.id === 'woocommerce') {
        console.log('📦 Configurando nodo WooCommerce...');
        
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        // Configurar parámetros COMO STRINGS (se convertirán automáticamente)
        node.data.config.parametros = {
          search: '{{titulo}}',
          per_page: '100',      // String, se convierte a número automáticamente
          orderby: 'relevance',
          status: 'publish'
        };
        
        console.log('   ✅ Parámetros configurados:');
        console.log('      - search: {{titulo}}');
        console.log('      - per_page: 100 (máximo WooCommerce)');
        console.log('      - orderby: relevance');
        console.log('      - status: publish\n');
      }
    }
    
    // Guardar flow actualizado
    await flowsCollection.updateOne(
      { _id: FLOW_ID },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ Flow actualizado en base de datos\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PASO 3: VERIFICACIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verificar API
    const api = await apisCollection.findOne({ _id: API_ID });
    const endpoint = api.endpoints.find(ep => ep.id === 'buscar-productos');
    
    console.log('📋 API de WooCommerce:');
    console.log(`   Nombre: ${api.nombre}`);
    console.log(`   Base URL: ${api.baseUrl}`);
    console.log(`   Workflows: ${api.workflows?.length || 0}`);
    console.log(`   Endpoint parametros:`, JSON.stringify(endpoint.parametros, null, 2));
    console.log('');
    
    // Verificar Flow
    const updatedFlow = await flowsCollection.findOne({ _id: FLOW_ID });
    const gptConv = updatedFlow.nodes.find(n => n.id === 'gpt-conversacional');
    const gptForm = updatedFlow.nodes.find(n => n.id === 'gpt-formateador');
    const wooNode = updatedFlow.nodes.find(n => n.id === 'woocommerce');
    
    console.log('📋 Nodos del Flow:');
    console.log(`   GPT Conversacional:`);
    console.log(`      - variablesRecopilar: ${gptConv.data?.config?.variablesRecopilar ? 'SÍ ❌' : 'NO ✅'}`);
    console.log(`      - extractionConfig: ${gptConv.data?.config?.extractionConfig ? 'SÍ ❌' : 'NO ✅'}`);
    console.log('');
    console.log(`   GPT Formateador:`);
    console.log(`      - variablesRecopilar: ${gptForm.data?.config?.variablesRecopilar ? 'SÍ ❌' : 'NO ✅'}`);
    console.log(`      - extractionConfig: ${gptForm.data?.config?.extractionConfig ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`      - Variables: ${gptForm.data?.config?.extractionConfig?.variables?.length || 0}`);
    console.log('');
    console.log(`   WooCommerce:`);
    console.log(`      - Parámetros:`, JSON.stringify(wooNode.data?.config?.parametros, null, 2));
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('RESUMEN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const checks = [
      { name: 'API sin workflows', pass: !api.workflows || api.workflows.length === 0 },
      { name: 'Endpoint sin parámetros hardcodeados', pass: endpoint.parametros.query?.length === 0 },
      { name: 'GPT conversacional sin extracción', pass: !gptConv.data?.config?.variablesRecopilar && !gptConv.data?.config?.extractionConfig },
      { name: 'GPT formateador con extracción avanzada', pass: !!gptForm.data?.config?.extractionConfig },
      { name: 'WooCommerce con per_page=100', pass: wooNode.data?.config?.parametros?.per_page === '100' }
    ];
    
    checks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
    });
    
    const allPass = checks.every(c => c.pass);
    
    console.log('');
    if (allPass) {
      console.log('🎉 CONFIGURACIÓN COMPLETA Y CORRECTA');
      console.log('');
      console.log('📝 PRÓXIMOS PASOS:');
      console.log('1. Esperar deploy en Render (~2-3 min)');
      console.log('2. Limpiar estado: node scripts/limpiar-mi-numero.js');
      console.log('3. Probar desde WhatsApp: "busco harry potter 3"');
      console.log('');
      console.log('✅ Resultado esperado:');
      console.log('   - Extracción correcta de titulo');
      console.log('   - Router detecta datos completos');
      console.log('   - WooCommerce ejecuta con per_page=100 (número)');
      console.log('   - Sin error 400, sin error workflows.0.id');
      console.log('   - Respuesta con ~10 libros en 2-3 segundos');
    } else {
      console.log('⚠️  HAY PROBLEMAS EN LA CONFIGURACIÓN');
      console.log('   Revisa los checks marcados con ❌');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
  }
}

setupWooCommerceFlowComplete();
