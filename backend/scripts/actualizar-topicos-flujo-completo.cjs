/**
 * Script para actualizar los tópicos del flujo con info completa de FLUJOVEOVEO.MD
 * Los tópicos van en flow.config.topicos, NO en la empresa
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';
const EMPRESA_ID = '6940a9a181b92bfce970fdb5';

// Tópicos completos del flujo Veo Veo
const TOPICOS_FLUJO = {
  // Tópico de tono de comunicación
  'tono-comunicacion': {
    titulo: 'Tono de Comunicación',
    contenido: `🎨 TONO Y ESTILO DE COMUNICACIÓN:

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
- "Muchas gracias por tu compra"`,
    keywords: ['tono', 'comunicacion', 'vos', 'emojis', 'amigable']
  },
  
  // Tópico de ubicación y horarios
  'ubicacion-horarios': {
    titulo: 'Ubicación y Horarios',
    contenido: `📍 UBICACIÓN:
San Juan 1037 - Corrientes Capital

🕗 HORARIOS:
- Lunes a Viernes: 8:30 a 12:00hs y 17:00 a 21:00hs
- Sábados: 9 a 13hs y 17 a 21hs
- Domingos: Cerrado`,
    keywords: ['ubicacion', 'direccion', 'horarios', 'donde', 'cuando']
  },
  
  // Tópico de atención personalizada
  'atencion-personalizada': {
    titulo: 'Atención Personalizada',
    contenido: `📞 ATENCIÓN PERSONALIZADA:
WhatsApp: https://wa.me/5493794732177?text=hola

Para consultas personalizadas, libros de inglés, envíos o cualquier duda, contactá a nuestros asesores de venta.`,
    keywords: ['atencion', 'contacto', 'whatsapp', 'asesor', 'ayuda']
  },
  
  // Tópico de promociones bancarias
  'promociones-bancarias': {
    titulo: 'Promociones Bancarias',
    contenido: `🏦 PROMOCIONES BANCARIAS VIGENTES:

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

⚠️ Las promociones son sobre el precio de lista`,
    keywords: ['promociones', 'banco', 'cuotas', 'descuento', 'tarjeta']
  },
  
  // Tópico de política de retiro
  'politica-retiro': {
    titulo: 'Política de Retiro',
    contenido: `📦 POLÍTICA DE RETIRO:

- Podés retirar tu libro después de las 24hs de realizada la compra para que podamos corroborar y preparar tu pedido
- Revisar el libro al recibirlo para detectar fallas de fábrica
- Horario de retiro: Lun-Vie 8:30-12 y 17-21hs, Sáb 9-13 y 17-21hs
- Ubicación: San Juan 1037, Corrientes Capital`,
    keywords: ['retiro', 'retirar', 'buscar', 'horario', '24hs']
  },
  
  // Tópico de política de envíos
  'politica-envios': {
    titulo: 'Política de Envíos',
    contenido: `🚚 POLÍTICA DE ENVÍOS:

- Los envíos son a cargo del cliente
- Para cotización de envío dentro de Corrientes, contactate con nuestros asesores de venta por WhatsApp: https://wa.me/5493794732177?text=hola`,
    keywords: ['envio', 'envios', 'delivery', 'domicilio', 'cotizacion']
  },
  
  // Tópico de cambios y devoluciones
  'cambios-devoluciones': {
    titulo: 'Cambios y Devoluciones',
    contenido: `🔄 POLÍTICA DE CAMBIOS Y DEVOLUCIONES:

Si compraste un libro por error:
- Después de corroborar que el libro está en el mismo estado en el cual lo recibiste, y con tu recibo de compra en mano:
  * Podemos enviarte una nota de crédito con el monto del libro para que elijas lo que quieras de nuestra tienda
  * Podés cambiar el libro en el momento por otro del mismo valor
  * También podés elegir uno de mayor valor y abonar la diferencia
  * O uno de menor valor y te entregamos una nota de crédito por la diferencia

📍 Para completar la gestión acercate a nuestro local en San Juan 1037`,
    keywords: ['cambio', 'devolucion', 'error', 'nota credito', 'recibo']
  },
  
  // Tópico de fallas de fábrica
  'fallas-fabrica': {
    titulo: 'Fallas de Fábrica',
    contenido: `⚠️ FALLAS DE FÁBRICA:

Esto no es común pero suele suceder. Hay fallas que se escapan de nuestras manos, por lo cual siempre sugerimos que luego de realizar la compra se debe revisar el producto.

Te recomendamos acercarte al local con:
- Libro en mano en buenas condiciones (Sin forrar o intervenir en el mismo)
- Tu recibo o ticket

📍 San Juan 1037, Corrientes Capital`,
    keywords: ['falla', 'defecto', 'roto', 'dañado', 'fabrica']
  },
  
  // Tópico de libros de inglés
  'libros-ingles': {
    titulo: 'Libros de Inglés',
    contenido: `📚 LIBROS DE INGLÉS:

Los libros de inglés se realizan ÚNICAMENTE a pedido con seña.

Para realizar tu pedido, comunicate con un asesor de venta directo:
👉 https://wa.me/5493794732177?text=Hola, estoy interesado en un libro de inglés a pedido`,
    keywords: ['ingles', 'english', 'idioma', 'pedido', 'seña']
  }
};

async function actualizarTopicosFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📚 ACTUALIZANDO TÓPICOS DEL FLUJO VEO VEO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Actualizar tópicos en el flujo
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          'config.topicos': TOPICOS_FLUJO,
          'config.topicos_habilitados': true,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Tópicos actualizados en el flujo (${Object.keys(TOPICOS_FLUJO).length} tópicos)\n`);
    
    // 2. Eliminar tópicos de la empresa (estaban duplicados)
    await db.collection('empresas').updateOne(
      { _id: new ObjectId(EMPRESA_ID) },
      { 
        $unset: { topicos: "" },
        $set: { updatedAt: new Date() }
      }
    );
    
    console.log('✅ Tópicos eliminados de la empresa (estaban duplicados)\n');
    
    console.log('📋 TÓPICOS CREADOS/ACTUALIZADOS:\n');
    Object.entries(TOPICOS_FLUJO).forEach(([id, topico], index) => {
      console.log(`${index + 1}. ${id}`);
      console.log(`   Título: ${topico.titulo}`);
      console.log(`   Contenido: ${topico.contenido.substring(0, 80)}...`);
      console.log(`   Keywords: ${topico.keywords.join(', ')}\n`);
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Tópicos en flujo: ${Object.keys(TOPICOS_FLUJO).length}`);
    console.log('✅ Tópicos eliminados de empresa (duplicados)');
    console.log('\n📋 TÓPICOS DISPONIBLES:');
    console.log('   1. tono-comunicacion');
    console.log('   2. ubicacion-horarios');
    console.log('   3. atencion-personalizada');
    console.log('   4. promociones-bancarias');
    console.log('   5. politica-retiro');
    console.log('   6. politica-envios');
    console.log('   7. cambios-devoluciones');
    console.log('   8. fallas-fabrica');
    console.log('   9. libros-ingles');
    console.log('\n🔗 NODOS GPT ACTUALIZADOS:');
    console.log('   - gpt-clasificador-inteligente: [tono-comunicacion]');
    console.log('   - gpt-armar-carrito: [tono-comunicacion, politica-retiro, politica-envios]');
    console.log('   - gpt-asistente-ventas: [tono-comunicacion, atencion-personalizada, libros-ingles]');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
actualizarTopicosFlujo()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
