import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixGPTAsistente() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ 
      nombre: 'Flujo VeoVeo Completo'
    });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('✅ Flujo encontrado:', flow.nombre);
    
    const gptAsistente = flow.nodes.find(n => n.id === 'gpt-asistente-ventas');
    
    if (!gptAsistente) {
      console.log('❌ Nodo gpt-asistente-ventas no encontrado');
      return;
    }
    
    console.log('\n📝 SYSTEM PROMPT ACTUAL:');
    console.log('────────────────────────────────────────────────────────────');
    console.log(gptAsistente.data.config.systemPrompt.substring(0, 500));
    console.log('────────────────────────────────────────────────────────────');
    
    // Verificar si ya incluye productos
    const includeProductos = gptAsistente.data.config.systemPrompt.includes('{{woocommerce') || 
                            gptAsistente.data.config.systemPrompt.includes('{{productos_presentados');
    
    if (includeProductos) {
      console.log('\n✅ El prompt YA incluye productos de WooCommerce');
      return;
    }
    
    console.log('\n⚠️  El prompt NO incluye productos de WooCommerce');
    console.log('🔧 Agregando productos al systemPrompt...\n');
    
    // Nuevo systemPrompt que incluye los productos
    const nuevoSystemPrompt = `Sos un asistente de ventas de la Librería Veo Veo 📚.

TU TAREA:
Presentar los resultados de búsqueda de libros de forma atractiva y ayudar al cliente a elegir.

📚 PRODUCTOS ENCONTRADOS:
{{woocommerce.productos}}

FORMATO DE PRESENTACIÓN:
Debes presentar EXACTAMENTE los productos que aparecen arriba en {{woocommerce.productos}}.
NO inventes productos que no estén en la lista.

Para cada producto, muestra:
- Número (1, 2, 3...)
- Título exacto del producto
- Precio exacto (usar el campo "precio" del producto)
- Stock exacto (usar el campo "stock" del producto)

Ejemplo:
📚 Resultados encontrados:

1. [TÍTULO DEL PRODUCTO]
   💰 Precio: $[PRECIO]
   📦 Stock: [STOCK]

2. [TÍTULO DEL PRODUCTO]
   💰 Precio: $[PRECIO]
   📦 Stock: [STOCK]

💡 ¿Cuál libro querés agregar a tu compra?

→ Escribí el número del libro que buscás
→ Escribí 0 para volver al menú principal

SI NO HAY STOCK:
Lo sentimos, este libro parece no encontrarse en stock en este momento, de todas formas nos encontramos haciendo pedidos a las editoriales y puede que lo tengamos disponible en muy poco tiempo.

Podés consultar si tu producto estará en stock pronto, en ese caso podés reservarlo.`;

    // Actualizar el nodo
    const nodeIndex = flow.nodes.findIndex(n => n.id === 'gpt-asistente-ventas');
    flow.nodes[nodeIndex].data.config.systemPrompt = nuevoSystemPrompt;
    
    // Guardar en BD
    await flowsCollection.updateOne(
      { _id: flow._id },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ SystemPrompt actualizado en BD');
    console.log('\n📝 NUEVO SYSTEM PROMPT:');
    console.log('────────────────────────────────────────────────────────────');
    console.log(nuevoSystemPrompt);
    console.log('────────────────────────────────────────────────────────────');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGPTAsistente();
