const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function configurarGPTAsistente() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 CONFIGURAR GPT ASISTENTE - VARIABLES SIMPLIFICADAS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    const gptAsistente = flow.nodes.find(n => n.id === 'gpt-asistente-ventas');
    
    console.log('📋 CONFIGURACIÓN ACTUAL:\n');
    console.log('System Prompt actual:');
    console.log(gptAsistente.data.config.systemPrompt?.substring(0, 300) + '...\n');
    
    // Nuevo prompt optimizado que usa solo título, precio y URL
    const nuevoPrompt = `Eres un asistente de ventas profesional para una librería.

PRODUCTOS DISPONIBLES:
{{woocommerce.productos}}

INSTRUCCIONES:
1. Presenta los productos de manera clara y atractiva
2. Cada producto tiene: titulo, precio, url, stock
3. Muestra máximo 5 productos para no saturar al cliente
4. Incluye el precio en formato argentino (ej: $25.000)
5. Indica si hay stock disponible
6. Proporciona el link directo al catálogo (url)
7. Sé amable y profesional

FORMATO DE RESPUESTA:
📚 *[Título del libro]*
💰 Precio: $[precio]
📦 Stock: [Disponible/Sin stock]
🔗 Ver en catálogo: [url]

IMPORTANTE:
- NO inventes productos que no están en la lista
- Si no hay productos, informa que no se encontraron resultados
- Ofrece ayuda para buscar con otros términos`;

    console.log('📝 NUEVO PROMPT OPTIMIZADO:\n');
    console.log(nuevoPrompt);
    console.log('\n');
    
    console.log('✅ VENTAJAS DEL NUEVO PROMPT:');
    console.log('   1. Usa solo 4 campos por producto (titulo, precio, url, stock)');
    console.log('   2. Reduce tokens de ~9000 a ~500 tokens');
    console.log('   3. Configurable desde el frontend');
    console.log('   4. Formato claro y profesional\n');
    
    // Actualizar el prompt
    const result = await flowsCollection.updateOne(
      { 
        _id: new ObjectId(FLOW_ID),
        'nodes.id': 'gpt-asistente-ventas'
      },
      {
        $set: {
          'nodes.$.data.config.systemPrompt': nuevoPrompt
        }
      }
    );
    
    console.log(`✅ Nodo actualizado: ${result.modifiedCount} cambio(s)\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 CONFIGURACIÓN PARA EL FRONTEND\n');
    
    console.log('El nodo WooCommerce ahora soporta "productFieldMappings":');
    console.log('');
    console.log('OPCIÓN 1: Usar campos por defecto (título, precio, url, stock)');
    console.log('   No configurar productFieldMappings');
    console.log('');
    console.log('OPCIÓN 2: Configurar campos personalizados desde el frontend');
    console.log('   productFieldMappings: [');
    console.log('     { source: "name", target: "titulo" },');
    console.log('     { source: "price", target: "precio" },');
    console.log('     { source: "permalink", target: "url" },');
    console.log('     { source: "sku", target: "codigo" }');
    console.log('   ]');
    console.log('');
    console.log('CAMPOS DISPONIBLES DE WOOCOMMERCE:');
    console.log('   - name: Nombre del producto');
    console.log('   - price: Precio actual');
    console.log('   - regular_price: Precio regular');
    console.log('   - sale_price: Precio en oferta');
    console.log('   - permalink: URL del producto');
    console.log('   - stock_status: Estado del stock (instock/outofstock)');
    console.log('   - stock_quantity: Cantidad en stock');
    console.log('   - sku: Código SKU');
    console.log('   - image: URL de la imagen principal');
    console.log('   - categories: Categorías del producto');
    console.log('');
    console.log('IMPLEMENTACIÓN EN EL FRONTEND:');
    console.log('   1. Agregar un select múltiple en la configuración del nodo WooCommerce');
    console.log('   2. Permitir elegir qué campos incluir (name, price, permalink, etc.)');
    console.log('   3. Guardar en config.productFieldMappings');
    console.log('   4. El backend usará esos campos automáticamente');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configurarGPTAsistente();
