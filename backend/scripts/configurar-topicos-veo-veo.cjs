const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function configurarTopicosVeoVeo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📚 CONFIGURAR TÓPICOS DE CONOCIMIENTO - VEO VEO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Tópicos de conocimiento base de Veo Veo
    const topicos = {
      empresa: {
        nombre: "Librería Veo Veo",
        ubicacion: "San Juan 1037, Corrientes Capital",
        whatsapp: "5493794732177",
        whatsapp_link: "https://wa.me/5493794732177"
      },
      horarios: {
        lunes_viernes: "8:30-12:00 y 17:00-21:00",
        sabados: "9:00-13:00 y 17:00-21:00",
        domingos: "Cerrado",
        descripcion: "Atendemos de Lunes a Viernes de 8:30 a 12:00 y de 17:00 a 21:00. Sábados de 9:00 a 13:00 y de 17:00 a 21:00. Domingos cerrado."
      },
      productos: {
        categorias: [
          "Libros escolares",
          "Libros de inglés (solo a pedido)",
          "Útiles escolares",
          "Material didáctico"
        ],
        libros_ingles: {
          disponibilidad: "Solo a pedido con seña del 50%",
          tiempo_entrega: "7-15 días hábiles",
          descripcion: "Los libros de inglés se traen a pedido. Necesitamos una seña del 50% y el tiempo de entrega es de 7 a 15 días hábiles."
        }
      },
      medios_pago: {
        efectivo: "Aceptamos efectivo en el local",
        transferencia: "Transferencia bancaria",
        mercadopago: "Pago online con Mercado Pago (tarjetas de crédito y débito)",
        promociones: {
          banco_corrientes: "Lunes y Miércoles: 3 cuotas sin interés + 20% bonificación",
          banco_nacion: "Sábados: 10% reintegro + 3 cuotas sin interés"
        },
        descripcion: "Aceptamos efectivo, transferencia bancaria y Mercado Pago. Tenemos promociones con Banco Corrientes (Lunes y Miércoles: 3 cuotas sin interés + 20% bonificación) y Banco Nación (Sábados: 10% reintegro + 3 cuotas sin interés)."
      },
      politicas: {
        retiro: "24 horas después de confirmado el pago",
        envios: "A cargo del cliente, cotización con asesor",
        devoluciones: "Cambio por otro libro o nota de crédito",
        descripcion: "El retiro es 24 horas después de confirmado el pago. Los envíos son a cargo del cliente (cotización con asesor). Las devoluciones se hacen por cambio de libro o nota de crédito."
      }
    };
    
    // Actualizar el flujo con los tópicos
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          'config.topicos': topicos,
          'config.topicos_habilitados': true
        } 
      }
    );
    
    console.log(`✅ Tópicos configurados: ${result.modifiedCount} cambio(s)\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 TÓPICOS CONFIGURADOS:\n');
    
    console.log('1. 🏢 EMPRESA');
    console.log(`   - Nombre: ${topicos.empresa.nombre}`);
    console.log(`   - Ubicación: ${topicos.empresa.ubicacion}`);
    console.log(`   - WhatsApp: ${topicos.empresa.whatsapp}`);
    
    console.log('\n2. 🕐 HORARIOS');
    console.log(`   - Lun-Vie: ${topicos.horarios.lunes_viernes}`);
    console.log(`   - Sábados: ${topicos.horarios.sabados}`);
    console.log(`   - Domingos: ${topicos.horarios.domingos}`);
    
    console.log('\n3. 📚 PRODUCTOS');
    console.log(`   - Categorías: ${topicos.productos.categorias.join(', ')}`);
    console.log(`   - Libros de inglés: ${topicos.productos.libros_ingles.disponibilidad}`);
    
    console.log('\n4. 💳 MEDIOS DE PAGO');
    console.log(`   - Efectivo, Transferencia, Mercado Pago`);
    console.log(`   - Promo Banco Corrientes: ${topicos.medios_pago.promociones.banco_corrientes}`);
    console.log(`   - Promo Banco Nación: ${topicos.medios_pago.promociones.banco_nacion}`);
    
    console.log('\n5. 📦 POLÍTICAS');
    console.log(`   - Retiro: ${topicos.politicas.retiro}`);
    console.log(`   - Envíos: ${topicos.politicas.envios}`);
    console.log(`   - Devoluciones: ${topicos.politicas.devoluciones}`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ TÓPICOS DISPONIBLES EN EL FLUJO\n');
    console.log('Los GPT ahora pueden acceder a esta información mediante:');
    console.log('  {{topicos.horarios.descripcion}}');
    console.log('  {{topicos.medios_pago.descripcion}}');
    console.log('  {{topicos.productos.libros_ingles.descripcion}}');
    console.log('  etc.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configurarTopicosVeoVeo();
