import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixGPTPrompt() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar flujo de Veo Veo por empresaId
    const empresaId = new ObjectId('6940a9a181b92bfce970fdb5');
    const flow = await flowsCollection.findOne({ empresaId });
    
    if (!flow) {
      console.log('❌ Flujo de Veo Veo no encontrado');
      console.log('Buscando todos los flujos...');
      const allFlows = await flowsCollection.find({}).toArray();
      console.log(`Total flujos: ${allFlows.length}`);
      allFlows.forEach(f => {
        console.log(`- ${f.nombre} (${f._id})`);
      });
      return;
    }
    
    console.log('✅ Flujo encontrado:', flow.nombre || flow._id);
    console.log('📋 Nodos:', flow.nodes?.length || 0);
    
    // Buscar nodo gpt-asistente-ventas
    const nodeIndex = flow.nodes?.findIndex(n => n.id === 'gpt-asistente-ventas');
    
    if (nodeIndex === -1 || nodeIndex === undefined) {
      console.log('❌ Nodo gpt-asistente-ventas no encontrado');
      console.log('Nodos disponibles:');
      flow.nodes?.forEach(n => console.log(`- ${n.id} (${n.type})`));
      return;
    }
    
    const gptNode = flow.nodes[nodeIndex];
    console.log('\n📝 Nodo encontrado:', gptNode.id);
    console.log('Tipo:', gptNode.type);
    
    const currentPrompt = gptNode.data?.config?.systemPrompt || '';
    console.log('\n📋 SYSTEM PROMPT ACTUAL:');
    console.log('────────────────────────────────────────────────────────────');
    console.log(currentPrompt.substring(0, 300) + '...');
    console.log('────────────────────────────────────────────────────────────');
    
    // Verificar si ya incluye productos
    if (currentPrompt.includes('{{woocommerce.productos}}') || currentPrompt.includes('{{productos_presentados}}')) {
      console.log('\n✅ El prompt YA incluye productos de WooCommerce');
      return;
    }
    
    console.log('\n⚠️  PROBLEMA: El prompt NO incluye productos de WooCommerce');
    console.log('🔧 Actualizando systemPrompt...\n');
    
    // Nuevo systemPrompt que incluye los productos
    const nuevoPrompt = `Sos un asistente de ventas de la Librería Veo Veo 📚.

TU TAREA:
Presentar los resultados de búsqueda de libros de forma atractiva y ayudar al cliente a elegir.

📚 PRODUCTOS ENCONTRADOS EN WOOCOMMERCE:
{{woocommerce.productos}}

IMPORTANTE:
- Debes presentar EXACTAMENTE los productos que aparecen arriba en {{woocommerce.productos}}
- NO inventes productos que no estén en la lista
- Usa los datos REALES: título, precio y stock de cada producto

FORMATO DE PRESENTACIÓN:
Perfecto😊, estos son los resultados que coinciden con tu búsqueda:

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
    flow.nodes[nodeIndex].data.config.systemPrompt = nuevoPrompt;
    
    // Guardar en BD
    await flowsCollection.updateOne(
      { _id: flow._id },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ SystemPrompt actualizado en BD');
    console.log('\n📝 NUEVO SYSTEM PROMPT:');
    console.log('────────────────────────────────────────────────────────────');
    console.log(nuevoPrompt);
    console.log('────────────────────────────────────────────────────────────');
    
    console.log('\n✅ SOLUCIÓN APLICADA:');
    console.log('Ahora GPT recibirá los productos reales de WooCommerce en su prompt');
    console.log('y dejará de inventar productos ficticios.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGPTPrompt();
