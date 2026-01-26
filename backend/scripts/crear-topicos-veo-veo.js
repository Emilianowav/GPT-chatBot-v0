import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function crearTopicos() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📚 Creando tópicos para Veo Veo...\n');
    
    const topicos = {
      horarios: {
        titulo: 'Horarios de Atención',
        descripcion: `📅 Horarios de Atención - Librería Veo Veo:

Lunes a Viernes: 9:00 a 13:00 y 16:30 a 20:30
Sábados: 9:00 a 13:00

Estamos ubicados en Corrientes Capital.

Para consultas fuera del horario de atención, podés dejarnos tu mensaje y te responderemos a la brevedad.`
      },
      
      medios_pago: {
        titulo: 'Medios de Pago y Promociones',
        descripcion: `💳 Medios de Pago y Promociones Bancarias:

🏦 Banco de Corrientes:
• Lunes y Miércoles: 3 cuotas sin interés + 20% bonificación con app +Banco (Visa/Mastercard). Tope $20.000
• Jueves: 30% Off en 6 cuotas sin interés con Tarjeta Bonita Visa. Tope $50.000

🏦 Banco Nación:
• Sábados con MODO BNA+: 10% reintegro + hasta 3 cuotas sin interés (Visa/Mastercard). Tope $10.000

🏦 Banco Hipotecario:
• Todos los días: 6 cuotas fijas con tarjeta de crédito
• Miércoles: 25% off con tarjeta de débito. Tope $10.000

💳 LOCRED:
• Todos los días: 3 y 6 cuotas sin interés

🍊 NaranjaX:
• planZ: 3 cuotas sin interés
• 6 cuotas sin interés

💰 Go Cuotas:
• Con tarjeta de Débito: hasta 3 cuotas sin interés

También aceptamos efectivo y transferencias bancarias.`
      },
      
      productos: {
        titulo: 'Productos y Servicios',
        descripcion: `📚 Productos y Servicios - Librería Veo Veo:

Contamos con:
• Libros de literatura infantil y juvenil
• Libros educativos y escolares
• Libros de texto
• Material didáctico
• Artículos de librería

📖 LIBROS DE INGLÉS:
Los libros de inglés escolares se trabajan a pedido con seña.
Para consultar disponibilidad y realizar tu pedido especial, contactate con un asesor:
https://wa.me/5493794732177?text=Hola,%20estoy%20interesado%20en%20libros%20de%20inglés%20a%20pedido

🛒 COMPRAS ONLINE:
Podés buscar libros en nuestro catálogo y comprar directamente por WhatsApp.
Aceptamos todos los medios de pago mencionados.`
      },
      
      politicas: {
        titulo: 'Políticas de Envío y Devolución',
        descripcion: `📦 Políticas de Envío y Devolución:

ENVÍOS:
• Retiro en local: Sin cargo (Corrientes Capital)
• Envío a domicilio: Consultá costo según tu ubicación
• Envíos al interior: A través de correo o transporte

DEVOLUCIONES:
• Aceptamos devoluciones dentro de los 10 días de recibido el producto
• El producto debe estar en perfectas condiciones
• Se debe presentar el comprobante de compra

Para más información sobre envíos o devoluciones, consultá con un asesor.`
      },
      
      empresa: {
        titulo: 'Información de la Empresa',
        descripcion: `🏢 Librería Veo Veo - Corrientes

Somos una librería especializada en literatura infantil y juvenil, material educativo y libros escolares.

📍 Ubicación: Corrientes Capital
📞 Contacto: WhatsApp
🌐 Web: www.veoveolibros.com.ar

Nuestro objetivo es acercar la lectura a niños y jóvenes, ofreciendo una amplia variedad de títulos y un servicio personalizado.

¡Gracias por elegirnos! 📚✨`
      }
    };
    
    // Actualizar flow con tópicos
    await flowsCollection.updateOne(
      { _id: flow._id },
      { $set: { topicos } }
    );
    
    console.log('✅ Tópicos creados exitosamente:\n');
    Object.keys(topicos).forEach(key => {
      console.log(`   📚 ${key}: ${topicos[key].titulo}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearTopicos();
