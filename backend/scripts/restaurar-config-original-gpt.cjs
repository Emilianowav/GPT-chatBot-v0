const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority&appName=ClusterMomento';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

/**
 * RESTAURAR CONFIGURACIONES ORIGINALES DE NODOS GPT
 * 
 * Basado en el flujo original de 3 bloques que funcionaba:
 * - gpt-conversacional: Personalidad + Tópicos + Variables
 * - gpt-formateador: Extracción estructurada para WooCommerce
 * - gpt-pedir-datos: Pedir datos faltantes
 */

async function restaurarConfigGPT() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log('\n🔧 RESTAURANDO CONFIGURACIONES ORIGINALES DE NODOS GPT\n');
    console.log('═'.repeat(80));
    
    // ============================================================================
    // GPT-CONVERSACIONAL: Personalidad + Tópicos
    // ============================================================================
    const gptConversacional = flow.nodes.find(n => n.id === 'gpt-conversacional');
    if (gptConversacional) {
      console.log('\n📝 gpt-conversacional:');
      
      gptConversacional.data.config = {
        ...gptConversacional.data.config,
        tipo: 'conversacional',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500,
        
        systemPrompt: `Eres el asistente virtual de **Librería Veo Veo** 📚✏️

Características de tu personalidad:
- Tono amigable, profesional y entusiasta
- Usas emojis para hacer la conversación más cálida
- Eres paciente y comprensivo con errores de ortografía
- Siempre saludas con energía positiva`,

        topicHandling: 'enabled',
        
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
        ]
      };
      
      console.log('   ✅ Personalidad: Asistente de Veo Veo');
      console.log('   ✅ Tópicos: 3 (horarios, libros-inglés, promociones)');
      console.log('   ✅ Variables: 3 (titulo, editorial, edicion)');
      console.log('   ✅ topicHandling: enabled');
    }
    
    // ============================================================================
    // GPT-FORMATEADOR: Extracción estructurada para WooCommerce
    // ============================================================================
    const gptFormateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    if (gptFormateador) {
      console.log('\n📝 gpt-formateador:');
      
      gptFormateador.data.config = {
        ...gptFormateador.data.config,
        tipo: 'transform',
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 200,
        
        systemPrompt: `Extrae SOLO la información de búsqueda del mensaje del usuario.

IMPORTANTE:
- Si el usuario menciona un libro específico, extrae el título
- Si menciona editorial, extráela
- Si menciona edición/año, extráelo
- Devuelve SOLO un JSON con los campos que encuentres
- NO inventes información que no esté en el mensaje

Formato de salida:
{
  "titulo": "título del libro si lo menciona",
  "editorial": "editorial si la menciona",
  "edicion": "edición/año si lo menciona"
}`,
        
        topicHandling: 'none',
        
        extractionConfig: {
          enabled: true,
          schema: {
            titulo: { type: 'string', required: false },
            editorial: { type: 'string', required: false },
            edicion: { type: 'string', required: false }
          }
        }
      };
      
      console.log('   ✅ Tipo: transform (extracción estructurada)');
      console.log('   ✅ Schema: titulo, editorial, edicion');
      console.log('   ✅ Temperature: 0.1 (preciso)');
    }
    
    // ============================================================================
    // GPT-PEDIR-DATOS: Pedir información faltante
    // ============================================================================
    const gptPedirDatos = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    if (gptPedirDatos) {
      console.log('\n📝 gpt-pedir-datos:');
      
      gptPedirDatos.data.config = {
        ...gptPedirDatos.data.config,
        tipo: 'conversacional',
        model: 'gpt-4o-mini',
        temperature: 0.5,
        maxTokens: 150,
        
        systemPrompt: `El usuario está buscando un libro pero no proporcionó suficiente información.

Pregúntale de forma amable y específica qué libro está buscando.

IMPORTANTE:
- Sé breve y directo
- Pregunta por el título del libro
- Si ya mencionó algo, reconócelo y pide más detalles
- Mantén un tono amigable`,
        
        topicHandling: 'none'
      };
      
      console.log('   ✅ Tipo: conversacional');
      console.log('   ✅ Objetivo: Pedir datos faltantes');
      console.log('   ✅ Temperature: 0.5');
    }
    
    // ============================================================================
    // ROUTER: Configurar condiciones correctas
    // ============================================================================
    const router = flow.nodes.find(n => n.id === 'router');
    if (router) {
      console.log('\n📝 router:');
      
      router.data.config = {
        routes: [
          {
            id: 'route-1',
            label: 'Pedir Datos',
            condition: {
              type: 'missing_variables',
              variables: ['titulo']
            }
          },
          {
            id: 'route-2',
            label: 'Buscar en WooCommerce',
            condition: {
              type: 'has_variables',
              variables: ['titulo']
            }
          }
        ]
      };
      
      console.log('   ✅ Ruta 1: Pedir datos si falta título');
      console.log('   ✅ Ruta 2: Buscar en WooCommerce si tiene título');
    }
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Configuraciones restauradas\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

restaurarConfigGPT();
