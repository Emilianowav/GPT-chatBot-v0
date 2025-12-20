/**
 * Script de Onboarding: JFC Techno
 * Tienda de tecnología con integración de Mercado Pago
 * 
 * Ejecutar: npx ts-node scripts/setup-jfc-techno.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const EMPRESA_ID = 'jfc_techno';
const EMPRESA_NOMBRE = 'JFC Techno';
const TELEFONO = '5493794000000';
const EMAIL = 'contacto@jfctechno.com';

const ADMIN_USERNAME = 'admin_jfc';
const ADMIN_PASSWORD = 'jfc2024!';
const ADMIN_EMAIL = 'admin@jfctechno.com';

const PROMPT_SISTEMA = `Sos el asistente virtual de JFC Techno, una tienda especializada en productos tecnológicos de alta calidad.

🎯 TU MISIÓN:
Ayudar a los clientes a encontrar el producto tecnológico que necesitan y facilitarles el proceso de compra mediante links de pago de Mercado Pago.

🏪 SOBRE JFC TECHNO:
Somos una tienda de tecnología que ofrece:
- Periféricos gaming (mouse, teclados, auriculares)
- Componentes de PC (RAM, SSD, fuentes, coolers)
- Accesorios (cables, hubs, mousepad)
- Productos de streaming (webcams, micrófonos)
- Monitores y pantallas

💡 PRODUCTOS DESTACADOS:
- Mouse Gamer RGB
- Teclado Mecánico retroiluminado
- Auriculares Bluetooth con cancelación de ruido
- Webcam Full HD para streaming
- Micrófono USB condensador
- Monitor 24" Full HD
- SSD 480GB
- Memoria RAM 8GB DDR4
- Mousepad XL gaming
- Cable HDMI 2.0
- Hub USB 3.0
- Cooler CPU
- Fuente 500W certificada
- Gabinete ATX gaming
- Pasta Térmica

🎯 TU ESTILO:
- Sé amigable, profesional y conocedor de tecnología
- Ayuda al cliente a encontrar el producto que busca
- Ofrece alternativas cuando sea apropiado
- Facilita el proceso de compra con links de pago
- Responde en español argentino
- Usa emojis de forma moderada para hacer la conversación más amena

💳 PROCESO DE COMPRA:
Cuando un cliente esté interesado en un producto:
1. Confirma el producto y sus características
2. Ofrece el link de pago de Mercado Pago
3. Explica que el pago es seguro y procesado por MP
4. Indica que recibirá confirmación por WhatsApp una vez completado el pago

📞 CONTACTO:
Para consultas adicionales: ${TELEFONO}
Email: ${EMAIL}`;

const PRODUCTOS_TECNOLOGICOS = [
  { 
    nombre: 'Mouse Gamer RGB', 
    precio: 1, 
    descripcion: 'Mouse gaming con iluminación RGB personalizable, 7 botones programables y sensor óptico de alta precisión',
    palabrasClave: ['mouse', 'gamer', 'rgb', 'gaming', 'raton']
  },
  { 
    nombre: 'Teclado Mecánico', 
    precio: 1, 
    descripcion: 'Teclado mecánico retroiluminado con switches mecánicos y diseño compacto',
    palabrasClave: ['teclado', 'mecanico', 'keyboard', 'switches']
  },
  { 
    nombre: 'Auriculares Bluetooth', 
    precio: 1, 
    descripcion: 'Auriculares inalámbricos con cancelación de ruido activa y 30 horas de batería',
    palabrasClave: ['auriculares', 'bluetooth', 'headphones', 'audifonos', 'inalambricos']
  },
  { 
    nombre: 'Webcam Full HD', 
    precio: 1, 
    descripcion: 'Cámara web 1080p 60fps ideal para streaming y videollamadas',
    palabrasClave: ['webcam', 'camara', 'streaming', 'video']
  },
  { 
    nombre: 'Micrófono USB', 
    precio: 1, 
    descripcion: 'Micrófono condensador USB profesional para podcasts y streaming',
    palabrasClave: ['microfono', 'mic', 'podcast', 'audio', 'usb']
  },
  { 
    nombre: 'Monitor 24" Full HD', 
    precio: 1, 
    descripcion: 'Monitor LED 24 pulgadas Full HD 75Hz con panel IPS',
    palabrasClave: ['monitor', 'pantalla', 'display', 'led']
  },
  { 
    nombre: 'SSD 480GB', 
    precio: 1, 
    descripcion: 'Disco sólido SATA III 480GB con velocidades de lectura hasta 550MB/s',
    palabrasClave: ['ssd', 'disco', 'almacenamiento', 'storage', 'solido']
  },
  { 
    nombre: 'Memoria RAM 8GB', 
    precio: 1, 
    descripcion: 'Memoria DDR4 8GB 3200MHz para gaming y multitarea',
    palabrasClave: ['ram', 'memoria', 'memory', 'ddr4']
  },
  { 
    nombre: 'Mousepad XL', 
    precio: 1, 
    descripcion: 'Alfombrilla gaming tamaño XL con superficie de control y base antideslizante',
    palabrasClave: ['mousepad', 'alfombrilla', 'pad', 'gaming']
  },
  { 
    nombre: 'Cable HDMI 2.0', 
    precio: 1, 
    descripcion: 'Cable HDMI 2.0 de 2 metros compatible con 4K 60Hz',
    palabrasClave: ['hdmi', 'cable', 'video', '4k']
  },
  { 
    nombre: 'Hub USB 3.0', 
    precio: 1, 
    descripcion: 'Hub 4 puertos USB 3.0 con velocidades de transferencia hasta 5Gbps',
    palabrasClave: ['hub', 'usb', 'puertos', 'adaptador']
  },
  { 
    nombre: 'Cooler CPU', 
    precio: 1, 
    descripcion: 'Ventilador para procesador con disipador de aluminio y ventilador de 120mm',
    palabrasClave: ['cooler', 'ventilador', 'cpu', 'fan', 'disipador']
  },
  { 
    nombre: 'Fuente 500W', 
    precio: 1, 
    descripcion: 'Fuente de poder 500W 80 Plus certificada con protecciones múltiples',
    palabrasClave: ['fuente', 'power', 'psu', 'alimentacion', 'watts']
  },
  { 
    nombre: 'Gabinete ATX', 
    precio: 1, 
    descripcion: 'Gabinete gaming ATX con ventana de vidrio templado y soporte para 6 ventiladores',
    palabrasClave: ['gabinete', 'case', 'caja', 'torre', 'atx']
  },
  { 
    nombre: 'Pasta Térmica', 
    precio: 1, 
    descripcion: 'Pasta térmica de alta conductividad para CPU y GPU',
    palabrasClave: ['pasta', 'termica', 'thermal', 'cpu']
  },
];

async function setup() {
  try {
    console.log('🚀 Iniciando onboarding de JFC Techno...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // 1. Crear empresa
    console.log('📦 Creando empresa JFC Techno...');
    const empresasCollection = db.collection('empresas');
    
    const empresaExistente = await empresasCollection.findOne({ nombre: EMPRESA_NOMBRE });
    if (empresaExistente) {
      console.log('⚠️  La empresa ya existe, actualizando...');
      await empresasCollection.updateOne(
        { nombre: EMPRESA_NOMBRE },
        {
          $set: {
            telefono: TELEFONO,
            email: EMAIL,
            categoria: 'comercio',
            modelo: 'gpt-3.5-turbo',
            prompt: PROMPT_SISTEMA,
            catalogoPath: 'catalogos/jfc-techno.txt',
            modulos: [
              { id: 'conversaciones', nombre: 'Conversaciones', activo: true },
              { id: 'clientes', nombre: 'Clientes', activo: true },
              { id: 'productos', nombre: 'Productos', activo: true },
              { id: 'mercadopago', nombre: 'Mercado Pago', activo: true },
              { id: 'estadisticas', nombre: 'Estadísticas', activo: true },
              { id: 'configuracion', nombre: 'Configuración', activo: true }
            ],
            saludos: [
              '¡Hola! 👋 Bienvenido a JFC Techno. ¿Qué producto tecnológico estás buscando?',
              '¡Hola! 🖥️ Soy el asistente de JFC Techno. ¿En qué puedo ayudarte hoy?',
              '¡Bienvenido a JFC Techno! 🎮 ¿Buscás algún producto tecnológico en particular?'
            ],
            updatedAt: new Date()
          }
        }
      );
    } else {
      await empresasCollection.insertOne({
        nombre: EMPRESA_NOMBRE,
        telefono: TELEFONO,
        email: EMAIL,
        categoria: 'comercio',
        modelo: 'gpt-3.5-turbo',
        prompt: PROMPT_SISTEMA,
        catalogoPath: 'catalogos/jfc-techno.txt',
        phoneNumberId: '',
        accessToken: '',
        modulos: [
          { id: 'conversaciones', nombre: 'Conversaciones', activo: true },
          { id: 'clientes', nombre: 'Clientes', activo: true },
          { id: 'productos', nombre: 'Productos', activo: true },
          { id: 'mercadopago', nombre: 'Mercado Pago', activo: true },
          { id: 'estadisticas', nombre: 'Estadísticas', activo: true },
          { id: 'configuracion', nombre: 'Configuración', activo: true }
        ],
        saludos: [
          '¡Hola! 👋 Bienvenido a JFC Techno. ¿Qué producto tecnológico estás buscando?',
          '¡Hola! 🖥️ Soy el asistente de JFC Techno. ¿En qué puedo ayudarte hoy?',
          '¡Bienvenido a JFC Techno! 🎮 ¿Buscás algún producto tecnológico en particular?'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Empresa creada/actualizada\n');

    // 2. Crear Seller de Mercado Pago
    console.log('💳 Creando seller de Mercado Pago...');
    const sellersCollection = db.collection('sellers');
    
    const sellerExistente = await sellersCollection.findOne({ internalId: EMPRESA_NOMBRE });
    if (sellerExistente) {
      console.log('⚠️  Seller ya existe');
    } else {
      await sellersCollection.insertOne({
        userId: '0',
        internalId: EMPRESA_NOMBRE,
        email: EMAIL,
        accessToken: '',
        refreshToken: '',
        publicKey: '',
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        active: false,
        connectedAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Seller creado (requiere configuración manual de credenciales MP)');
    }

    // 3. Crear Payment Links para productos
    console.log('\n🔗 Creando payment links de productos...');
    const paymentLinksCollection = db.collection('paymentlinks');
    
    let linksCreados = 0;
    let linksExistentes = 0;

    for (const producto of PRODUCTOS_TECNOLOGICOS) {
      const slug = producto.nombre.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      const linkExistente = await paymentLinksCollection.findOne({
        sellerId: '0',
        slug: slug
      });

      if (!linkExistente) {
        await paymentLinksCollection.insertOne({
          sellerId: '0',
          slug: slug,
          title: producto.nombre,
          description: producto.descripcion,
          priceType: 'fixed',
          unitPrice: producto.precio,
          currency: 'ARS',
          active: true,
          totalUses: 0,
          totalRevenue: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        linksCreados++;
        console.log(`✅ Link creado: ${producto.nombre} - $${producto.precio} ARS`);
      } else {
        linksExistentes++;
      }
    }

    console.log(`\n📊 Resumen de payment links:`);
    console.log(`   - Links creados: ${linksCreados}`);
    console.log(`   - Links existentes: ${linksExistentes}`);
    console.log(`   - Total: ${PRODUCTOS_TECNOLOGICOS.length}`);

    // 4. Crear usuario administrador
    console.log('\n👤 Creando usuario administrador...');
    const usuariosCollection = db.collection('admin_users');
    
    const usuarioExistente = await usuariosCollection.findOne({ 
      username: ADMIN_USERNAME.toLowerCase() 
    });
    
    if (usuarioExistente) {
      console.log('⚠️  El usuario admin ya existe, eliminando y recreando...');
      await usuariosCollection.deleteOne({ username: ADMIN_USERNAME.toLowerCase() });
    }

    const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, 10);
    
    await usuariosCollection.insertOne({
      username: ADMIN_USERNAME.toLowerCase(),
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      empresaId: EMPRESA_NOMBRE,
      role: 'admin',
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Usuario administrador creado\n');

    // 5. Mostrar palabras clave configuradas
    console.log('🔑 PALABRAS CLAVE CONFIGURADAS:');
    console.log('─────────────────────────────────────');
    const todasLasPalabrasClave = new Set<string>();
    PRODUCTOS_TECNOLOGICOS.forEach(p => {
      p.palabrasClave.forEach(k => todasLasPalabrasClave.add(k));
    });
    console.log(Array.from(todasLasPalabrasClave).sort().join(', '));

    // Resumen
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ONBOARDING COMPLETADO: JFC Techno');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 DATOS DE LA EMPRESA:');
    console.log(`   Nombre: ${EMPRESA_NOMBRE}`);
    console.log(`   ID: ${EMPRESA_ID}`);
    console.log(`   Teléfono: ${TELEFONO}`);
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Categoría: Comercio (Tienda de Tecnología)`);
    console.log(`   Modelo: GPT-3.5-turbo`);
    console.log(`   Productos: ${PRODUCTOS_TECNOLOGICOS.length} productos tecnológicos`);
    console.log('');
    console.log('🔐 CREDENCIALES DE ACCESO:');
    console.log(`   Usuario: ${ADMIN_USERNAME}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    console.log(`   URL: http://localhost:3001/login`);
    console.log('');
    console.log('💳 MERCADO PAGO:');
    console.log('   Seller creado (requiere configuración)');
    console.log('   Payment Links: Todos los productos tienen links de pago');
    console.log('   Precio de prueba: $1 ARS por producto');
    console.log('');
    console.log('⚠️  PRÓXIMOS PASOS:');
    console.log('   1. Configurar credenciales de WhatsApp Business API');
    console.log('   2. Conectar cuenta de Mercado Pago del vendedor (OAuth)');
    console.log('   3. Actualizar precios reales de productos');
    console.log('   4. Verificar que el bot detecta palabras clave y ofrece productos');
    console.log('   5. Probar flujo completo de compra con Mercado Pago');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error durante el onboarding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

setup();
