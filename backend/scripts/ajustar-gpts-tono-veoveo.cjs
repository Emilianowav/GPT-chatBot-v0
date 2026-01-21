/**
 * Script para ajustar los GPTs del flujo Veo Veo con el tono correcto
 * y la información estática fundamental
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

// Información estática de Veo Veo
const INFO_ESTATICA = `
INFORMACIÓN DE LA LIBRERÍA VEO VEO:

📍 UBICACIÓN:
San Juan 1037 - Corrientes Capital

🕗 HORARIOS:
- Lunes a Viernes: 8:30 a 12:00hs y 17:00 a 21:00hs
- Sábados: 9 a 13hs y 17 a 21hs

📞 ATENCIÓN PERSONALIZADA:
WhatsApp: https://wa.me/5493794732177?text=hola

🏦 PROMOCIONES BANCARIAS VIGENTES:

Banco de Corrientes:
👉 Lunes y Miércoles: 3 cuotas sin interés y 20% de bonificación con app +Banco (Visa/Mastercard). Tope $20.000
👉 Jueves: 30% Off en 6 cuotas sin interés con Tarjeta Bonita Visa. Tope $50.000

Banco Nación:
👉 Sábados con MODO BNA+: 10% de reintegro y hasta 3 cuotas sin interés (Visa/Mastercard). Tope $10.000

Banco Hipotecario:
👉 Todos los días: 6 cuotas fijas con tarjeta de crédito
👉 Miércoles: 25% off con tarjeta de débito. Tope $10.000

LOCRED:
👉 Todos los días: 3 y 6 cuotas sin interés

NaranjaX:
👉 planZ: 3 cuotas sin interés
👉 6 cuotas sin interés

Go Cuotas:
👉 Con tarjeta de Débito: hasta 3 cuotas sin interés (registrarse en https://www.gocuotas.com/)

⚠️ Las promociones son sobre el precio de lista

📦 RETIROS:
- Disponible después de 24hs de confirmado el pago
- Revisar el libro al recibirlo para detectar fallas de fábrica

🚚 ENVÍOS:
- A cargo del cliente
- Consultar cotización con atención personalizada
`;

const TONO_COMUNICACION = `
TONO Y ESTILO DE COMUNICACIÓN:

✅ USAR:
- Tono amigable, cercano y cálido
- Emojis relevantes (📚, 📖, 💰, 📦, ✨, 😊, 🤗)
- Tratamiento de "vos" (argentino informal)
- Mensajes concisos y claros
- Entusiasmo por ayudar

❌ EVITAR:
- Tono formal o distante
- Mensajes muy largos
- Lenguaje técnico
- Tuteo (usar "vos" en lugar de "tú")

EJEMPLOS DE FRASES:
- "Perfecto😊, estos son los resultados..."
- "¿Cuál libro querés agregar a tu compra?"
- "¡Qué emoción! Ya tenemos tu pedido confirmado"
- "Te esperamos! 🤗"
- "Muchas gracias por tu compra"
`;

async function ajustarGPTs() {
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
    console.log('📝 AJUSTANDO GPTs CON TONO Y INFO DE VEO VEO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. GPT Clasificador Inteligente
    const gptClasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    if (gptClasificador) {
      console.log('1️⃣ Ajustando GPT Clasificador Inteligente...');
      
      gptClasificador.data.config.systemPrompt = `Sos un asistente de la Librería Veo Veo 📚, una librería ubicada en Corrientes Capital, Argentina.

${TONO_COMUNICACION}

TU TAREA:
Analizar el mensaje del usuario y clasificar su intención.

TIPOS DE ACCIÓN:
- "comprar" → Usuario quiere buscar/comprar libros
- "consultar" → Usuario pregunta por horarios, ubicación, promociones, etc.
- "soporte" → Usuario tiene un problema con su compra

IMPORTANTE:
- Usar tono amigable y cercano
- Tratamiento de "vos" (argentino)
- Ser conciso y claro

OUTPUT (JSON):
{
  "tipo_accion": "comprar" | "consultar" | "soporte",
  "confianza": 0.0-1.0,
  "variables_completas": true,
  "variables_faltantes": []
}`;
      
      console.log('   ✅ GPT Clasificador actualizado');
    }
    
    // 2. GPT Armar Carrito
    const gptCarrito = flow.nodes.find(n => n.id === 'gpt-armar-carrito');
    if (gptCarrito) {
      console.log('2️⃣ Ajustando GPT Armar Carrito...');
      
      const promptActual = gptCarrito.data.config.systemPrompt || '';
      
      // Agregar info estática y tono al prompt existente
      gptCarrito.data.config.systemPrompt = `Sos un asistente de ventas de la Librería Veo Veo 📚, ubicada en Corrientes Capital, Argentina.

${INFO_ESTATICA}

${TONO_COMUNICACION}

${promptActual}

IMPORTANTE AL GENERAR MENSAJES:
- Usar tono cálido y amigable
- Emojis relevantes (📚, 💰, 📦, ✨, 😊)
- Tratamiento de "vos" (argentino)
- Mensajes concisos y entusiastas

EJEMPLOS DE MENSAJES:
- "Perfecto😊, agregué el libro a tu compra"
- "¿Cuántos ejemplares querés?"
- "¡Qué emoción! Ya tenemos tu pedido confirmado"
- "Te esperamos! 🤗"`;
      
      console.log('   ✅ GPT Armar Carrito actualizado');
    }
    
    // 3. GPT Asistente Ventas
    const gptAsistente = flow.nodes.find(n => n.id === 'gpt-asistente-ventas');
    if (gptAsistente) {
      console.log('3️⃣ Ajustando GPT Asistente Ventas...');
      
      gptAsistente.data.config.systemPrompt = `Sos un asistente de ventas de la Librería Veo Veo 📚, ubicada en Corrientes Capital, Argentina.

${INFO_ESTATICA}

${TONO_COMUNICACION}

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

Podés consultar si tu producto estará en stock pronto, en ese caso podés reservarlo.

Para más información comunicarte a nuestro número de atención personalizada:
👉 https://wa.me/5493794732177?text=hola

IMPORTANTE:
- Tono amigable y entusiasta
- Usar emojis relevantes
- Tratamiento de "vos"
- Ser claro y conciso`;
      
      console.log('   ✅ GPT Asistente Ventas actualizado');
    }
    
    // Guardar cambios
    await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('\n✅ Flujo actualizado en BD');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CAMBIOS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ GPT Clasificador: Tono Veo Veo aplicado');
    console.log('✅ GPT Armar Carrito: Info estática + tono aplicado');
    console.log('✅ GPT Asistente Ventas: Formato de presentación aplicado');
    console.log('\n📋 INFORMACIÓN AGREGADA:');
    console.log('   - Ubicación: San Juan 1037, Corrientes');
    console.log('   - Horarios de atención');
    console.log('   - WhatsApp atención personalizada');
    console.log('   - Promociones bancarias vigentes');
    console.log('   - Políticas de retiro y envío');
    console.log('\n🎨 TONO APLICADO:');
    console.log('   - Amigable y cercano');
    console.log('   - Tratamiento de "vos" (argentino)');
    console.log('   - Emojis relevantes (📚, 💰, 📦, ✨, 😊)');
    console.log('   - Mensajes concisos y entusiastas');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
ajustarGPTs()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
