import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function actualizarGPTAsistente() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flowId = new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }
    
    const nodeIndex = flow.nodes?.findIndex(n => n.id === 'gpt-asistente-ventas');
    
    if (nodeIndex === -1) {
      console.log('❌ Nodo gpt-asistente-ventas no encontrado');
      process.exit(1);
    }
    
    const node = flow.nodes[nodeIndex];
    
    console.log('\n🔧 Actualizando systemPrompt de gpt-asistente-ventas...');
    
    // Agregar restricción estricta de NO INVENTAR
    const restriccionNoInventar = `

⚠️ RESTRICCIÓN CRÍTICA - NO INVENTAR INFORMACIÓN:
- NUNCA inventes productos, precios, stock o información que no esté en los datos recibidos
- Si no hay productos en la búsqueda (productos_completos está vacío), di que no encontraste resultados
- Si no tienes información sobre stock, NO digas "Stock: X unidades"
- Si no tienes información sobre precio, NO inventes precios
- SOLO muestra información que venga explícitamente en los datos de WooCommerce
- Si el usuario pregunta algo que no sabes, admítelo honestamente

EJEMPLO CORRECTO cuando NO hay productos:
"No encontré resultados para tu búsqueda 😔. ¿Podrías darme más detalles sobre el libro que buscás? Por ejemplo, el título completo, autor o editorial."

EJEMPLO INCORRECTO (NUNCA HACER ESTO):
"Perfecto 😊, estos son los resultados:
1. El Principito - $500 - Stock: 5 unidades"  ← ❌ ESTO ES INVENTAR`;

    // Actualizar systemPrompt
    if (node.data.config.systemPrompt) {
      node.data.config.systemPrompt = node.data.config.systemPrompt + restriccionNoInventar;
    }
    
    console.log('✅ Restricción NO INVENTAR agregada al systemPrompt');
    
    // Guardar cambios
    flow.nodes[nodeIndex] = node;
    
    await flowsCollection.updateOne(
      { _id: flowId },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Cambios guardados en BD');
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarGPTAsistente();
