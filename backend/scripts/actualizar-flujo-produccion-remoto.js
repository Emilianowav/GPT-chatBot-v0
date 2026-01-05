import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// USAR MONGODB_URI DE PRODUCCIÓN (debe estar en .env)
const MONGODB_URI_PRODUCCION = process.env.MONGODB_URI;

if (!MONGODB_URI_PRODUCCION) {
  console.error('❌ ERROR: MONGODB_URI no está definida en las variables de entorno');
  console.log('💡 Asegúrate de tener un archivo .env con MONGODB_URI configurada');
  process.exit(1);
}

async function actualizarFlujoProduccion() {
  try {
    console.log('🔗 Conectando a MongoDB de PRODUCCIÓN...\n');
    await mongoose.connect(MONGODB_URI_PRODUCCION);
    console.log('✅ Conectado a MongoDB de producción\n');

    const db = mongoose.connection.db;
    
    // Buscar el flujo actual de Veo Veo por empresaId
    const flujoActual = await db.collection('flows').findOne({ 
      empresaId: new mongoose.Types.ObjectId('6940a9a181b92bfce970fdb5'),
      activo: true 
    });

    if (!flujoActual) {
      console.log('❌ No se encontró flujo activo para Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('📊 Flujo actual encontrado:');
    console.log('   ID:', flujoActual._id);
    console.log('   Nombre:', flujoActual.nombre);
    console.log('   Nodos:', flujoActual.nodes?.length || 0);
    console.log('   Edges:', flujoActual.edges?.length || 0);
    
    if (flujoActual.nodes) {
      console.log('\n📋 Nodos actuales:');
      flujoActual.nodes.forEach((node, i) => {
        console.log(`   ${i + 1}. ${node.data?.label || 'Sin label'} - category: ${node.category || 'SIN CATEGORY'}`);
      });
    }

    // Actualizar el flujo con la estructura correcta
    const flujoActualizado = {
      nombre: 'Veo Veo - Consultar Libros',
      empresaId: new mongoose.Types.ObjectId('6940a9a181b92bfce970fdb5'),
      activo: true,
      descripcion: 'Flujo visual: recibe mensaje, procesa con GPT y responde',
      
      nodes: [
        // NODO 1: WhatsApp Watch Events (Trigger) - IMPORTANTE: category: 'trigger'
        {
          id: 'whatsapp-watch-events',
          type: 'whatsapp',
          category: 'trigger', // ← ESTO ES CRÍTICO
          position: { x: 100, y: 300 },
          data: {
            label: 'WhatsApp Business Cloud',
            subtitle: 'Watch Events',
            executionCount: 1,
            hasConnection: true,
            config: {
              module: 'watch-events',
              webhookName: 'Veo Veo WhatsApp Events',
              webhookUrl: 'https://api.momentoia.co/webhook/whatsapp',
              connectionName: 'Veo Veo WhatsApp Connection',
              verifyToken: '2001-ic',
              phoneNumberId: '906667632531979',
              empresaNombre: 'Veo Veo',
              empresaTelefono: '+5493794057297',
            },
          },
        },
        
        // NODO 2: GPT Conversacional
        {
          id: 'gpt-conversacional',
          type: 'gpt',
          category: 'processor',
          position: { x: 400, y: 300 },
          data: {
            label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
            subtitle: 'Conversacional',
            executionCount: 2,
            hasConnection: true,
            config: {
              tipo: 'conversacional',
              module: 'conversacional',
              modelo: 'gpt-4',
              temperatura: 0.7,
              maxTokens: 500,
              systemPrompt: `Eres el asistente virtual de Veo Veo, una librería. Tu objetivo es ayudar al cliente respondiendo sus preguntas y recopilando información necesaria.

Tus funciones principales son:

1. INFORMACIÓN: Responder consultas sobre productos, precios, disponibilidad, horarios de atención y ubicación de la librería.

2. COMPRAS: Ayudar a los clientes a realizar pedidos. Preguntá qué productos necesitan, confirmá cantidades y tomá sus datos de contacto para coordinar el retiro o envío.

Cuando un cliente quiera comprar:
- Preguntá qué productos necesita
- Confirmá cantidades  
- Pedí nombre y teléfono de contacto
- Informá que el pedido será procesado y se contactarán para confirmar disponibilidad y forma de pago

Sé amable, conciso y útil. Si no tenés información sobre un producto específico, ofrecé contactar a la librería directamente.

Horarios de atención: Lunes a Viernes de 9:00 a 19:00, Sábados de 9:00 a 13:00.`,
              variablesEntrada: ['mensaje_usuario', 'telefono_usuario'],
              variablesSalida: ['respuesta_gpt', 'nombre_cliente', 'productos', 'cantidad'],
              outputFormat: 'text',
            },
          },
        },
        
        // NODO 3: WhatsApp Send Message
        {
          id: 'whatsapp-send-message',
          type: 'whatsapp',
          category: 'action',
          position: { x: 700, y: 300 },
          data: {
            label: 'WhatsApp Business Cloud',
            subtitle: 'Send a Message',
            executionCount: 3,
            hasConnection: false,
            config: {
              module: 'send-message',
              phoneNumberId: '906667632531979',
              to: '{{1.from}}',
              message: '{{2.respuesta_gpt}}',
            },
          },
        },
      ],
      
      edges: [
        {
          id: 'edge-1-2',
          source: 'whatsapp-watch-events',
          target: 'gpt-conversacional',
          type: 'simple',
          sourceHandle: null,
          targetHandle: null,
          data: {
            mapping: {
              'mensaje_usuario': '1.message',
              'telefono_usuario': '1.from',
            },
          },
        },
        {
          id: 'edge-2-3',
          source: 'gpt-conversacional',
          target: 'whatsapp-send-message',
          type: 'simple',
          sourceHandle: null,
          targetHandle: null,
          data: {
            mapping: {
              'to': '1.from',
              'message': '2.respuesta_gpt',
            },
          },
        },
      ],
      
      updatedAt: new Date(),
    };

    // Actualizar flujo
    const resultado = await db.collection('flows').updateOne(
      { _id: flujoActual._id },
      { $set: flujoActualizado }
    );

    console.log('\n✅ FLUJO ACTUALIZADO EN PRODUCCIÓN\n');
    console.log('📊 Resultado:', resultado.modifiedCount, 'documento(s) modificado(s)');
    console.log('\n📊 NUEVA ESTRUCTURA:');
    console.log('   Nodos:', flujoActualizado.nodes.length);
    console.log('   Edges:', flujoActualizado.edges.length);
    console.log('\n📋 NODOS:');
    flujoActualizado.nodes.forEach((node, i) => {
      console.log(`   ${i + 1}. ${node.data.label} - ${node.data.subtitle}`);
      console.log(`      category: ${node.category} ${node.category === 'trigger' ? '← TRIGGER' : ''}`);
    });
    console.log('\n🔗 FLUJO:');
    console.log('   WhatsApp Watch Events (trigger)');
    console.log('   ↓');
    console.log('   GPT Conversacional (processor)');
    console.log('   ↓');
    console.log('   WhatsApp Send Message (action)');
    console.log('\n💡 PRÓXIMO PASO:');
    console.log('   Envía un mensaje de WhatsApp a +5493794057297');
    console.log('   El flujo visual debería ejecutarse correctamente');
    console.log('   Verifica los logs en Render para confirmar');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

actualizarFlujoProduccion();
