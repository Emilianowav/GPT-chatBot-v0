import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

async function actualizarTopicosVeoVeo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ 
      empresaId: 'Veo Veo', 
      nombre: 'WooCommerce Flow' 
    });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo');
      return;
    }

    console.log('📚 ACTUALIZANDO TÓPICOS DE VEO VEO CON INFORMACIÓN CORRECTA\n');
    console.log('═'.repeat(70));

    // Tópicos correctos según documentación
    const topicosCorrectos = {
      empresa: {
        nombre: 'Librería Veo Veo',
        ubicacion: 'Corrientes Capital',
        whatsapp: '5493794732177',
        whatsapp_link: 'https://wa.me/5493794732177',
        web: 'www.veoveolibros.com.ar',
        descripcion: 'Librería especializada en literatura infantil y juvenil, material educativo y libros escolares'
      },
      
      horarios: {
        lunes_viernes: '9:00 a 13:00 y 16:30 a 20:30',
        sabados: '9:00 a 13:00',
        domingos: 'Cerrado',
        descripcion: 'Lunes a Viernes de 9:00 a 13:00 y de 16:30 a 20:30. Sábados de 9:00 a 13:00. Domingos cerrado.'
      },
      
      tono_comunicacion: {
        estilo: 'Amigable, profesional, cercano',
        uso_emojis: true,
        tratamiento: 'vos (argentino)'
      },
      
      atencion_personalizada: {
        descripcion: 'Siempre preguntar qué busca el cliente, ofrecer alternativas, ser proactivo'
      },
      
      libros_ingles: {
        descripcion: 'Los libros de inglés escolares se trabajan a pedido con seña',
        contacto: 'https://wa.me/5493794732177?text=Hola,%20estoy%20interesado%20en%20libros%20de%20inglés%20a%20pedido',
        importante: 'Dirigir al cliente al asesor para pedidos especiales de libros de inglés'
      },
      
      politica_retiro: {
        descripcion: 'Retiro en local sin cargo',
        ubicacion: 'Corrientes Capital',
        horarios: 'Mismo horario de atención'
      },
      
      politica_envios: {
        descripcion: 'Envíos a todo el país. Costo según destino.',
        corrientes_capital: 'Consultá costo según ubicación',
        interior: 'A través de correo o transporte'
      },
      
      medios_pago: {
        descripcion: 'Aceptamos efectivo, transferencia bancaria y MercadoPago',
        banco_corrientes: {
          lunes_miercoles: '3 cuotas sin interés + 20% bonificación con app +Banco (Visa/Mastercard). Tope $20.000',
          jueves: '30% Off en 6 cuotas sin interés con Tarjeta Bonita Visa. Tope $50.000'
        },
        banco_nacion: {
          sabados: '10% reintegro + hasta 3 cuotas sin interés con MODO BNA+ (Visa/Mastercard). Tope $10.000'
        },
        banco_hipotecario: {
          todos_los_dias: '6 cuotas fijas con tarjeta de crédito',
          miercoles: '25% off con tarjeta de débito. Tope $10.000'
        },
        locred: {
          descripcion: '3 y 6 cuotas sin interés todos los días'
        },
        naranjax: {
          descripcion: 'planZ: 3 cuotas sin interés, 6 cuotas sin interés'
        },
        go_cuotas: {
          descripcion: 'Con tarjeta de Débito: hasta 3 cuotas sin interés'
        }
      },
      
      productos: {
        literatura_infantil_juvenil: 'Amplia variedad de títulos',
        libros_educativos: 'Material educativo y escolares',
        libros_texto: 'Libros de texto para todos los niveles',
        material_didactico: 'Artículos de librería y material didáctico',
        libros_ingles: 'Se trabajan a pedido con seña (contactar asesor)'
      },
      
      devoluciones: {
        plazo: '10 días desde recibido el producto',
        condiciones: 'El producto debe estar en perfectas condiciones',
        comprobante: 'Se debe presentar el comprobante de compra'
      }
    };

    // Actualizar tópicos en el flujo
    await flowsCollection.updateOne(
      { empresaId: 'Veo Veo', nombre: 'WooCommerce Flow' },
      {
        $set: {
          topicos: topicosCorrectos,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Tópicos actualizados correctamente\n');

    console.log('📋 TÓPICOS CONFIGURADOS:');
    console.log('─'.repeat(70));
    
    Object.entries(topicosCorrectos).forEach(([key, value]) => {
      console.log(`\n📚 ${key}:`);
      if (typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => {
          if (typeof v === 'object') {
            console.log(`   ${k}:`);
            Object.entries(v).forEach(([subK, subV]) => {
              console.log(`      ${subK}: ${subV}`);
            });
          } else {
            console.log(`   ${k}: ${v}`);
          }
        });
      } else {
        console.log(`   ${value}`);
      }
    });

    console.log('\n\n' + '═'.repeat(70));
    console.log('✅ ACTUALIZACIÓN COMPLETADA');
    console.log('═'.repeat(70));
    console.log('\n📝 INFORMACIÓN CLAVE:');
    console.log('');
    console.log('📍 Ubicación: Corrientes Capital');
    console.log('📞 WhatsApp: 5493794732177');
    console.log('🌐 Web: www.veoveolibros.com.ar');
    console.log('⏰ Horarios: Lun-Vie 9-13 y 16:30-20:30, Sáb 9-13');
    console.log('');
    console.log('📚 LIBROS DE INGLÉS:');
    console.log('   Se trabajan a pedido con seña');
    console.log('   Dirigir al cliente al asesor');
    console.log('');
    console.log('💳 MEDIOS DE PAGO:');
    console.log('   Efectivo, transferencia, MercadoPago');
    console.log('   Promociones bancarias configuradas');
    console.log('');
    console.log('🧪 TESTEAR:');
    console.log('   1. "¿Tienen libros de inglés?"');
    console.log('      → Debe responder que SÍ y dirigir al asesor');
    console.log('   2. "¿Dónde están ubicados?"');
    console.log('      → Debe responder Corrientes Capital');
    console.log('   3. "¿Qué horarios tienen?"');
    console.log('      → Debe dar horarios correctos');
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

actualizarTopicosVeoVeo();
