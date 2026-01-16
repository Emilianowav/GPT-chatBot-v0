/**
 * Script para Mejorar GPT Armar Carrito
 * 
 * OBJETIVO:
 * Hacer que el GPT sea más dinámico y pueda:
 * - Extraer productos del historial de conversación
 * - Agregar múltiples productos
 * - Mantener productos previos al agregar más
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

const NUEVO_SYSTEM_PROMPT = `Eres un asistente experto en armar carritos de compra para una librería.

HISTORIAL COMPLETO DE LA CONVERSACIÓN:
{{historial_conversacion}}

MENSAJE ACTUAL DEL USUARIO:
{{1.message}}

TU TRABAJO:
Analizar el historial completo y el mensaje actual para extraer información del carrito.

REGLAS IMPORTANTES:

1. PRODUCTOS EN EL CARRITO:
   - Busca en el historial TODOS los productos que el bot presentó (con precio, nombre, ID)
   - Si el usuario dijo "lo quiero", "agregar al carrito", "sí", "confirmo" → agregar ese producto
   - Si el usuario pregunta "podemos agregar otro" → mantener productos previos y esperar confirmación
   - Si el usuario menciona un producto específico → buscarlo en el historial

2. CONFIRMACIÓN DE COMPRA:
   - true SOLO si el usuario confirmó explícitamente: "sí", "lo quiero", "confirmo", "comprar"
   - false si es una pregunta o consulta: "podemos agregar", "cuánto cuesta", etc.

3. DATOS DEL CLIENTE:
   - Extraer del historial si el usuario ya los proporcionó
   - Si no están → null

FORMATO DE SALIDA (JSON estricto):
{
  "productos_carrito": [
    {
      "id": 126,
      "nombre": "Harry Potter y la Orden del Fénix",
      "cantidad": 1,
      "precio": 49000
    }
  ],
  "total": 49000,
  "confirmacion_compra": true,
  "nombre_cliente": null,
  "email_cliente": null,
  "telefono_cliente": "{{1.from}}"
}

EJEMPLOS:

Historial:
Usuario: "busco harry potter 5"
Bot: "📖 HARRY POTTER Y LA ORDEN DEL FENIX, 💰 $49000, ID: 126"
Usuario: "lo quiero"

→ Output: {"productos_carrito": [{"id": 126, "nombre": "Harry Potter y la Orden del Fénix", "cantidad": 1, "precio": 49000}], "total": 49000, "confirmacion_compra": true}

Historial:
Usuario: "busco harry potter 5"
Bot: "📖 HARRY POTTER Y LA ORDEN DEL FENIX, 💰 $49000, ID: 126"
Usuario: "lo quiero"
Bot: "💳 ¡Listo para pagar!"
Usuario: "podemos agregar otro producto antes de pagar?"

→ Output: {"productos_carrito": [], "total": 0, "confirmacion_compra": false}
(Es una pregunta, no una confirmación. Mantener carrito vacío hasta que confirme qué producto agregar)`;

async function mejorarGPTArmarCarrito() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═'.repeat(80));
    console.log('🔧 MEJORANDO GPT ARMAR CARRITO');
    console.log('═'.repeat(80));
    
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    const nodoIndex = flow.nodes.findIndex(n => n.id === 'gpt-armar-carrito');
    
    if (nodoIndex === -1) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }
    
    console.log('\n📋 SYSTEM PROMPT ACTUAL:');
    const promptActual = flow.nodes[nodoIndex].data.config.extractionConfig?.systemPrompt || 
                        flow.nodes[nodoIndex].data.config.systemPrompt;
    console.log(promptActual.substring(0, 300) + '...');
    
    // Actualizar systemPrompt
    if (flow.nodes[nodoIndex].data.config.extractionConfig) {
      flow.nodes[nodoIndex].data.config.extractionConfig.systemPrompt = NUEVO_SYSTEM_PROMPT;
    } else {
      flow.nodes[nodoIndex].data.config.systemPrompt = NUEVO_SYSTEM_PROMPT;
    }
    
    console.log('\n📝 NUEVO SYSTEM PROMPT:');
    console.log(NUEVO_SYSTEM_PROMPT.substring(0, 300) + '...');
    
    // Guardar en BD
    const result = await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, updatedAt: new Date() } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ Nodo actualizado exitosamente');
      console.log('\n📊 MEJORAS APLICADAS:');
      console.log('   ✅ Usa {{historial_conversacion}} completo');
      console.log('   ✅ Extrae productos del historial');
      console.log('   ✅ Diferencia preguntas de confirmaciones');
      console.log('   ✅ Puede mantener productos previos');
      console.log('   ✅ Ejemplos claros en el prompt');
      
      console.log('\n💡 PRÓXIMO PASO:');
      console.log('   1. Limpiar estado: node scripts/limpiar-mi-numero.js');
      console.log('   2. Probar conversación:');
      console.log('      - "busco harry potter 5"');
      console.log('      - "lo quiero"');
      console.log('      - "podemos agregar otro producto?"');
      console.log('      - "busco harry potter 3"');
      console.log('      - "agregar al carrito"');
    } else {
      console.log('\n⚠️  No se modificó el nodo');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
mejorarGPTArmarCarrito()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
