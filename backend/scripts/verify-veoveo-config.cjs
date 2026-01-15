require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function verifyVeoVeoConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    
    // 1. Verificar empresa Veo Veo
    const empresa = await db.collection('empresas').findOne({ 
      nombre: /veo veo/i 
    });
    
    console.log('📋 EMPRESA VEO VEO:');
    if (empresa) {
      console.log(`  ID: ${empresa._id}`);
      console.log(`  Nombre: ${empresa.nombre}`);
      console.log(`  Phone Number ID: ${empresa.phoneNumberId || 'NO CONFIGURADO'}`);
    } else {
      console.log('  ❌ No encontrada');
    }
    
    // 2. Verificar API Configuration de WooCommerce
    console.log('\n📋 API CONFIGURATION WOOCOMMERCE:');
    const apiConfig = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });
    
    if (apiConfig) {
      console.log(`  ID: ${apiConfig._id}`);
      console.log(`  Nombre: ${apiConfig.nombre}`);
      console.log(`  Base URL: ${apiConfig.baseUrl}`);
      console.log(`  Endpoints disponibles:`);
      if (apiConfig.endpoints) {
        apiConfig.endpoints.forEach(ep => {
          console.log(`    - ${ep.id}: ${ep.metodo} ${ep.path}`);
        });
      }
    } else {
      console.log('  ❌ No encontrada');
    }
    
    // 3. Verificar Flow actual
    console.log('\n📋 FLOW ACTUAL:');
    const flow = await db.collection('flows').findOne({
      nombre: /woocommerce/i
    });
    
    if (flow) {
      console.log(`  ID: ${flow._id}`);
      console.log(`  Nombre: ${flow.nombre}`);
      console.log(`  Empresa ID: ${flow.empresaId}`);
      console.log(`  Nodos: ${flow.nodes?.length || 0}`);
      console.log(`  Edges: ${flow.edges?.length || 0}`);
    } else {
      console.log('  ❌ No encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyVeoVeoConfig();
