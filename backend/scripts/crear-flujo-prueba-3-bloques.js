import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf39'; // Veo Veo

/**
 * FLUJO DE PRUEBA - SISTEMA DE 3 BLOQUES
 * 
 * Objetivo: Testear el sistema de GPT Conversacional con:
 * - Personalidad definida
 * - Tópicos estáticos (horarios, libros de inglés)
 * - Variables a recopilar (titulo, editorial)
 * - Acciones al completar
 */

async function crearFlujoPrueba3Bloques() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🧪 CREANDO FLUJO DE PRUEBA - SISTEMA 3 BLOQUES\n');

    // NODOS DEL FLUJO
    const nodes = [
      // [1] TRIGGER - WhatsApp Watch Events
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
            verifyToken: '2001-ic'
          }
        }
      },

      // [2] GPT Conversacional - CON SISTEMA DE 3 BLOQUES
      {
        id: 'gpt-conversacional-3-bloques',
        type: 'gpt',
        category: 'processor',
        position: { x: 400, y: 300 },
        data: {
          label: 'OpenAI (ChatGPT)',
          subtitle: 'Conversacional - 3 Bloques',
          executionCount: 2,
          hasConnection: true,
          config: {
            tipo: 'conversacional',
            module: 'conversacional',
            modelo: 'gpt-4',
            temperatura: 0.7,
            maxTokens: 500,
            
            // ============================================
            // BLOQUE 1: PERSONALIDAD
            // ============================================
            personalidad: `Eres el asistente virtual de **Librería Veo Veo** 📚✏️

Características de tu personalidad:
- Tono amigable, profesional y entusiasta
- Usas emojis para hacer la conversación más cálida
- Eres paciente y comprensivo con errores de ortografía
- Siempre saludas con energía positiva`,

            // ============================================
            // BLOQUE 2: TÓPICOS (Información Estática)
            // ============================================
            topicos: [
              {
                id: 'horarios',
                titulo: 'Horarios del Local',
                contenido: `📍 **Ubicación:** San Juan 1037 - Corrientes Capital

🕗 **Horarios:**
- Lunes a Viernes: 8:30-12:00 y 17:00-21:00
- Sábados: 9:00-13:00 y 17:00-21:00
- Domingos: Cerrado

📞 **Contacto:** +5493794732177`,
                keywords: ['horario', 'abierto', 'cerrado', 'cuando', 'donde', 'ubicacion', 'direccion']
              },
              {
                id: 'libros-ingles',
                titulo: 'Libros de Inglés',
                contenido: `Los libros de inglés se realizan **únicamente a pedido con seña**.

Para realizar tu pedido, comunicate con un asesor:
👉 https://wa.me/5493794732177?text=Hola,%20quiero%20pedir%20un%20libro%20de%20inglés

⏰ Tiempo de entrega: 7-15 días hábiles`,
                keywords: ['ingles', 'english', 'idioma', 'pedido', 'seña']
              },
              {
                id: 'promociones',
                titulo: 'Promociones Bancarias',
                contenido: `🏦 **Promociones vigentes:**

**Banco de Corrientes:**
- Lunes y Miércoles: 3 cuotas sin interés + 20% bonificación
- Jueves: 30% off + 6 cuotas sin interés (Tarjeta Bonita Visa)

**Banco Nación:**
- Sábados: 10% reintegro + 3 cuotas sin interés (MODO BNA+)

**Banco Hipotecario:**
- Todos los días: 6 cuotas fijas
- Miércoles: 25% off con débito

⚠️ Las promociones son sobre precio de lista`,
                keywords: ['promo', 'promocion', 'descuento', 'cuotas', 'banco', 'tarjeta', 'oferta']
              }
            ],

            // ============================================
            // BLOQUE 3: VARIABLES A RECOPILAR
            // ============================================
            variablesRecopilar: [
              {
                nombre: 'titulo',
                descripcion: 'Título del libro que busca el cliente',
                obligatorio: true,
                tipo: 'texto',
                ejemplos: ['Harry Potter', 'Matemática 3', 'Don Quijote']
              },
              {
                nombre: 'editorial',
                descripcion: 'Editorial del libro (opcional)',
                obligatorio: false,
                tipo: 'texto',
                ejemplos: ['Santillana', 'Salamandra', 'Estrada']
              },
              {
                nombre: 'edicion',
                descripcion: 'Edición o año del libro (opcional)',
                obligatorio: false,
                tipo: 'texto',
                ejemplos: ['2023', 'última edición', 'nueva edición']
              }
            ],

            // ============================================
            // BLOQUE 4: ACCIONES AL COMPLETAR
            // ============================================
            accionesCompletado: [
              {
                tipo: 'mensaje',
                contenido: 'Perfecto 😊 Voy a buscar: {{titulo}} - {{editorial || "cualquier editorial"}} - {{edicion || "última edición"}}'
              },
              {
                tipo: 'marcar_completado',
                token: '[INFO_COMPLETA]'
              }
            ],

            // Legacy (para compatibilidad)
            variablesEntrada: ['mensaje_usuario'],
            variablesSalida: ['respuesta_gpt'],
            globalVariablesOutput: ['titulo', 'editorial', 'edicion'],
            outputFormat: 'text'
          }
        }
      },

      // [3] Router - ¿Info Completa?
      {
        id: 'router-info-completa',
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
                  field: 'gpt-conversacional-3-bloques.respuesta_gpt',
                  operator: 'contains',
                  value: '[INFO_COMPLETA]'
                }
              },
              {
                id: 'info-incompleta',
                label: 'Falta Información',
                condition: {
                  field: 'gpt-conversacional-3-bloques.respuesta_gpt',
                  operator: 'not_contains',
                  value: '[INFO_COMPLETA]'
                }
              }
            ]
          }
        }
      },

      // [4] WhatsApp Send - Respuesta (Info Completa)
      {
        id: 'whatsapp-send-completo',
        type: 'whatsapp',
        category: 'action',
        position: { x: 1000, y: 200 },
        data: {
          label: 'WhatsApp Send',
          subtitle: 'Enviar Respuesta',
          executionCount: 4,
          hasConnection: true,
          config: {
            module: 'send-message',
            // phoneNumberId se usa automáticamente del Watch Events
            to: '{{1.from}}',
            message: '{{gpt-conversacional-3-bloques.respuesta_gpt}}'
          }
        }
      },

      // [5] WhatsApp Send - Pedir Más Info (Info Incompleta)
      {
        id: 'whatsapp-send-incompleto',
        type: 'whatsapp',
        category: 'action',
        position: { x: 1000, y: 400 },
        data: {
          label: 'WhatsApp Send',
          subtitle: 'Pedir Más Información',
          executionCount: 5,
          hasConnection: true,
          config: {
            module: 'send-message',
            // phoneNumberId se usa automáticamente del Watch Events
            to: '{{1.from}}',
            message: '{{gpt-conversacional-3-bloques.respuesta_gpt}}'
          }
        }
      },

      // [6] WhatsApp Send - Confirmación Final
      {
        id: 'whatsapp-send-final',
        type: 'whatsapp',
        category: 'action',
        position: { x: 1300, y: 200 },
        data: {
          label: 'WhatsApp Send',
          subtitle: 'Confirmación con Variables Globales',
          executionCount: 6,
          hasConnection: true,
          config: {
            module: 'send-message',
            // phoneNumberId se usa automáticamente del Watch Events
            to: '{{1.from}}',
            message: `✅ Variables guardadas correctamente:

📘 Título: {{global.titulo}}
📚 Editorial: {{global.editorial || "cualquier editorial"}}
📅 Edición: {{global.edicion || "última edición"}}

🔍 Próximo paso: Buscar en WooCommerce...`
          }
        }
      }
    ];

    // EDGES (CONEXIONES)
    const edges = [
      {
        id: 'e1-2',
        source: 'whatsapp-watch-events',
        target: 'gpt-conversacional-3-bloques',
        type: 'default',
        data: { mapping: { mensaje_usuario: '1.message' } }
      },
      {
        id: 'e2-3',
        source: 'gpt-conversacional-3-bloques',
        target: 'router-info-completa',
        type: 'default'
      },
      {
        id: 'e3-4',
        source: 'router-info-completa',
        target: 'whatsapp-send-completo',
        type: 'default',
        data: { routeId: 'info-completa' }
      },
      {
        id: 'e4-6',
        source: 'whatsapp-send-completo',
        target: 'whatsapp-send-final',
        type: 'default'
      },
      {
        id: 'e3-5',
        source: 'router-info-completa',
        target: 'whatsapp-send-incompleto',
        type: 'default',
        data: { routeId: 'info-incompleta' }
      }
    ];

    // ACTUALIZAR FLUJO EN BD
    const resultado = await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      {
        $set: {
          nombre: 'Veo Veo - Test 3 Bloques',
          nodes: nodes,
          edges: edges,
          botType: 'visual',
          activo: true,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Flujo de prueba creado');
    console.log(`   Documentos modificados: ${resultado.modifiedCount}`);
    console.log(`   Nodos: ${nodes.length}`);
    console.log(`   Edges: ${edges.length}\n`);

    console.log('📊 CONFIGURACIÓN DEL GPT:');
    console.log('   ✅ Personalidad: Asistente de Veo Veo');
    console.log('   ✅ Tópicos: 3 (horarios, libros-inglés, promociones)');
    console.log('   ✅ Variables: 3 (titulo, editorial, edicion)');
    console.log('   ✅ Acciones: 2 (mensaje, marcar_completado)\n');

    console.log('🧪 CASOS DE PRUEBA:');
    console.log('\n1️⃣ TEST: Pregunta sobre horarios');
    console.log('   Usuario: "Que horario tienen?"');
    console.log('   Esperado: GPT responde con info del tópico "horarios"');
    console.log('   Verifica: Acceso innato a tópicos\n');

    console.log('2️⃣ TEST: Pregunta sobre libros de inglés');
    console.log('   Usuario: "Tienen libros de ingles?"');
    console.log('   Esperado: GPT responde con info del tópico "libros-ingles"');
    console.log('   Verifica: Tolerancia a errores de ortografía\n');

    console.log('3️⃣ TEST: Búsqueda de libro');
    console.log('   Usuario: "Busco Harry Potter"');
    console.log('   Esperado: GPT pregunta por editorial/edición');
    console.log('   Usuario: "Cualquiera"');
    console.log('   Esperado: GPT marca [INFO_COMPLETA]');
    console.log('   Verifica: Recopilación de variables\n');

    console.log('4️⃣ TEST: Variables globales');
    console.log('   Esperado: Mensaje final muestra {{global.titulo}}');
    console.log('   Verifica: Variables guardadas correctamente\n');

    console.log('⚠️  NOTA IMPORTANTE:');
    console.log('   extractVariables() es placeholder (retorna {})');
    console.log('   Las variables NO se extraerán automáticamente');
    console.log('   Pero el flujo debe funcionar igual\n');

    console.log('🚀 PRÓXIMO PASO:');
    console.log('   1. Esperar deploy de Render');
    console.log('   2. Testear desde WhatsApp: +5493794946066');
    console.log('   3. Verificar logs del backend');
    console.log('   4. Identificar problemas reales');

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

crearFlujoPrueba3Bloques();
