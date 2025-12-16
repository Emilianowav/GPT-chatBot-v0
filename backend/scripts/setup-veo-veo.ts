/**
 * Setup Veo Veo - Librería (Flujo Conversacional GPT)
 */
import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';
const EMPRESA_ID = 'Veo Veo';

async function setup() {
  await mongoose.connect(uri);
  console.log('DB:', mongoose.connection.db?.databaseName);
  
  // 1. Actualizar prompt de la empresa
  console.log('\n=== ACTUALIZANDO EMPRESA ===');
  const nuevoPrompt = `Sos el asistente virtual de Veo Veo, una librería. Tu objetivo es ayudar a los clientes de manera amable y profesional.

Tus funciones principales son:

1. INFORMACIÓN: Responder consultas sobre productos, precios, disponibilidad, horarios de atención y ubicación de la librería.

2. COMPRAS: Ayudar a los clientes a realizar pedidos. Preguntá qué productos necesitan, confirmá cantidades y tomá sus datos de contacto para coordinar el retiro o envío.

Cuando un cliente quiera comprar:
- Preguntá qué productos necesita
- Confirmá cantidades  
- Pedí nombre y teléfono de contacto
- Informá que el pedido será procesado y se contactarán para confirmar disponibilidad y forma de pago

Sé amable, conciso y útil. Si no tenés información sobre un producto específico, ofrecé contactar a la librería directamente.

Horarios de atención: Lunes a Viernes de 9:00 a 19:00, Sábados de 9:00 a 13:00.`;

  await mongoose.connection.collection('empresas').updateOne(
    { nombre: EMPRESA_ID },
    { 
      $set: { 
        prompt: nuevoPrompt,
        categoria: 'comercio',
        updatedAt: new Date()
      } 
    }
  );
  console.log('✅ Prompt actualizado');
  
  // 2. Asegurar que NO tenga bot de pasos activo (para usar GPT conversacional)
  console.log('\n=== VERIFICANDO BOT DE PASOS ===');
  const botExistente = await mongoose.connection.collection('configuracionbots').findOne({ empresaId: EMPRESA_ID });
  
  if (botExistente) {
    // Si existe, asegurar que esté INACTIVO
    await mongoose.connection.collection('configuracionbots').updateOne(
      { empresaId: EMPRESA_ID },
      { $set: { activo: false, updatedAt: new Date() } }
    );
    console.log('✅ Bot de pasos DESACTIVADO (usará GPT conversacional)');
  } else {
    console.log('✅ No tiene bot de pasos (usará GPT conversacional por defecto)');
  }
  
  // 3. Verificación final
  console.log('\n=== VERIFICACIÓN FINAL ===');
  const empresa = await mongoose.connection.collection('empresas').findOne({ nombre: EMPRESA_ID });
  console.log('Empresa:', empresa?.nombre);
  console.log('Categoría:', empresa?.categoria);
  console.log('Teléfono:', empresa?.telefono);
  console.log('Prompt (primeros 100 chars):', empresa?.prompt?.substring(0, 100) + '...');
  
  const bot = await mongoose.connection.collection('configuracionbots').findOne({ empresaId: EMPRESA_ID });
  console.log('Bot de pasos activo:', bot?.activo ?? 'NO EXISTE (usará GPT)');
  
  console.log('\n✅ CONFIGURACIÓN COMPLETADA');
  console.log('Veo Veo usará el flujo conversacional GPT para:');
  console.log('  - Consultas de información');
  console.log('  - Proceso de compra guiado');
  
  await mongoose.disconnect();
}

setup().catch(console.error);
