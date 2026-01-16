/**
 * Script para Mejorar GPT Armar Carrito con Confirmación de Pago
 * 
 * OBJETIVO:
 * Modificar el GPT Armar Carrito para que cuando detecte mercadopago_estado = "approved"
 * genere un mensaje personalizado y dinámico de confirmación de pago.
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function mejorarGPTConfirmacion() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═'.repeat(80));
    console.log('🔧 MEJORANDO GPT ARMAR CARRITO - CONFIRMACIÓN DE PAGO');
    console.log('═'.repeat(80));
    
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }

    // Modificar GPT Armar Carrito
    console.log('\n📝 Modificando GPT Armar Carrito...');
    
    const carritoIndex = flow.nodes.findIndex(n => n.id === 'gpt-armar-carrito');
    if (carritoIndex === -1) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }

    const nuevoSystemPrompt = `Eres un asistente experto en armar carritos de compra para una librería.

HISTORIAL COMPLETO DE LA CONVERSACIÓN:
{{historial_conversacion}}

MENSAJE ACTUAL DEL USUARIO:
{{1.message}}

ESTADO DEL PAGO (si existe):
{{mercadopago_estado}}

MONTO DEL PAGO (si existe):
{{mercadopago_monto}}

PRODUCTOS DEL CARRITO (si existen):
{{productos_carrito}}

LINK DE PAGO (si existe):
{{mercadopago_link}}

TU TRABAJO:
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
   
   EJEMPLOS DE MENSAJES CREATIVOS:
   
   "🎉 ¡Tu pago fue aprobado!
   
   ¡Qué emoción! Ya tenemos tu pedido confirmado:
   📚 Harry Potter y la Orden del Fénix
   
   💰 Monto: $49.000
   
   ✨ Tus libros están listos para que los disfrutes. ¿Preferís retiro en local o envío a domicilio?
   
   ¡Gracias por elegirnos! 🌟"
   
   O:
   
   "✅ ¡Pago confirmado! 
   
   🎊 ¡Excelente elección! Tu compra fue procesada exitosamente:
   
   📖 Harry Potter y la Orden del Fénix
   📖 Harry Potter y el Cáliz de Fuego
   
   💳 Total pagado: $97.800
   
   📦 Tus libros te están esperando. Escribinos para coordinar la entrega.
   
   ¡Que los disfrutes! 💫"

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
}

EJEMPLOS:

Usuario: "✅ pago confirmado" (mensaje automático del webhook)
mercadopago_estado: "approved"
mercadopago_monto: 49000
productos_carrito: [{"id": 126, "nombre": "Harry Potter y la Orden del Fénix", ...}]
→ Output: {
  "tipo_mensaje": "pago_confirmado_automatico",
  "mensaje_confirmacion": "🎉 ¡Tu pago fue aprobado!...",
  "productos_carrito": [...],
  "total": 49000,
  "confirmacion_compra": false
}

Usuario: "ya pagué"
→ Output: {"tipo_mensaje": "verificar_pago", "productos_carrito": [], "total": 0, "confirmacion_compra": false}

Usuario: "lo quiero"
→ Output: {"tipo_mensaje": "confirmar_compra", "productos_carrito": [...], "total": 49000, "confirmacion_compra": true}`;

    if (flow.nodes[carritoIndex].data.config.extractionConfig) {
      flow.nodes[carritoIndex].data.config.extractionConfig.systemPrompt = nuevoSystemPrompt;
      
      // Agregar mensaje_confirmacion a las variables a extraer
      const variables = flow.nodes[carritoIndex].data.config.extractionConfig.variables || [];
      if (!variables.find(v => v.nombre === 'mensaje_confirmacion')) {
        variables.push({
          nombre: 'mensaje_confirmacion',
          tipo: 'string',
          descripcion: 'Mensaje personalizado de confirmación de pago (solo si pago aprobado)',
          obligatoria: false
        });
        flow.nodes[carritoIndex].data.config.extractionConfig.variables = variables;
      }
      
      console.log('   ✅ GPT Armar Carrito actualizado con generación de mensaje personalizado');
    }

    // Actualizar nodo WhatsApp Confirmación para usar el mensaje del GPT
    console.log('\n📱 Actualizando WhatsApp Confirmación...');
    
    const whatsappConfIndex = flow.nodes.findIndex(n => n.id === 'whatsapp-confirmacion-pago');
    if (whatsappConfIndex !== -1) {
      flow.nodes[whatsappConfIndex].data.config.message = '{{gpt-armar-carrito.mensaje_confirmacion}}';
      console.log('   ✅ WhatsApp Confirmación actualizado para usar mensaje del GPT');
    }

    // Actualizar condición del router para detectar pago_confirmado_automatico
    console.log('\n🔀 Actualizando Router Carrito...');
    
    const edgeConfirmacion = flow.edges.find(e => e.id === 'edge-router-confirmacion');
    if (edgeConfirmacion) {
      edgeConfirmacion.data.condition = '{{tipo_mensaje}} equals pago_confirmado_automatico';
      edgeConfirmacion.data.label = '✅ Pago Confirmado Auto';
      console.log('   ✅ Condición del router actualizada');
    }

    // Guardar cambios
    console.log('\n💾 Guardando cambios en BD...');
    const result = await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges,
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Flow actualizado exitosamente\n');
      
      console.log('📊 RESUMEN DE CAMBIOS:');
      console.log('   ✅ GPT Armar Carrito genera mensaje personalizado');
      console.log('   ✅ Detecta tipo_mensaje = "pago_confirmado_automatico"');
      console.log('   ✅ Crea mensaje_confirmacion dinámico con GPT');
      console.log('   ✅ WhatsApp Confirmación usa {{gpt-armar-carrito.mensaje_confirmacion}}');
      console.log('   ✅ Router detecta pago_confirmado_automatico');
      
      console.log('\n💡 FLUJO COMPLETO:');
      console.log('   Webhook MP (pago aprobado)');
      console.log('   → Actualiza mercadopago_estado = "approved"');
      console.log('   → Dispara mensaje: "✅ pago confirmado"');
      console.log('   → GPT Armar Carrito detecta pago aprobado');
      console.log('   → Genera mensaje personalizado con GPT');
      console.log('   → Router Carrito → WhatsApp Confirmación');
      console.log('   → Envía mensaje dinámico al cliente');
    } else {
      console.log('⚠️  No se modificó el flow');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
mejorarGPTConfirmacion()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
