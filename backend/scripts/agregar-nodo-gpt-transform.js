import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf39';

async function agregarNodoGPTTransform() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('📋 FLUJO PROPUESTO:\n');
    console.log('1. WhatsApp Watch Events (trigger)');
    console.log('   ↓');
    console.log('2. GPT Conversacional (recopila datos)');
    console.log('   - Pregunta al usuario qué producto busca');
    console.log('   - Output: conversación natural');
    console.log('   ↓');
    console.log('3. GPT Transform (formatea a JSON)');
    console.log('   - Input: conversación del nodo 2');
    console.log('   - Output: { producto, cantidad, categoria }');
    console.log('   ↓');
    console.log('4. WhatsApp Send Message');
    console.log('   - Muestra datos extraídos\n');

    // Actualizar flujo con nuevo nodo GPT Transform
    const resultado = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { 
        $set: {
          nodes: [
            // NODO 1: WhatsApp Watch Events (TRIGGER)
            {
              id: 'whatsapp-watch-events',
              type: 'whatsapp',
              category: 'trigger',
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
            
            // NODO 2: GPT Conversacional (RECOPILACIÓN)
            {
              id: 'gpt-conversacional',
              type: 'gpt',
              category: 'processor',
              position: { x: 400, y: 300 },
              data: {
                label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
                subtitle: 'Conversacional - Recopilación',
                executionCount: 2,
                hasConnection: true,
                config: {
                  tipo: 'conversacional',
                  module: 'conversacional',
                  modelo: 'gpt-4',
                  temperatura: 0.7,
                  maxTokens: 500,
                  systemPrompt: `Eres el asistente de Veo Veo, una librería.

Tu objetivo es ayudar al cliente a encontrar productos.

INSTRUCCIONES:
1. Pregunta qué tipo de producto busca (libro, cuaderno, útiles, etc.)
2. Si menciona un producto específico, pregunta detalles (autor, tema, cantidad)
3. Sé amable y conversacional
4. NO inventes información de productos

Responde de forma natural y amigable.`,
                  variablesEntrada: ['mensaje_usuario', 'telefono_usuario'],
                  variablesSalida: ['respuesta_gpt', 'conversacion_completa'],
                  outputFormat: 'text',
                },
              },
            },
            
            // NODO 3: GPT Transform (FORMATEO)
            {
              id: 'gpt-transform',
              type: 'gpt',
              category: 'processor',
              position: { x: 700, y: 300 },
              data: {
                label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
                subtitle: 'Transform - Formateo de Datos',
                executionCount: 3,
                hasConnection: true,
                config: {
                  tipo: 'transform',
                  module: 'transform',
                  modelo: 'gpt-4',
                  temperatura: 0.1,
                  maxTokens: 300,
                  systemPrompt: `Eres un extractor de datos. Analiza la conversación y extrae información estructurada.

REGLAS:
1. Extrae SOLO información mencionada explícitamente
2. Si no hay información, usa null
3. Responde ÚNICAMENTE con JSON válido
4. No agregues texto adicional

FORMATO DE SALIDA:
{
  "producto": "nombre del producto mencionado o null",
  "categoria": "libros | cuadernos | utiles | otro | null",
  "cantidad": número o null,
  "autor": "autor mencionado o null",
  "tema": "tema mencionado o null"
}`,
                  variablesEntrada: ['conversacion_completa'],
                  variablesSalida: ['datos_estructurados'],
                  outputFormat: 'json',
                },
              },
            },
            
            // NODO 4: WhatsApp Send Message
            {
              id: 'whatsapp-send-message',
              type: 'whatsapp',
              category: 'action',
              position: { x: 1000, y: 300 },
              data: {
                label: 'WhatsApp Business Cloud',
                subtitle: 'Send a Message',
                executionCount: 4,
                hasConnection: false,
                config: {
                  module: 'send-message',
                  phoneNumberId: '906667632531979',
                  to: '{{1.from}}',
                  message: '{{gpt-conversacional.respuesta_gpt}}',
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
              target: 'gpt-transform',
              type: 'simple',
              data: {
                mapping: {
                  'conversacion_completa': 'gpt-conversacional.respuesta_gpt',
                },
              },
            },
            {
              id: 'edge-3-4',
              source: 'gpt-transform',
              target: 'whatsapp-send-message',
              type: 'simple',
              data: {
                mapping: {
                  'to': '1.from',
                  'message': 'gpt-conversacional.respuesta_gpt',
                },
              },
            },
          ],
          
          updatedAt: new Date(),
        }
      }
    );

    console.log('✅ Flujo actualizado con nodo GPT Transform');
    console.log('   Documentos modificados:', resultado.modifiedCount);
    
    // Verificar
    const flujo = await db.collection('flows').findOne({ 
      _id: new mongoose.Types.ObjectId(FLOW_ID)
    });
    
    console.log('\n📊 FLUJO ACTUALIZADO:');
    console.log('   Nodos:', flujo.nodes.length);
    console.log('   Edges:', flujo.edges.length);
    
    console.log('\n📋 NODOS:');
    flujo.nodes.forEach((node, i) => {
      console.log(`   ${i + 1}. ${node.data.label} - ${node.data.subtitle}`);
      console.log(`      ID: ${node.id}`);
      console.log(`      Category: ${node.category}`);
      if (node.type === 'gpt') {
        console.log(`      Tipo GPT: ${node.data.config.tipo}`);
      }
    });

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Build y deploy del backend');
    console.log('   2. Enviar mensaje: "Busco un libro de JavaScript"');
    console.log('   3. Verificar que GPT Transform extrae los datos correctamente');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

agregarNodoGPTTransform();
