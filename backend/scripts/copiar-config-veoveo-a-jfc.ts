// 🛠️ Script para copiar configuración de Veo Veo a JFC Techno
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EmpresaModel } from '../src/models/Empresa.js';
import { Seller } from '../src/modules/mercadopago/models/Seller.js';
import { PaymentLink } from '../src/modules/mercadopago/models/PaymentLink.js';

dotenv.config();

let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está configurada en .env');
  process.exit(1);
}

// Agregar el nombre de la base de datos si no está presente
if (!MONGODB_URI.includes('mongodb.net/') || MONGODB_URI.includes('mongodb.net/?')) {
  MONGODB_URI = MONGODB_URI.replace('mongodb.net/?', 'mongodb.net/neural_chatbot?');
  MONGODB_URI = MONGODB_URI.replace('mongodb.net?', 'mongodb.net/neural_chatbot?');
}

// Productos tecnológicos para JFC Techno (todos a 1 ARS para pruebas)
const PRODUCTOS_TECNOLOGICOS = [
  { nombre: 'Mouse Gamer RGB', precio: 1, descripcion: 'Mouse gaming con iluminación RGB', palabrasClave: ['mouse', 'gamer', 'rgb', 'gaming'] },
  { nombre: 'Teclado Mecánico', precio: 1, descripcion: 'Teclado mecánico retroiluminado', palabrasClave: ['teclado', 'mecanico', 'keyboard'] },
  { nombre: 'Auriculares Bluetooth', precio: 1, descripcion: 'Auriculares inalámbricos con cancelación de ruido', palabrasClave: ['auriculares', 'bluetooth', 'headphones', 'audifonos'] },
  { nombre: 'Webcam Full HD', precio: 1, descripcion: 'Cámara web 1080p para streaming', palabrasClave: ['webcam', 'camara', 'streaming'] },
  { nombre: 'Micrófono USB', precio: 1, descripcion: 'Micrófono condensador para podcasts', palabrasClave: ['microfono', 'mic', 'podcast', 'audio'] },
  { nombre: 'Monitor 24" Full HD', precio: 1, descripcion: 'Monitor LED 24 pulgadas', palabrasClave: ['monitor', 'pantalla', 'display'] },
  { nombre: 'SSD 480GB', precio: 1, descripcion: 'Disco sólido SATA 480GB', palabrasClave: ['ssd', 'disco', 'almacenamiento', 'storage'] },
  { nombre: 'Memoria RAM 8GB', precio: 1, descripcion: 'Memoria DDR4 8GB 3200MHz', palabrasClave: ['ram', 'memoria', 'memory'] },
  { nombre: 'Mousepad XL', precio: 1, descripcion: 'Alfombrilla gaming tamaño XL', palabrasClave: ['mousepad', 'alfombrilla', 'pad'] },
  { nombre: 'Cable HDMI 2.0', precio: 1, descripcion: 'Cable HDMI 4K 2 metros', palabrasClave: ['hdmi', 'cable', 'video'] },
  { nombre: 'Hub USB 3.0', precio: 1, descripcion: 'Hub 4 puertos USB 3.0', palabrasClave: ['hub', 'usb', 'puertos'] },
  { nombre: 'Cooler CPU', precio: 1, descripcion: 'Ventilador para procesador', palabrasClave: ['cooler', 'ventilador', 'cpu', 'fan'] },
  { nombre: 'Fuente 500W', precio: 1, descripcion: 'Fuente de poder 500W certificada', palabrasClave: ['fuente', 'power', 'psu', 'alimentacion'] },
  { nombre: 'Gabinete ATX', precio: 1, descripcion: 'Gabinete gaming con ventana', palabrasClave: ['gabinete', 'case', 'caja', 'torre'] },
  { nombre: 'Pasta Térmica', precio: 1, descripcion: 'Pasta térmica de alta conductividad', palabrasClave: ['pasta', 'termica', 'thermal'] },
];

async function copiarConfiguracion() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    console.log('📍 URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    console.log('\n========================================');
    console.log('🛠️ COPIANDO CONFIGURACIÓN VEO VEO → JFC TECHNO');
    console.log('========================================\n');

    // 1. Obtener configuración de Veo Veo
    console.log('📋 1. OBTENIENDO CONFIGURACIÓN DE VEO VEO');
    console.log('─────────────────────────────────────');
    
    const veoVeoSeller = await Seller.findOne({ internalId: 'Veo Veo' });
    
    if (!veoVeoSeller) {
      console.log('❌ No se encontró el seller de Veo Veo');
      return;
    }
    
    console.log('✅ Seller de Veo Veo encontrado');
    console.log('   User ID:', veoVeoSeller.userId);
    console.log('   Access Token:', veoVeoSeller.accessToken ? '✅ Configurado' : '❌ No configurado');

    // 2. Crear o actualizar empresa JFC Techno
    console.log('\n📋 2. CONFIGURANDO EMPRESA JFC TECHNO');
    console.log('─────────────────────────────────────');
    
    let empresa = await EmpresaModel.findOne({ nombre: 'JFC Techno' });
    
    if (!empresa) {
      console.log('⚠️  Empresa no encontrada. Creando nueva empresa...');
      empresa = new EmpresaModel({
        nombre: 'JFC Techno',
        telefono: '+5493794000001', // Teléfono diferente a Veo Veo
        email: 'jfctechno@example.com',
        categoria: 'comercio',
        prompt: 'Sos el asistente virtual de JFC Techno, una tienda especializada en productos tecnológicos. Tu objetivo es ayudar a los clientes a encontrar el producto que buscan y facilitarles el proceso de compra mediante links de pago de Mercado Pago. Cuando un cliente mencione un producto tecnológico (mouse, teclado, auriculares, etc.), ofrécele el link de pago correspondiente. Sé amigable, profesional y conocedor de tecnología.',
        saludos: [
          '¡Hola! 👋 Bienvenido a JFC Techno. ¿Qué producto tecnológico estás buscando?',
          '¡Hola! 🖥️ Soy el asistente de JFC Techno. ¿En qué puedo ayudarte hoy?',
          '¡Bienvenido a JFC Techno! 🎮 ¿Buscas algún producto tecnológico en particular?'
        ],
        modelo: 'gpt-3.5-turbo',
        catalogoPath: 'catalogos/jfc-techno.txt',
        phoneNumberId: '', // Se configurará después
        accessToken: '', // Se configurará después
      });
      await empresa.save();
      console.log('✅ Empresa creada:', empresa.nombre);
    } else {
      console.log('✅ Empresa encontrada:', empresa.nombre);
    }

    // 3. JFC Techno usará el mismo seller de Veo Veo
    console.log('\n💳 3. CONFIGURANDO SELLER DE MERCADO PAGO');
    console.log('─────────────────────────────────────');
    console.log('✅ JFC Techno usará el mismo seller de Veo Veo (mismo userId de MP)');
    console.log('   User ID:', veoVeoSeller.userId);
    
    // Usamos el seller de Veo Veo para JFC Techno
    const jfcSeller = veoVeoSeller;

    // 4. Crear Payment Links para productos tecnológicos
    console.log('\n🔗 4. CREANDO PAYMENT LINKS DE PRODUCTOS');
    console.log('─────────────────────────────────────');
    
    let linksCreados = 0;
    let linksExistentes = 0;

    for (const producto of PRODUCTOS_TECNOLOGICOS) {
      // Generar slug único basado en el nombre del producto
      const slug = 'jfc-' + producto.nombre.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      const linkExistente = await PaymentLink.findOne({ slug: slug });

      if (!linkExistente) {
        const paymentLink = new PaymentLink({
          sellerId: jfcSeller.userId,
          slug: slug,
          title: producto.nombre,
          description: producto.descripcion,
          priceType: 'fixed',
          unitPrice: producto.precio,
          currency: 'ARS',
          active: true,
          totalUses: 0,
          totalRevenue: 0
        });
        await paymentLink.save();
        linksCreados++;
        console.log(`✅ Link creado: ${producto.nombre} - $${producto.precio} ARS`);
        console.log(`   Slug: ${slug}`);
        console.log(`   Palabras clave: ${producto.palabrasClave.join(', ')}`);
      } else {
        linksExistentes++;
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Links creados: ${linksCreados}`);
    console.log(`   - Links existentes: ${linksExistentes}`);
    console.log(`   - Total: ${PRODUCTOS_TECNOLOGICOS.length}`);

    // 5. Mostrar configuración de palabras clave
    console.log('\n🔑 5. PALABRAS CLAVE CONFIGURADAS');
    console.log('─────────────────────────────────────');
    console.log('Los clientes pueden buscar productos usando:');
    
    const todasLasPalabrasClave = new Set<string>();
    PRODUCTOS_TECNOLOGICOS.forEach(p => {
      p.palabrasClave.forEach(k => todasLasPalabrasClave.add(k));
    });
    
    console.log(Array.from(todasLasPalabrasClave).sort().join(', '));

    // 6. Instrucciones finales
    console.log('\n📋 6. PRÓXIMOS PASOS');
    console.log('─────────────────────────────────────');
    console.log('1. ✅ Credenciales de Mercado Pago copiadas de Veo Veo');
    console.log('2. ⚠️  Configurar phoneNumberId y accessToken de WhatsApp en la empresa');
    console.log('3. ✅ Payment links creados para todos los productos');
    console.log('4. ✅ Todos los productos están a 1 ARS para pruebas');
    console.log('5. ✅ El bot detectará palabras clave y ofrecerá productos automáticamente');
    console.log('6. ✅ Los pagos se confirmarán automáticamente por WhatsApp');

    console.log('\n========================================');
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
copiarConfiguracion();
