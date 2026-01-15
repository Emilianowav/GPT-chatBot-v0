import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const FLOW_ID = '695b5802cf46dd410a91f37c';

async function optimizarLabelsVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flow = await db.collection('flows').findOne({
      _id: new mongoose.Types.ObjectId(FLOW_ID)
    });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      await mongoose.disconnect();
      return;
    }

    console.log('📊 Optimizando labels del flujo Veo Veo\n');

    // Mapeo de nodos con labels y subtítulos limpios (estilo Make.com)
    const nodeUpdates = {
      'trigger-inicio': {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Watch Events',
      },
      'gpt-recopilacion': {
        label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
        subtitle: 'Recopilación de datos',
      },
      'gpt-formateador-busqueda': {
        label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
        subtitle: 'Formatear búsqueda',
      },
      'woocommerce-buscar': {
        label: 'WooCommerce',
        subtitle: 'Buscar productos',
      },
      'router-resultados': {
        label: 'Router',
        subtitle: '¿Productos encontrados?',
      },
      'gpt-procesar-resultados': {
        label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
        subtitle: 'Procesar resultados',
      },
      'whatsapp-sin-resultados': {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Sin resultados',
      },
      'whatsapp-mostrar-resultados': {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Mostrar productos',
      },
      'gpt-cantidad': {
        label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
        subtitle: 'Solicitar cantidad',
      },
      'router-continuar': {
        label: 'Router',
        subtitle: '¿Agregar más libros?',
      },
      'gpt-formateador-pago': {
        label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
        subtitle: 'Formatear pago',
      },
      'mercadopago-generar-link': {
        label: 'MercadoPago',
        subtitle: 'Generar link de pago',
      },
      'whatsapp-enviar-link': {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Enviar link de pago',
      },
      'webhook-pago': {
        label: 'Webhooks',
        subtitle: 'Escuchar confirmación de pago',
      },
      'whatsapp-confirmar-pago': {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Confirmar pago',
      },
      'fin-flujo': {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Fin del flujo',
      },
    };

    // Actualizar nodos
    const updatedNodes = flow.nodes.map(node => {
      const update = nodeUpdates[node.id];
      if (update) {
        console.log(`✏️  ${node.id}:`);
        console.log(`   Label: "${update.label}"`);
        console.log(`   Subtitle: "${update.subtitle}"`);
        return {
          ...node,
          data: {
            ...node.data,
            label: update.label,
            subtitle: update.subtitle,
          },
        };
      }
      return node;
    });

    // Actualizar en BD
    await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: updatedNodes } }
    );

    console.log('\n✅ Labels optimizados exitosamente');
    console.log('📝 Cambios aplicados:');
    console.log('   - Labels limpios sin emojis');
    console.log('   - Subtítulos descriptivos');
    console.log('   - Formato consistente estilo Make.com');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

optimizarLabelsVeoVeo();
