import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function configurarClasificadorCompleto() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ WooCommerce Flow no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('🔧 CONFIGURAR CLASIFICADOR INTELIGENTE');
    console.log('═'.repeat(80));
    
    const clasificadorIndex = wooFlow.nodes.findIndex(n => n.id === 'gpt-clasificador-inteligente');
    
    if (clasificadorIndex === -1) {
      console.log('❌ Nodo gpt-clasificador-inteligente no encontrado');
      return;
    }
    
    const systemPrompt = `Eres un clasificador de intenciones para una librería.

TAREA: Clasificar la intención del usuario en una de estas categorías:

CATEGORÍAS:
1. "buscar_producto" - El usuario quiere buscar un libro
   Ejemplos: "Busco Harry Potter", "Tenes García Márquez?", "Algo de terror"
   
2. "agregar_carrito" - El usuario quiere agregar un producto al carrito
   Ejemplos: "Lo quiero", "Agregar al carrito", "Si quisiera agregarlo", "1 y 2", "el 3"
   
3. "finalizar_compra" - El usuario quiere pagar/finalizar la compra
   Ejemplos: "Como pago?", "Quiero pagar", "Finalizar compra", "Comprar", "Quiero comprarlo"
   
4. "ver_carrito" - El usuario quiere ver su carrito
   Ejemplos: "Ver carrito", "Que tengo en el carrito?", "Mi carrito"
   
5. "consulta_general" - Consultas sobre horarios, ubicación, políticas, etc.
   Ejemplos: "Que horarios tienen?", "Donde están?", "Aceptan tarjeta?"

REGLAS:
- Si el usuario menciona "pago", "pagar", "comprar", "finalizar" → tipo_accion = "finalizar_compra"
- Si el usuario dice un número o "lo quiero", "agregarlo" → tipo_accion = "agregar_carrito"
- Si el usuario busca un libro por título o autor → tipo_accion = "buscar_producto"
- Si el usuario pregunta sobre horarios, ubicación, etc. → tipo_accion = "consulta_general"

IMPORTANTE: Siempre devuelve confianza entre 0.0 y 1.0

EJEMPLOS:

Usuario: "Como pago?"
→ {
  "tipo_accion": "finalizar_compra",
  "confianza": 0.95,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "1 y 2"
→ {
  "tipo_accion": "agregar_carrito",
  "confianza": 0.9,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "Busco Harry Potter"
→ {
  "tipo_accion": "buscar_producto",
  "confianza": 0.95,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "Quiero comprarlo"
→ {
  "tipo_accion": "finalizar_compra",
  "confianza": 0.9,
  "variables_completas": true,
  "variables_faltantes": []
}`;

    const extractionConfig = {
      enabled: true,
      method: 'advanced',
      contextSource: 'ultimo_mensaje',
      systemPrompt: systemPrompt,
      variables: [
        {
          nombre: 'tipo_accion',
          tipo: 'string',
          requerido: true,
          descripcion: 'Tipo de acción: buscar_producto, agregar_carrito, finalizar_compra, ver_carrito, consulta_general'
        },
        {
          nombre: 'confianza',
          tipo: 'number',
          requerido: true,
          descripcion: 'Nivel de confianza entre 0.0 y 1.0'
        },
        {
          nombre: 'variables_completas',
          tipo: 'boolean',
          requerido: true,
          descripcion: 'Siempre true para el clasificador'
        },
        {
          nombre: 'variables_faltantes',
          tipo: 'array',
          requerido: true,
          descripcion: 'Siempre array vacío para el clasificador'
        }
      ]
    };
    
    console.log('\n📝 Configuración anterior:');
    console.log('  extractionConfig:', wooFlow.nodes[clasificadorIndex].data.config.extractionConfig ? 'Existe' : 'No existe');
    
    // Actualizar nodo
    wooFlow.nodes[clasificadorIndex].data.config.extractionConfig = extractionConfig;
    wooFlow.nodes[clasificadorIndex].data.config.tipo = 'formateador';
    wooFlow.nodes[clasificadorIndex].data.config.outputFormat = 'json_object';
    
    console.log('\n✅ Nueva configuración:');
    console.log('  extractionConfig.enabled:', extractionConfig.enabled);
    console.log('  extractionConfig.variables:', extractionConfig.variables.length);
    
    // Guardar cambios
    console.log('\n💾 Guardando cambios...');
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    console.log(`   Modified count: ${result.modifiedCount}`);
    
    console.log('\n' + '═'.repeat(80));
    console.log('📋 FLUJO COMPLETO AHORA');
    console.log('═'.repeat(80));
    
    console.log('\n1️⃣ BUSCAR PRODUCTO:');
    console.log('   Usuario: "Busco Harry Potter"');
    console.log('   → Clasificador: tipo_accion = "buscar_producto"');
    console.log('   → Router: Ruta "b" → Formateador → WooCommerce');
    console.log('   → Presenta productos reales con links');
    
    console.log('\n2️⃣ AGREGAR AL CARRITO:');
    console.log('   Usuario: "1 y 2"');
    console.log('   → Clasificador: tipo_accion = "agregar_carrito"');
    console.log('   → Router: Ruta "b" → GPT Armar Carrito');
    console.log('   → Actualiza carrito_items, carrito_total');
    
    console.log('\n3️⃣ FINALIZAR COMPRA:');
    console.log('   Usuario: "Como pago?"');
    console.log('   → Clasificador: tipo_accion = "finalizar_compra"');
    console.log('   → Router: Ruta "b" → GPT Armar Carrito');
    console.log('   → Router Carrito: Ruta "b" → MercadoPago');
    console.log('   → Genera link de pago');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configurarClasificadorCompleto();
