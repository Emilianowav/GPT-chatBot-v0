/**
 * Script para crear tópicos globales de Veo Veo
 * Los tópicos se almacenan en la empresa y se referencian en los GPTs
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const EMPRESA_ID = '6940a9a181b92bfce970fdb5'; // Veo Veo

// Definir tópicos globales de Veo Veo
const TOPICOS_VEOVEO = [
  {
    id: 'ubicacion-horarios',
    nombre: 'Ubicación y Horarios',
    contenido: `📍 UBICACIÓN:
San Juan 1037 - Corrientes Capital

🕗 HORARIOS:
- Lunes a Viernes: 8:30 a 12:00hs y 17:00 a 21:00hs
- Sábados: 9 a 13hs y 17 a 21hs`,
    activo: true
  },
  {
    id: 'atencion-personalizada',
    nombre: 'Atención Personalizada',
    contenido: `📞 ATENCIÓN PERSONALIZADA:
WhatsApp: https://wa.me/5493794732177?text=hola

Para consultas personalizadas, libros de inglés, envíos o cualquier duda, contactá a nuestros asesores de venta.`,
    activo: true
  },
  {
    id: 'promociones-bancarias',
    nombre: 'Promociones Bancarias',
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
    activo: true
  },
  {
    id: 'politica-retiro',
    nombre: 'Política de Retiro',
    contenido: `📦 POLÍTICA DE RETIRO:

- Podés retirar tu libro después de las 24hs de realizada la compra para que podamos corroborar y preparar tu pedido
- Revisar el libro al recibirlo para detectar fallas de fábrica
- Horario de retiro: Lun-Vie 8:30-12 y 17-21hs, Sáb 9-13 y 17-21hs
- Ubicación: San Juan 1037, Corrientes Capital`,
    activo: true
  },
  {
    id: 'politica-envios',
    nombre: 'Política de Envíos',
    contenido: `🚚 POLÍTICA DE ENVÍOS:

- Los envíos son a cargo del cliente
- Para cotización de envío dentro de Corrientes, contactate con nuestros asesores de venta por WhatsApp: https://wa.me/5493794732177?text=hola`,
    activo: true
  },
  {
    id: 'cambios-devoluciones',
    nombre: 'Cambios y Devoluciones',
    contenido: `🔄 POLÍTICA DE CAMBIOS Y DEVOLUCIONES:

Si compraste un libro por error:
- Después de corroborar que el libro está en el mismo estado en el cual lo recibiste, y con tu recibo de compra en mano:
  * Podemos enviarte una nota de crédito con el monto del libro para que elijas lo que quieras de nuestra tienda
  * Podés cambiar el libro en el momento por otro del mismo valor
  * También podés elegir uno de mayor valor y abonar la diferencia
  * O uno de menor valor y te entregamos una nota de crédito por la diferencia

📍 Para completar la gestión acercate a nuestro local en San Juan 1037`,
    activo: true
  },
  {
    id: 'fallas-fabrica',
    nombre: 'Fallas de Fábrica',
    contenido: `⚠️ FALLAS DE FÁBRICA:

Esto no es común pero suele suceder. Hay fallas que se escapan de nuestras manos, por lo cual siempre sugerimos que luego de realizar la compra se debe revisar el producto.

Te recomendamos acercarte al local con:
- Libro en mano en buenas condiciones (Sin forrar o intervenir en el mismo)
- Tu recibo o ticket

📍 San Juan 1037, Corrientes Capital`,
    activo: true
  },
  {
    id: 'libros-ingles',
    nombre: 'Libros de Inglés',
    contenido: `📚 LIBROS DE INGLÉS:

Los libros de inglés se realizan ÚNICAMENTE a pedido con seña.

Para realizar tu pedido, comunicate con un asesor de venta directo:
👉 https://wa.me/5493794732177?text=Hola, estoy interesado en un libro de inglés a pedido`,
    activo: true
  },
  {
    id: 'tono-comunicacion',
    nombre: 'Tono de Comunicación',
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
    activo: true
  }
];

async function crearTopicos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const empresasCollection = db.collection('empresas');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📚 CREANDO TÓPICOS GLOBALES PARA VEO VEO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Actualizar empresa con tópicos
    await empresasCollection.updateOne(
      { _id: new ObjectId(EMPRESA_ID) },
      { 
        $set: { 
          topicos: TOPICOS_VEOVEO,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ ${TOPICOS_VEOVEO.length} tópicos creados en la empresa Veo Veo\n`);
    
    console.log('📋 TÓPICOS CREADOS:\n');
    TOPICOS_VEOVEO.forEach((topico, index) => {
      console.log(`${index + 1}. ${topico.nombre} (${topico.id})`);
      console.log(`   Contenido: ${topico.contenido.substring(0, 80)}...`);
      console.log(`   Activo: ${topico.activo ? '✅' : '❌'}\n`);
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Tópicos globales creados: ${TOPICOS_VEOVEO.length}`);
    console.log('\n📋 CATEGORÍAS:');
    console.log('   1. Ubicación y Horarios');
    console.log('   2. Atención Personalizada');
    console.log('   3. Promociones Bancarias');
    console.log('   4. Política de Retiro');
    console.log('   5. Política de Envíos');
    console.log('   6. Cambios y Devoluciones');
    console.log('   7. Fallas de Fábrica');
    console.log('   8. Libros de Inglés');
    console.log('   9. Tono de Comunicación');
    console.log('\n💡 PRÓXIMO PASO:');
    console.log('   Referenciar estos tópicos en los nodos GPT del flujo');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
crearTopicos()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
