require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Configurar conexión de WooCommerce en el flujo
 */

async function configureWooCommerceConnection() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CONFIGURAR CONEXIÓN DE WOOCOMMERCE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 Flujo actual:', flow.nombre);
    console.log('🔧 Configuración actual de WooCommerce:');
    console.log(JSON.stringify(flow.config?.woocommerce || {}, null, 2));
    console.log('');
    
    // Configuración de ejemplo para WooCommerce
    const woocommerceConfig = {
      url: 'https://tu-tienda.com',  // URL de tu tienda WooCommerce
      consumerKey: 'ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // Consumer Key de WooCommerce
      consumerSecret: 'cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // Consumer Secret de WooCommerce
      version: 'wc/v3'
    };
    
    console.log('⚠️  INSTRUCCIONES:\n');
    console.log('Para configurar WooCommerce, necesitas:');
    console.log('1. URL de tu tienda WooCommerce');
    console.log('2. Consumer Key (ck_...)');
    console.log('3. Consumer Secret (cs_...)');
    console.log('');
    console.log('Puedes obtener estas credenciales en:');
    console.log('WooCommerce → Ajustes → Avanzado → REST API → Agregar clave');
    console.log('');
    console.log('Configuración de ejemplo:');
    console.log(JSON.stringify(woocommerceConfig, null, 2));
    console.log('');
    
    // Preguntar si desea configurar ahora
    console.log('═══════════════════════════════════════════════════════════');
    console.log('OPCIONES:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('1. Edita este script y reemplaza los valores de ejemplo');
    console.log('2. O configura directamente en el nodo WooCommerce desde el frontend');
    console.log('3. O actualiza flow.config.woocommerce en MongoDB manualmente');
    console.log('');
    
    // Verificar si ya existe configuración
    if (flow.config?.woocommerce?.url) {
      console.log('✅ Ya existe una configuración de WooCommerce');
      console.log('   URL:', flow.config.woocommerce.url);
      console.log('   Consumer Key:', flow.config.woocommerce.consumerKey ? '✅ Configurado' : '❌ Falta');
      console.log('   Consumer Secret:', flow.config.woocommerce.consumerSecret ? '✅ Configurado' : '❌ Falta');
    } else {
      console.log('⚠️  No hay configuración de WooCommerce');
      console.log('');
      console.log('Para configurar, ejecuta:');
      console.log('');
      console.log('await flowsCollection.updateOne(');
      console.log('  { _id: new ObjectId("695a156681f6d67f0ae9cf40") },');
      console.log('  {');
      console.log('    $set: {');
      console.log('      "config.woocommerce": {');
      console.log('        url: "https://tu-tienda.com",');
      console.log('        consumerKey: "ck_...",');
      console.log('        consumerSecret: "cs_...",');
      console.log('        version: "wc/v3"');
      console.log('      }');
      console.log('    }');
      console.log('  }');
      console.log(');');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ALTERNATIVA: Configurar en el nodo directamente');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verificar configuración del nodo WooCommerce
    const wooNode = flow.nodes.find(n => n.id === 'woocommerce');
    if (wooNode) {
      console.log('📦 Nodo WooCommerce encontrado');
      console.log('   Config actual:');
      console.log(JSON.stringify(wooNode.data.config, null, 2));
      console.log('');
      
      if (wooNode.data.config?.connection) {
        console.log('✅ El nodo tiene configuración de conexión propia');
      } else {
        console.log('⚠️  El nodo no tiene configuración de conexión propia');
        console.log('   Usará flow.config.woocommerce (configuración global del flujo)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configureWooCommerceConnection();
