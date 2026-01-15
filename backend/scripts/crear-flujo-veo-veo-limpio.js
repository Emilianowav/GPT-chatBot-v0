import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearFlujoVeoVeoLimpio() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Eliminar flujo anterior si existe
    const oldFlowId = '695b5802cf46dd410a91f37c';
    await db.collection('flows').deleteOne({
      _id: new mongoose.Types.ObjectId(oldFlowId)
    });
    console.log('🗑️  Flujo anterior eliminado\n');

    // 2. Crear nuevo flujo limpio con solo WhatsApp Watch Events
    const flowData = {
      _id: new mongoose.Types.ObjectId(oldFlowId), // Mantener mismo ID
      nombre: 'Veo Veo - Consultar Libros',
      empresaId: new mongoose.Types.ObjectId('6940a9a181b92bfce970fdb5'),
      activo: true,
      descripcion: 'Flujo para consultar disponibilidad de libros en Veo Veo',
      nodes: [
        {
          id: 'whatsapp-watch-events',
          type: 'whatsapp',
          category: 'trigger',
          position: { x: 100, y: 300 },
          data: {
            label: 'WhatsApp Business Cloud',
            subtitle: 'Watch Events',
            executionCount: 1,
            hasConnection: false,
            config: {
              module: 'watch-events',
              webhookName: 'Veo Veo WhatsApp Events',
              webhookUrl: 'https://api.momentoia.co/webhook/whatsapp',
              connectionName: 'Veo Veo WhatsApp Connection',
              // Credenciales de WhatsApp Business Cloud
              phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
              businessAccountId: process.env.META_BUSINESS_ACCOUNT_ID || '',
              accessToken: process.env.META_ACCESS_TOKEN || '',
              verifyToken: process.env.META_VERIFY_TOKEN || 'veo-veo-webhook-token',
            },
          },
        },
      ],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('flows').insertOne(flowData);

    console.log('✅ Flujo Veo Veo creado exitosamente\n');
    console.log('📊 DETALLES:');
    console.log('   ID:', result.insertedId);
    console.log('   Nombre:', flowData.nombre);
    console.log('   Empresa:', flowData.empresaId);
    console.log('   Total nodos:', flowData.nodes.length);
    console.log('   Total edges:', flowData.edges.length);
    console.log('\n📋 NODO INICIAL:');
    console.log('   ID:', flowData.nodes[0].id);
    console.log('   Tipo:', flowData.nodes[0].type);
    console.log('   Label:', flowData.nodes[0].data.label);
    console.log('   Subtitle:', flowData.nodes[0].data.subtitle);
    console.log('   Webhook URL:', flowData.nodes[0].data.config.webhookUrl);
    console.log('   Verify Token:', flowData.nodes[0].data.config.verifyToken);
    console.log('\n💡 PRÓXIMO PASO:');
    console.log('   Recarga el frontend para ver el flujo limpio');
    console.log('   Click en el nodo para ver la configuración guardada');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

crearFlujoVeoVeoLimpio();
