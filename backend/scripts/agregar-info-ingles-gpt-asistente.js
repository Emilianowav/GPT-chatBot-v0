import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function agregarInfoIngles() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    const gptAsistenteNode = flow.nodes.find(n => n.id === 'gpt-asistente-ventas');
    
    if (!gptAsistenteNode) {
      console.log('❌ Nodo gpt-asistente-ventas no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📝 Actualizando systemPrompt de gpt-asistente-ventas...\n');
    
    const promptActual = gptAsistenteNode.data.config.systemPrompt;
    
    // Agregar información sobre libros de inglés
    const infoIngles = `

📚 INFORMACIÓN IMPORTANTE SOBRE LIBROS DE INGLÉS:

Los libros de inglés escolares NO están en el catálogo de WooCommerce.
Si el usuario busca libros de inglés (english books, libros escolares de inglés, etc.):

1. Explicar que se hacen pedidos a pedido con seña
2. Proporcionar el link de contacto directo: https://wa.me/5493794732177?text=Hola,%20estoy%20interesado%20en%20libros%20de%20inglés%20a%20pedido
3. Ser amigable y explicar que un asesor lo ayudará con el pedido especial

EJEMPLO DE RESPUESTA:
"¡Claro! Los libros de inglés escolares los trabajamos a pedido con seña. Te recomiendo contactarte directamente con un asesor de ventas que te ayudará con tu pedido especial de libros de inglés: [Link de WhatsApp]. ¡Estarán encantados de ayudarte! 📚🇬🇧"

NO DIGAS "No encontré resultados" si buscan libros de inglés. En su lugar, ofrece la opción de pedido especial.
`;

    const nuevoPrompt = promptActual + infoIngles;
    
    gptAsistenteNode.data.config.systemPrompt = nuevoPrompt;
    
    await flowsCollection.updateOne(
      { _id: flow._id },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ SystemPrompt actualizado correctamente');
    console.log('\n📋 Información agregada:');
    console.log(infoIngles);
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

agregarInfoIngles();
