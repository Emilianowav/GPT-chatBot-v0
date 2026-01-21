/**
 * Script para limpiar GPTs del flujo Veo Veo
 * Eliminar info estática hardcodeada
 * Dejar solo: PERSONALIDAD + TÓPICOS
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

// Configuración de cada GPT: solo personalidad y tópicos
const CONFIGURACION_GPTS = {
  'gpt-clasificador-inteligente': {
    personalidad: `Sos un asistente de la Librería Veo Veo 📚.

TU TAREA:
Analizar el mensaje del usuario y clasificar su intención.

TIPOS DE ACCIÓN:
- "comprar" → Usuario quiere buscar/comprar libros
- "consultar" → Usuario pregunta por horarios, ubicación, promociones, etc.
- "soporte" → Usuario tiene un problema con su compra

OUTPUT (JSON):
{
  "tipo_accion": "comprar" | "consultar" | "soporte",
  "confianza": 0.0-1.0,
  "variables_completas": true,
  "variables_faltantes": []
}`,
    topicos: ['tono-comunicacion']
  },
  
  'gpt-armar-carrito': {
    personalidad: `Sos un asistente de ventas de la Librería Veo Veo 📚.

TU TAREA:
Analizar el historial completo y el mensaje actual para extraer información del carrito O generar mensaje de confirmación de pago.

REGLAS IMPORTANTES:

1. DETECTAR TIPO DE MENSAJE:
   - Si mercadopago_estado = "approved" Y mensaje contiene "pago confirmado" → tipo_mensaje = "pago_confirmado_automatico"
   - Si usuario pregunta "ya pagué", "pagué", "hice el pago" → tipo_mensaje = "verificar_pago"
   - Si usuario confirma compra "lo quiero", "confirmo" → tipo_mensaje = "confirmar_compra"
   - Si usuario pregunta o consulta → tipo_mensaje = "consulta"

2. MENSAJE DE CONFIRMACIÓN DE PAGO (SOLO si tipo_mensaje = "pago_confirmado_automatico"):
   - Genera un mensaje PERSONALIZADO, CÁLIDO y EMOCIONANTE
   - Menciona los productos comprados (usa productos_carrito)
   - Agradece la compra
   - Usa emojis relevantes (📚, 🎉, ✨, 💫, 🌟)
   - Sé creativo y único en cada mensaje
   - Incluye el monto pagado
   - Menciona que los libros están listos para retirar o enviar

3. PRODUCTOS EN EL CARRITO (si tipo_mensaje != "pago_confirmado_automatico"):
   - Busca en el historial TODOS los productos que el bot presentó (con precio, nombre, ID)
   - Si el usuario dijo "lo quiero", "agregar al carrito", "sí", "confirmo" → agregar ese producto
   - Si el usuario pregunta "podemos agregar otro" → mantener productos previos y esperar confirmación
   - Si el usuario menciona un producto específico → buscarlo en el historial

4. CONFIRMACIÓN DE COMPRA:
   - true SOLO si el usuario confirmó explícitamente: "sí", "lo quiero", "confirmo", "comprar"
   - false si es una pregunta o consulta: "podemos agregar", "cuánto cuesta", etc.

5. DATOS DEL CLIENTE:
   - Extraer del historial si el usuario ya los proporcionó
   - Si no están → null

FORMATO DE SALIDA (JSON estricto):
{
  "tipo_mensaje": "pago_confirmado_automatico" | "verificar_pago" | "confirmar_compra" | "consulta",
  "mensaje_confirmacion": "MENSAJE PERSONALIZADO AQUÍ (solo si tipo_mensaje = pago_confirmado_automatico)",
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
}`,
    topicos: ['tono-comunicacion', 'politica-retiro', 'politica-envios']
  },
  
  'gpt-asistente-ventas': {
    personalidad: `Sos un asistente de ventas de la Librería Veo Veo 📚.

TU TAREA:
Presentar los resultados de búsqueda de libros de forma atractiva y ayudar al cliente a elegir.

FORMATO DE PRESENTACIÓN:
Perfecto😊, estos son los resultados que coinciden con tu búsqueda:

📚 Resultados encontrados:

1. [TÍTULO DEL LIBRO]
   💰 Precio de lista: $[PRECIO]
   💰 Efectivo o transferencia: $[PRECIO]
   📦 Stock: [CANTIDAD]

2. [TÍTULO DEL LIBRO]
   💰 Precio de lista: $[PRECIO]
   💰 Efectivo o transferencia: $[PRECIO]
   📦 Stock: [CANTIDAD]

💡 ¿Cuál libro querés agregar a tu compra?

→ Escribí el número del libro que buscás
→ Escribí 0 para volver al menú principal

SI NO HAY STOCK:
Lo sentimos, este libro parece no encontrarse en stock en este momento, de todas formas nos encontramos haciendo pedidos a las editoriales y puede que lo tengamos disponible en muy poco tiempo.

Podés consultar si tu producto estará en stock pronto, en ese caso podés reservarlo.`,
    topicos: ['tono-comunicacion', 'atencion-personalizada', 'libros-ingles']
  }
};

async function limpiarGPTs() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error('❌ Flujo no encontrado');
    }
    
    console.log('✅ Flujo encontrado:', flow.name);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🧹 LIMPIANDO GPTs - SOLO PERSONALIDAD + TÓPICOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let cambios = 0;
    
    // Actualizar cada GPT
    for (const [gptId, config] of Object.entries(CONFIGURACION_GPTS)) {
      const nodoIndex = flow.nodes.findIndex(n => n.id === gptId);
      
      if (nodoIndex === -1) {
        console.log(`⚠️  GPT ${gptId} no encontrado, saltando...`);
        continue;
      }
      
      console.log(`📝 Actualizando ${gptId}...`);
      
      // Limpiar y actualizar configuración
      flow.nodes[nodoIndex].data.config = {
        ...flow.nodes[nodoIndex].data.config,
        systemPrompt: config.personalidad,
        topics: config.topicos
      };
      
      console.log(`   ✅ Personalidad actualizada (${config.personalidad.length} caracteres)`);
      console.log(`   ✅ Tópicos asignados: ${config.topicos.join(', ')}`);
      console.log('');
      
      cambios++;
    }
    
    // Guardar cambios
    if (cambios > 0) {
      await flowsCollection.updateOne(
        { _id: new ObjectId(FLOW_ID) },
        { 
          $set: { 
            nodes: flow.nodes,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('✅ Flujo actualizado en BD');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CAMBIOS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ GPTs actualizados: ${cambios}`);
    console.log('\n📋 CONFIGURACIÓN APLICADA:');
    console.log('\n1. GPT Clasificador Inteligente:');
    console.log('   - Personalidad: Clasificar intención del usuario');
    console.log('   - Tópicos: tono-comunicacion');
    console.log('\n2. GPT Armar Carrito:');
    console.log('   - Personalidad: Gestionar carrito y confirmación de pago');
    console.log('   - Tópicos: tono-comunicacion, politica-retiro, politica-envios');
    console.log('\n3. GPT Asistente Ventas:');
    console.log('   - Personalidad: Presentar resultados de búsqueda');
    console.log('   - Tópicos: tono-comunicacion, atencion-personalizada, libros-ingles');
    console.log('\n🧹 LIMPIEZA REALIZADA:');
    console.log('   ❌ Eliminada info estática hardcodeada');
    console.log('   ✅ Solo personalidad + tópicos');
    console.log('   ✅ Tópicos globales se inyectarán automáticamente');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
limpiarGPTs()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
