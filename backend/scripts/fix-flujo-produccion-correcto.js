import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI no está definida');
  process.exit(1);
}

async function fixFlujoProduccion() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB de producción\n');

    const db = mongoose.connection.db;
    
    // Actualizar el flujo CORRECTO por su ID exacto
    const flowId = '695a156681f6d67f0ae9cf39';
    
    console.log(`🔍 Buscando flujo con ID: ${flowId}\n`);
    
    const flujoActual = await db.collection('flows').findOne({ 
      _id: new mongoose.Types.ObjectId(flowId)
    });

    if (!flujoActual) {
      console.log('❌ No se encontró el flujo');
      await mongoose.disconnect();
      return;
    }

    console.log('📊 Flujo encontrado:');
    console.log('   Nombre:', flujoActual.nombre);
    console.log('   Nodos:', flujoActual.nodes?.length || 0);
    console.log('   Edges:', flujoActual.edges?.length || 0);
    
    if (flujoActual.nodes) {
      console.log('\n📋 Nodos actuales:');
      flujoActual.nodes.forEach((node, i) => {
        console.log(`   ${i + 1}. ${node.data?.label || 'Sin label'} - category: ${node.category || 'SIN CATEGORY'}`);
      });
    }

    // ACTUALIZAR con estructura correcta
    const resultado = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(flowId) },
      { 
        $set: {
          nodes: [
            // NODO 1: WhatsApp Watch Events (TRIGGER)
            {
              id: 'whatsapp-watch-events',
              type: 'whatsapp',
              category: 'trigger', // ← CRÍTICO
              position: { x: 100, y: 300 },
              data: {
                label: 'WhatsApp Business Cloud',
                subtitle: 'Watch Events',
                executionCount: 1,
                hasConnection: true,
                config: {
                  module: 'watch-events',
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
                  systemPrompt: `Eres el asistente virtual de Veo Veo, una librería. Ayuda al cliente respondiendo sus preguntas sobre productos, precios, disponibilidad y horarios.

Sé amable, conciso y útil.

Horarios: Lunes a Viernes 9:00-19:00, Sábados 9:00-13:00.`,
                  variablesEntrada: ['mensaje_usuario', 'telefono_usuario'],
                  variablesSalida: ['respuesta_gpt'],
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
              data: {
                mapping: {
                  'to': '1.from',
                  'message': '2.respuesta_gpt',
                },
              },
            },
          ],
          
          updatedAt: new Date(),
        }
      }
    );

    console.log('\n✅ FLUJO ACTUALIZADO');
    console.log('📊 Documentos modificados:', resultado.modifiedCount);
    console.log('\n📋 NUEVA ESTRUCTURA:');
    console.log('   1. WhatsApp Watch Events (category: trigger) ← TRIGGER');
    console.log('   2. GPT Conversacional (category: processor)');
    console.log('   3. WhatsApp Send Message (category: action)');
    console.log('\n💡 Envía un mensaje de WhatsApp para testear');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixFlujoProduccion();
