import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function actualizarFlujoVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Datos reales de Veo Veo
    const veoVeoData = {
      nombre: "Veo Veo",
      telefono: "+5493794057297",
      phoneNumberId: "906667632531979",
      webhookUrl: "https://api.momentoia.co/webhook/whatsapp",
      verifyToken: "2001-ic",
      mensajeBienvenida: `Hola 👋
¡Bienvenido/a a Librería Veo Veo! 📚✏️
Estamos para ayudarte.

👉 Por favor, selecciona un ítem de consulta:

1️⃣ Libros escolares u otros títulos
2️⃣ Libros de Inglés
3️⃣ Soporte de ventas
4️⃣ Información del local
5️⃣ Promociones vigentes
6️⃣ Consultas personalizadas

Escribí el número`,
    };

    const flowId = '695b5802cf46dd410a91f37c';

    // Actualizar nodo WhatsApp Watch Events con datos reales
    const result = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(flowId) },
      {
        $set: {
          'nodes.0.data.config': {
            module: 'watch-events',
            webhookName: 'Veo Veo WhatsApp Events',
            webhookUrl: veoVeoData.webhookUrl,
            connectionName: 'Veo Veo WhatsApp Connection',
            verifyToken: veoVeoData.verifyToken,
            phoneNumberId: veoVeoData.phoneNumberId,
            businessAccountId: process.env.META_BUSINESS_ACCOUNT_ID || '',
            accessToken: process.env.META_ACCESS_TOKEN || '',
            // Datos adicionales de la empresa
            empresaNombre: veoVeoData.nombre,
            empresaTelefono: veoVeoData.telefono,
            mensajeBienvenida: veoVeoData.mensajeBienvenida,
          },
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Flujo actualizado exitosamente\n');
      console.log('📊 CONFIGURACIÓN ACTUALIZADA:');
      console.log('   Empresa:', veoVeoData.nombre);
      console.log('   Teléfono:', veoVeoData.telefono);
      console.log('   Phone Number ID:', veoVeoData.phoneNumberId);
      console.log('   Webhook URL:', veoVeoData.webhookUrl);
      console.log('   Verify Token:', veoVeoData.verifyToken);
      console.log('\n📱 MENSAJE DE BIENVENIDA:');
      console.log(veoVeoData.mensajeBienvenida);
      console.log('\n💡 PRÓXIMO PASO:');
      console.log('   Recarga el frontend para ver la configuración actualizada');
    } else {
      console.log('⚠️  No se encontró el flujo o no hubo cambios');
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

actualizarFlujoVeoVeo();
