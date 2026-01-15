const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixWhatsAppResultados() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flow = await db.collection('flows').findOne({ 
      _id: new mongoose.Types.ObjectId(FLOW_ID) 
    });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo: ${flow.nombre}\n`);

    // Encontrar nodo whatsapp-resultados
    const whatsappNode = flow.nodes.find(n => n.id === 'whatsapp-resultados');
    
    if (!whatsappNode) {
      console.log('❌ Nodo whatsapp-resultados no encontrado');
      process.exit(1);
    }

    console.log('🔧 CONFIGURANDO NODO WHATSAPP-RESULTADOS:\n');
    console.log('Configuración actual:', JSON.stringify(whatsappNode.data.config, null, 2));

    // Actualizar configuración
    whatsappNode.data.config = {
      module: 'send-message',
      mensaje: `📚 Encontré {{woocommerce-search.productos.length || 0}} resultados para "{{titulo_libro}}":\n\n{{woocommerce-search.productos}}`,
      to: '{{1.from}}'
    };

    console.log('\n✅ Nueva configuración:', JSON.stringify(whatsappNode.data.config, null, 2));

    // Guardar cambios
    await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('\n✅ Nodo whatsapp-resultados actualizado exitosamente');
    console.log('\n📋 AHORA:');
    console.log('- El mensaje incluirá el número de productos encontrados');
    console.log('- Mostrará el título del libro buscado');
    console.log('- Enviará al número correcto del usuario');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWhatsAppResultados();
