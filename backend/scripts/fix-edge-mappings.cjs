const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixEdgeMappings() {
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
    console.log('🔧 CORRIGIENDO EDGE MAPPINGS:\n');

    // 1. Edge: whatsapp-trigger → gpt-conversacional
    // Debe pasar el mensaje del usuario
    const edge1 = flow.edges.find(e => e.source === 'whatsapp-trigger' && e.target === 'gpt-conversacional');
    if (edge1) {
      edge1.data = edge1.data || {};
      edge1.data.mapping = {
        message: '1.message',
        mensaje_usuario: '1.message'
      };
      console.log('✅ 1. whatsapp-trigger → gpt-conversacional');
      console.log('   Mapping:', JSON.stringify(edge1.data.mapping, null, 2));
    }

    // 2. Edge: gpt-conversacional → whatsapp-respuesta-gpt
    // Debe pasar la respuesta del GPT y el número de teléfono
    const edge2 = flow.edges.find(e => e.source === 'gpt-conversacional' && e.target === 'whatsapp-respuesta-gpt');
    if (edge2) {
      edge2.data = edge2.data || {};
      edge2.data.mapping = {
        message: 'gpt-conversacional.respuesta_gpt',
        to: '1.from'
      };
      console.log('\n✅ 2. gpt-conversacional → whatsapp-respuesta-gpt');
      console.log('   Mapping:', JSON.stringify(edge2.data.mapping, null, 2));
    }

    // 3. Edge: whatsapp-respuesta-gpt → gpt-formateador
    // Debe pasar el mensaje original del usuario
    const edge3 = flow.edges.find(e => e.source === 'whatsapp-respuesta-gpt' && e.target === 'gpt-formateador');
    if (edge3) {
      edge3.data = edge3.data || {};
      edge3.data.mapping = {
        message: '1.message',
        mensaje_usuario: '1.message'
      };
      console.log('\n✅ 3. whatsapp-respuesta-gpt → gpt-formateador');
      console.log('   Mapping:', JSON.stringify(edge3.data.mapping, null, 2));
    }

    // 4. Edge: gpt-formateador → validador-datos
    // Debe pasar las variables extraídas
    const edge4 = flow.edges.find(e => e.source === 'gpt-formateador' && e.target === 'validador-datos');
    if (edge4) {
      edge4.data = edge4.data || {};
      edge4.data.mapping = {
        titulo_libro: 'gpt-formateador.titulo_libro',
        editorial: 'gpt-formateador.editorial',
        edicion: 'gpt-formateador.edicion'
      };
      console.log('\n✅ 4. gpt-formateador → validador-datos');
      console.log('   Mapping:', JSON.stringify(edge4.data.mapping, null, 2));
    }

    // 5. Edge: router-validacion → woocommerce-search
    // Debe pasar el título del libro para la búsqueda
    const edge6 = flow.edges.find(e => e.source === 'router-validacion' && e.target === 'woocommerce-search');
    if (edge6) {
      edge6.data = edge6.data || {};
      edge6.data.mapping = {
        search: 'gpt-formateador.titulo_libro'
      };
      console.log('\n✅ 6. router-validacion → woocommerce-search');
      console.log('   Mapping:', JSON.stringify(edge6.data.mapping, null, 2));
    }

    // 7. Edge: woocommerce-search → whatsapp-resultados
    // Debe pasar los resultados de WooCommerce y el número de teléfono
    const edge8 = flow.edges.find(e => e.source === 'woocommerce-search' && e.target === 'whatsapp-resultados');
    if (edge8) {
      edge8.data = edge8.data || {};
      edge8.data.mapping = {
        productos: 'woocommerce-search.productos',
        to: '1.from'
      };
      console.log('\n✅ 8. woocommerce-search → whatsapp-resultados');
      console.log('   Mapping:', JSON.stringify(edge8.data.mapping, null, 2));
    }

    // Guardar cambios
    await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { edges: flow.edges } }
    );

    console.log('\n\n✅ Edge mappings corregidos exitosamente');
    console.log('\n📋 AHORA:');
    console.log('- GPT conversacional recibirá el mensaje del usuario');
    console.log('- El historial guardará el mensaje real, no "{}"');
    console.log('- WooCommerce recibirá el título del libro');
    console.log('- WhatsApp enviará los resultados correctamente');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEdgeMappings();
