// 🛠️ Script para configurar JFC Techno - Tienda de tecnología
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EmpresaModel } from '../src/models/Empresa.js';
import { Seller } from '../src/modules/mercadopago/models/Seller.js';
import { PaymentLink } from '../src/modules/mercadopago/models/PaymentLink.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

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

async function configurarJFCTechno() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    console.log('\n========================================');
    console.log('🛠️ CONFIGURACIÓN JFC TECHNO');
    console.log('========================================\n');

    // 1. Buscar o crear empresa JFC Techno
    console.log('📋 1. CONFIGURANDO EMPRESA');
    console.log('─────────────────────────────────────');
    
    let empresa = await EmpresaModel.findOne({ nombre: 'JFC Techno' });
    
    if (!empresa) {
      console.log('⚠️  Empresa no encontrada. Creando nueva empresa...');
      empresa = new EmpresaModel({
        nombre: 'JFC Techno',
        telefono: '+5493794000000', // Teléfono temporal
        email: 'jfctechno@example.com',
        categoria: 'comercio',
        prompt: 'Sos el asistente virtual de JFC Techno, una tienda especializada en productos tecnológicos. Tu objetivo es ayudar a los clientes a encontrar el producto que buscan y facilitarles el proceso de compra mediante links de pago de Mercado Pago. Sé amigable, profesional y conocedor de tecnología.',
        saludos: [
          '¡Hola! 👋 Bienvenido a JFC Techno. ¿Qué producto tecnológico estás buscando?',
          '¡Hola! 🖥️ Soy el asistente de JFC Techno. ¿En qué puedo ayudarte hoy?',
          '¡Bienvenido a JFC Techno! 🎮 ¿Buscas algún producto tecnológico en particular?'
        ],
        modelo: 'gpt-3.5-turbo',
        catalogoPath: 'catalogos/jfc-techno.txt', // Catálogo de productos
        phoneNumberId: '', // Se configurará después
        accessToken: '', // Se configurará después
      });
      await empresa.save();
      console.log('✅ Empresa creada:', empresa.nombre);
    } else {
      console.log('✅ Empresa encontrada:', empresa.nombre);
    }

    // 2. Configurar Seller de Mercado Pago
    console.log('\n💳 2. CONFIGURANDO SELLER DE MERCADO PAGO');
    console.log('─────────────────────────────────────');
    
    let seller = await Seller.findOne({ internalId: 'JFC Techno' });
    
    if (!seller) {
      console.log('⚠️  Seller no encontrado. Creando nuevo seller...');
      console.log('⚠️  IMPORTANTE: Debes configurar manualmente:');
      console.log('   - mpUserId (ID de usuario de Mercado Pago)');
      console.log('   - accessToken (Token de acceso de MP)');
      console.log('   - refreshToken (Token de refresco de MP)');
      
      seller = new Seller({
        userId: '0', // Debe configurarse manualmente
        internalId: 'JFC Techno',
        email: 'jfctechno@example.com',
        accessToken: '', // Debe configurarse manualmente
        refreshToken: '', // Debe configurarse manualmente
        publicKey: '',
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 días
      });
      await seller.save();
      console.log('⚠️  Seller creado (requiere configuración manual)');
    } else {
      console.log('✅ Seller encontrado:', seller.internalId);
      console.log('   MP User ID:', seller.userId);
      console.log('   Access Token:', seller.accessToken ? '✅ Configurado' : '❌ No configurado');
    }

    // 3. Crear Payment Links para productos tecnológicos
    console.log('\n🔗 3. CREANDO PAYMENT LINKS DE PRODUCTOS');
    console.log('─────────────────────────────────────');
    
    let linksCreados = 0;
    let linksExistentes = 0;

    for (const producto of PRODUCTOS_TECNOLOGICOS) {
      // Generar slug único basado en el nombre del producto
      const slug = producto.nombre.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      const linkExistente = await PaymentLink.findOne({
        sellerId: seller.userId,
        slug: slug
      });

      if (!linkExistente) {
        const paymentLink = new PaymentLink({
          sellerId: seller.userId,
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

    // 4. Mostrar configuración de palabras clave
    console.log('\n🔑 4. PALABRAS CLAVE CONFIGURADAS');
    console.log('─────────────────────────────────────');
    console.log('Los clientes pueden buscar productos usando:');
    
    const todasLasPalabrasClave = new Set<string>();
    PRODUCTOS_TECNOLOGICOS.forEach(p => {
      p.palabrasClave.forEach(k => todasLasPalabrasClave.add(k));
    });
    
    console.log(Array.from(todasLasPalabrasClave).sort().join(', '));

    // 5. Instrucciones finales
    console.log('\n📋 5. PRÓXIMOS PASOS');
    console.log('─────────────────────────────────────');
    console.log('1. Configurar credenciales de Mercado Pago en el seller');
    console.log('2. Configurar phoneNumberId y accessToken de WhatsApp en la empresa');
    console.log('3. El bot detectará automáticamente las palabras clave y ofrecerá productos');
    console.log('4. Los pagos se confirmarán automáticamente por WhatsApp');
    console.log('5. Todos los productos están a 1 ARS para pruebas');

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
configurarJFCTechno();
