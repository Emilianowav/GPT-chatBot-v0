const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';

async function buscarFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    // 1. LISTAR TODAS LAS BASES DE DATOS
    console.log('🔍 BUSCANDO EN TODAS LAS BASES DE DATOS...\n');
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log('📊 Bases de datos encontradas:');
    databases.forEach((db, i) => {
      console.log(`   ${i + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('');
    
    // 2. BUSCAR FLUJOS EN neural_chatbot
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 FLUJOS EN: neural_chatbot');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flowsCollection = db.collection('flows');
    const flows = await flowsCollection.find({}).toArray();
    
    console.log(`Total de flujos: ${flows.length}\n`);
    
    flows.forEach((flow, i) => {
      const nodos = flow.nodes?.length || 0;
      const edges = flow.edges?.length || 0;
      
      console.log(`${i + 1}. ${flow.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${flow._id}`);
      console.log(`   Empresa: ${flow.empresaId || 'N/A'}`);
      console.log(`   Nodos: ${nodos}`);
      console.log(`   Edges: ${edges}`);
      console.log(`   Activo: ${flow.activo}`);
      console.log(`   Bot Type: ${flow.botType || 'N/A'}`);
      
      if (nodos === 14) {
        console.log('   ⭐ ESTE ES EL FLUJO DE 14 NODOS');
      }
      console.log('');
    });
    
    // 3. BUSCAR APIs DE WOOCOMMERCE EN TODAS LAS COLECCIONES
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 BUSCANDO APIs DE WOOCOMMERCE...');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log('📚 Colecciones en neural_chatbot:');
    collections.forEach((col, i) => {
      console.log(`   ${i + 1}. ${col.name}`);
    });
    console.log('');
    
    // Buscar en api_configs
    console.log('🔍 Buscando en api_configs...');
    const apiConfigsCollection = db.collection('api_configs');
    const apiConfigs = await apiConfigsCollection.find({}).toArray();
    
    console.log(`   Total: ${apiConfigs.length}\n`);
    
    if (apiConfigs.length > 0) {
      apiConfigs.forEach((api, i) => {
        console.log(`   ${i + 1}. ${api.nombre || 'Sin nombre'}`);
        console.log(`      ID: ${api._id}`);
        console.log(`      Base URL: ${api.baseUrl || 'N/A'}`);
        console.log(`      Empresa: ${api.empresaId || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No se encontraron APIs en api_configs\n');
    }
    
    // Buscar en apis (colección alternativa)
    console.log('🔍 Buscando en apis...');
    try {
      const apisCollection = db.collection('apis');
      const apis = await apisCollection.find({}).toArray();
      
      console.log(`   Total: ${apis.length}\n`);
      
      if (apis.length > 0) {
        apis.forEach((api, i) => {
          console.log(`   ${i + 1}. ${api.nombre || 'Sin nombre'}`);
          console.log(`      ID: ${api._id}`);
          console.log(`      Base URL: ${api.baseUrl || 'N/A'}`);
          console.log(`      Empresa: ${api.empresaId || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('   ❌ No se encontraron APIs en apis\n');
      }
    } catch (error) {
      console.log('   ⚠️  Colección "apis" no existe\n');
    }
    
    // 4. BUSCAR EMPRESAS
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🏢 EMPRESAS EN LA BD:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const empresasCollection = db.collection('companies');
    const empresas = await empresasCollection.find({}).toArray();
    
    console.log(`Total: ${empresas.length}\n`);
    
    empresas.forEach((empresa, i) => {
      console.log(`${i + 1}. ${empresa.nombre}`);
      console.log(`   ID: ${empresa._id}`);
      console.log(`   Flujo Activo: ${empresa.flujoActivo || 'N/A'}`);
      console.log('');
    });
    
    // 5. VERIFICAR FLUJO ESPECÍFICO
    const flowId = '695a156681f6d67f0ae9cf40';
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`🔍 VERIFICANDO FLUJO: ${flowId}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = flows.find(f => f._id.toString() === flowId);
    
    if (flow) {
      console.log('✅ Flujo encontrado:');
      console.log(`   Nombre: ${flow.nombre}`);
      console.log(`   Nodos: ${flow.nodes?.length || 0}`);
      console.log(`   Edges: ${flow.edges?.length || 0}`);
      console.log(`   Empresa ID: ${flow.empresaId}`);
      
      // Buscar nodo WooCommerce
      const wooNode = flow.nodes?.find(n => n.type === 'woocommerce');
      if (wooNode) {
        console.log('\n   🛍️  Nodo WooCommerce encontrado:');
        console.log(`      ID: ${wooNode.id}`);
        console.log(`      API Config ID: ${wooNode.data?.config?.apiConfigId || 'NO CONFIGURADO ❌'}`);
        console.log(`      Módulo: ${wooNode.data?.config?.module || 'N/A'}`);
      }
    } else {
      console.log('❌ Flujo no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
  }
}

buscarFlujo();
