import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf39';

async function crearFlujoConRouter() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('📋 FLUJO CON ROUTER:\n');
    console.log('1. WhatsApp Watch Events (trigger)');
    console.log('   ↓');
    console.log('2. GPT Conversacional (recopila datos)');
    console.log('   ↓');
    console.log('3. Router (¿Tiene suficiente info?)');
    console.log('   ├─ SÍ → GPT Transform → WhatsApp');
    console.log('   └─ NO → WhatsApp (pedir más datos)\n');

    // Actualizar flujo con Router
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

OBJETIVO: Recopilar información sobre qué producto busca el cliente.

INFORMACIÓN A RECOPILAR:
- Tipo de producto (libro, cuaderno, útiles, etc.)
- Detalles específicos (autor, tema, materia, etc.)
- Cantidad (si menciona)

REGLAS:
1. Pregunta de forma natural y amigable
2. Si el cliente ya dio suficiente información, confirma lo entendido
3. Si falta información, pregunta específicamente qué falta
4. NO inventes información de productos
5. Cuando tengas: tipo de producto + al menos 1 detalle específico, confirma con el cliente

INDICADOR DE INFORMACIÓN COMPLETA:
Cuando tengas suficiente información, incluye en tu respuesta la palabra clave: [INFO_COMPLETA]

Ejemplo:
Cliente: "Busco un libro de JavaScript"
Tú: "¡Perfecto! Entiendo que buscas un libro de JavaScript. ¿Es para nivel principiante o avanzado?"

Cliente: "Para principiantes"
Tú: "Excelente, un libro de JavaScript para principiantes. [INFO_COMPLETA] Déjame buscar las opciones disponibles..."`,
                  variablesEntrada: ['mensaje_usuario', 'telefono_usuario'],
                  variablesSalida: ['respuesta_gpt'],
                  outputFormat: 'text',
                },
              },
            },
            
            // NODO 3: Router (DECISIÓN)
            {
              id: 'router-decision',
              type: 'router',
              category: 'processor',
              position: { x: 700, y: 300 },
              data: {
                label: 'Router',
                subtitle: '¿Información Completa?',
                executionCount: 3,
                hasConnection: true,
                config: {
                  routes: [
                    {
                      id: 'info-completa',
                      label: 'Información Completa',
                      condition: {
                        field: 'gpt-conversacional.respuesta_gpt',
                        operator: 'contains',
                        value: '[INFO_COMPLETA]'
                      }
                    },
                    {
                      id: 'info-incompleta',
                      label: 'Falta Información',
                      condition: {
                        field: 'gpt-conversacional.respuesta_gpt',
                        operator: 'not_contains',
                        value: '[INFO_COMPLETA]'
                      }
                    }
                  ]
                },
              },
            },
            
            // NODO 4: GPT Transform (FORMATEO - Solo si info completa)
            {
              id: 'gpt-transform',
              type: 'gpt',
              category: 'processor',
              position: { x: 1000, y: 200 },
              data: {
                label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
                subtitle: 'Transform - Formateo',
                executionCount: 4,
                hasConnection: true,
                config: {
                  tipo: 'transform',
                  module: 'transform',
                  modelo: 'gpt-4',
                  temperatura: 0.1,
                  maxTokens: 300,
                  systemPrompt: `Extrae información estructurada de la conversación.

REGLAS:
1. Extrae SOLO información mencionada explícitamente
2. Si no hay información, usa null
3. Responde ÚNICAMENTE con JSON válido
4. No agregues texto adicional

FORMATO:
{
  "producto": "nombre del producto o null",
  "categoria": "libros | cuadernos | utiles | otro | null",
  "nivel": "principiante | intermedio | avanzado | null",
  "tema": "tema específico o null",
  "autor": "autor mencionado o null",
  "cantidad": número o 1
}`,
                  variablesEntrada: ['conversacion_completa'],
                  variablesSalida: ['datos_estructurados'],
                  outputFormat: 'json',
                },
              },
            },
            
            // NODO 5: WhatsApp Send (Ruta: Info Completa)
            {
              id: 'whatsapp-send-completa',
              type: 'whatsapp',
              category: 'action',
              position: { x: 1300, y: 200 },
              data: {
                label: 'WhatsApp Business Cloud',
                subtitle: 'Send - Info Completa',
                executionCount: 5,
                hasConnection: false,
                config: {
                  module: 'send-message',
                  phoneNumberId: '906667632531979',
                  to: '{{1.from}}',
                  message: '{{gpt-conversacional.respuesta_gpt}}',
                },
              },
            },
            
            // NODO 6: WhatsApp Send (Ruta: Info Incompleta)
            {
              id: 'whatsapp-send-incompleta',
              type: 'whatsapp',
              category: 'action',
              position: { x: 1000, y: 400 },
              data: {
                label: 'WhatsApp Business Cloud',
                subtitle: 'Send - Pedir Más Info',
                executionCount: 6,
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
            // Edge 1: Trigger → GPT Conversacional
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
            
            // Edge 2: GPT Conversacional → Router
            {
              id: 'edge-2-3',
              source: 'gpt-conversacional',
              target: 'router-decision',
              type: 'simple',
              data: {},
            },
            
            // Edge 3a: Router → GPT Transform (si info completa)
            {
              id: 'edge-3-4-completa',
              source: 'router-decision',
              target: 'gpt-transform',
              type: 'conditional',
              data: {
                routeId: 'info-completa',
                mapping: {
                  'conversacion_completa': 'gpt-conversacional.respuesta_gpt',
                },
              },
            },
            
            // Edge 4: GPT Transform → WhatsApp Send
            {
              id: 'edge-4-5',
              source: 'gpt-transform',
              target: 'whatsapp-send-completa',
              type: 'simple',
              data: {},
            },
            
            // Edge 3b: Router → WhatsApp Send (si info incompleta)
            {
              id: 'edge-3-6-incompleta',
              source: 'router-decision',
              target: 'whatsapp-send-incompleta',
              type: 'conditional',
              data: {
                routeId: 'info-incompleta',
              },
            },
          ],
          
          updatedAt: new Date(),
        }
      }
    );

    console.log('✅ Flujo actualizado con Router');
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
      console.log(`      Type: ${node.type}`);
      console.log(`      Category: ${node.category}`);
    });

    console.log('\n🔀 EDGES:');
    flujo.edges.forEach((edge, i) => {
      const sourceNode = flujo.nodes.find(n => n.id === edge.source);
      const targetNode = flujo.nodes.find(n => n.id === edge.target);
      console.log(`   ${i + 1}. ${sourceNode?.data.subtitle} → ${targetNode?.data.subtitle}`);
      if (edge.data?.routeId) {
        console.log(`      Ruta: ${edge.data.routeId}`);
      }
    });

    console.log('\n💡 CÓMO FUNCIONA:');
    console.log('   1. Usuario envía: "Busco un libro de JavaScript"');
    console.log('   2. GPT pregunta: "¿Nivel principiante o avanzado?"');
    console.log('   3. Usuario: "Principiante"');
    console.log('   4. GPT responde con [INFO_COMPLETA]');
    console.log('   5. Router detecta [INFO_COMPLETA] → Ruta "info-completa"');
    console.log('   6. GPT Transform extrae JSON');
    console.log('   7. WhatsApp envía respuesta');

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Build y deploy');
    console.log('   2. Testear con múltiples mensajes');
    console.log('   3. Verificar que Router funciona correctamente');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

crearFlujoConRouter();
