require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Limpiar parámetros hardcodeados del endpoint de WooCommerce
 * El endpoint NO debe tener parámetros predefinidos, solo la definición de qué acepta
 */

async function fixEndpointParams() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const apisCollection = db.collection('apis');
    
    const apiConfigId = new ObjectId('695320fda03785dacc8d950b');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('LIMPIAR PARÁMETROS HARDCODEADOS DEL ENDPOINT');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const api = await apisCollection.findOne({ _id: apiConfigId });
    
    if (!api) {
      console.log('❌ API no encontrada');
      return;
    }
    
    console.log('✅ API encontrada:', api.nombre);
    console.log('');
    
    // Buscar el endpoint de búsqueda
    const endpoint = api.endpoints?.find(ep => ep.id === 'buscar-productos');
    
    if (!endpoint) {
      console.log('❌ Endpoint "buscar-productos" no encontrado');
      return;
    }
    
    console.log('📋 Endpoint actual:');
    console.log('   ID:', endpoint.id);
    console.log('   Nombre:', endpoint.nombre);
    console.log('   Método:', endpoint.metodo);
    console.log('   Path:', endpoint.path);
    console.log('   Parámetros hardcodeados:', JSON.stringify(endpoint.parametros, null, 2));
    console.log('');
    
    // El problema: endpoint.parametros tiene valores hardcodeados
    // Solución: debe tener SOLO la definición de parámetros aceptados, sin valores
    
    console.log('🔧 Actualizando endpoint...');
    
    const result = await apisCollection.updateOne(
      { 
        _id: apiConfigId,
        'endpoints.id': 'buscar-productos'
      },
      {
        $set: {
          'endpoints.$.parametros': {
            // SOLO definición de parámetros, SIN valores hardcodeados
            path: [],
            query: [],
            body: []
          }
        }
      }
    );
    
    console.log(`✅ Endpoint actualizado (${result.modifiedCount} documento modificado)`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const updatedApi = await apisCollection.findOne({ _id: apiConfigId });
    const updatedEndpoint = updatedApi.endpoints?.find(ep => ep.id === 'buscar-productos');
    
    console.log('📋 Endpoint actualizado:');
    console.log('   Parámetros:', JSON.stringify(updatedEndpoint.parametros, null, 2));
    console.log('');
    
    if (!updatedEndpoint.parametros.search && !updatedEndpoint.parametros.per_page) {
      console.log('✅ Endpoint limpio - Ahora usará SOLO los parámetros del nodo');
      console.log('✅ La paginación automática se deshabilitará correctamente');
    } else {
      console.log('⚠️  Endpoint todavía tiene parámetros hardcodeados');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixEndpointParams();
