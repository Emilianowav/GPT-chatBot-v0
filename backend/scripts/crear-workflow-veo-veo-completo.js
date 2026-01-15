import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearWorkflowCompleto() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('🔄 Creando workflow completo de Veo Veo...\n');

    const workflowCompleto = {
      id: 'veo-veo-atencion-completa',
      nombre: 'Veo Veo - Atención Completa',
      activo: true,
      trigger: {
        tipo: 'keyword',
        keywords: ['hola', 'menu', 'inicio', 'ayuda', 'consulta']
      },
      mensajeInicial: 'Hola 👋\n¡Bienvenido/a a Librería Veo Veo! 📚✏️\nEstamos para ayudarte.',
      configPago: {
        seña: 1,
        porcentajeSeña: 1,
        tiempoExpiracion: 15,
        moneda: 'ARS'
      },
      steps: [
        // PASO 1: Menú principal
        {
          orden: 1,
          nombre: 'Menú principal',
          tipo: 'recopilar',
          nombreVariable: 'opcion_principal',
          pregunta: '👉 Por favor, elegí una opción:\n\n1️⃣ Consultar por libros escolares u otros títulos\n2️⃣ Libros de Inglés\n3️⃣ Atención post venta\n4️⃣ Información del local\n5️⃣ Promociones vigentes\n6️⃣ Atención personalizada\n\nEscribí el número',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4', '5', '6'],
            mapeo: {
              '1': 'consultar_libros',
              '2': 'libros_ingles',
              '3': 'post_venta',
              '4': 'info_local',
              '5': 'promociones',
              '6': 'atencion_personalizada'
            }
          }
        },

        // ============================================
        // OPCIÓN 1: CONSULTAR LIBROS ESCOLARES
        // ============================================
        
        // PASO 2: Solicitar título
        {
          orden: 2,
          nombre: 'Solicitar título',
          tipo: 'recopilar',
          nombreVariable: 'titulo',
          pregunta: '1.1: Por favor, ingrese:\n\n📖 *Título:*',
          condicion: {
            variable: 'opcion_principal',
            valor: 'consultar_libros'
          },
          validacion: {
            tipo: 'texto'
          }
        },
        
        // PASO 3: Solicitar editorial
        {
          orden: 3,
          nombre: 'Solicitar editorial',
          tipo: 'recopilar',
          nombreVariable: 'editorial',
          pregunta: '📚 *Editorial:*\n\n(Escribí "omitir" si no sabés)',
          condicion: {
            variable: 'opcion_principal',
            valor: 'consultar_libros'
          },
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        
        // PASO 4: Solicitar edición
        {
          orden: 4,
          nombre: 'Solicitar edición',
          tipo: 'recopilar',
          nombreVariable: 'edicion',
          pregunta: '📝 *Edición:*\n\n(Escribí "omitir" si no sabés)',
          condicion: {
            variable: 'opcion_principal',
            valor: 'consultar_libros'
          },
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        
        // PASO 5: Solicitar número de libro
        {
          orden: 5,
          nombre: 'Solicitar número de libro',
          tipo: 'recopilar',
          nombreVariable: 'numero_libro',
          pregunta: '🔢 *Número del libro en caso de que tenga:*\n\n(Escribí "omitir" si no tenés)\n\n⚠️ *No enviar fotografía de libros, únicamente por escrito*',
          condicion: {
            variable: 'opcion_principal',
            valor: 'consultar_libros'
          },
          validacion: {
            tipo: 'texto',
            opcional: true
          }
        },
        
        // PASO 6: Buscar productos
        {
          orden: 6,
          nombre: 'Buscar productos',
          tipo: 'consulta_filtrada',
          nombreVariable: 'productos_encontrados',
          pregunta: '🔍 Buscando libros...\n\n📚 *Resultados:*\n\n{{opciones}}\n\n¿Cuál libro te interesa?\nEscribí el número',
          condicion: {
            variable: 'opcion_principal',
            valor: 'consultar_libros'
          },
          endpointId: 'buscar-productos',
          parametros: {
            query: {
              search: '{{titulo}}',
              per_page: 10,
              status: 'publish'
            }
          },
          endpointResponseConfig: {
            idField: 'id',
            displayField: 'name',
            priceField: 'price',
            stockField: 'stock_quantity',
            imageField: 'images[0].src'
          },
          validacion: {
            tipo: 'numero',
            min: 1,
            max: 10
          }
        },
        
        // PASO 7: Verificar stock y mostrar info
        {
          orden: 7,
          nombre: 'Información del producto',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_principal',
            valor: 'consultar_libros'
          },
          mensaje: 'Perfecto 😊\n📘 {{producto_nombre}}\n\n💰 Precio: ${{producto_precio}}\n🎁 Promociones vigentes: 20% OFF en efectivo o transferencia, las promociones con tarjetas se aplican de forma física en el local\n\n{{mensaje_stock}}'
        },

        // ============================================
        // OPCIÓN 2: LIBROS DE INGLÉS
        // ============================================
        
        {
          orden: 8,
          nombre: 'Libros de Inglés',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_principal',
            valor: 'libros_ingles'
          },
          mensaje: '📚 *Libros de Inglés*\n\nLos libros de inglés se realizan únicamente a pedido con seña.\n\nPara realizar su pedido, comunicarse con nuestros asesores de venta directos:\n\n👉 https://wa.me/5493794057297?text=Hola%20busco%20un%20libro%20de%20ingles%20a%20pedido'
        },

        // ============================================
        // OPCIÓN 3: ATENCIÓN POST VENTA
        // ============================================
        
        {
          orden: 9,
          nombre: 'Menú post venta',
          tipo: 'recopilar',
          nombreVariable: 'opcion_post_venta',
          pregunta: '📦 *Atención post venta*\n\nElegí una opción:\n\n1️⃣ Compré mi libro y quiero retirarlo\n2️⃣ Compré un libro por error\n3️⃣ El libro que compré tiene fallas de fábrica\n4️⃣ Compré un libro y quiero que me lo envíen\n5️⃣ Consultar estado de una compra\n\nEscribí el número',
          condicion: {
            variable: 'opcion_principal',
            valor: 'post_venta'
          },
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4', '5']
          }
        },
        
        // Post venta - Opción 1: Retiro
        {
          orden: 10,
          nombre: 'Info retiro',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_post_venta',
            valor: '1'
          },
          mensaje: '📍 *Retiro de tu libro*\n\nPodés retirar tu libro por:\n📍 San Juan 1037\n\n🕗 Horario de atención:\n• 8:30 a 12:00hs\n• 17:00 a 21:00hs\n\n⏰ Podés retirar tu libro después de las 24hs de realizada la compra para que podamos corroborar y preparar tu pedido.\n\n📦 En el caso de querer recibirlo vía envío comunicate con nuestros asesores de venta.'
        },
        
        // Post venta - Opción 2: Compra por error
        {
          orden: 11,
          nombre: 'Info compra por error',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_post_venta',
            valor: '2'
          },
          mensaje: '😔 *Compra por error*\n\n¡Uy, qué mal! Para resolverlo te brindamos algunas opciones:\n\n✏️ Después de corroborar que el libro comprado está en el mismo estado en el cual lo recibiste, y con tu recibo de compra en mano:\n\n• Podemos enviarte una nota de crédito con el monto del libro para que elijas lo que quieras de nuestra tienda\n• Podés cambiar el libro en el momento por otro del mismo valor\n• También podés elegir uno de mayor valor y abonar la diferencia\n• O uno de menor valor y te entregamos una nota de crédito por la diferencia\n\n📍 Para completar la gestión acercate a nuestro local en San Juan 1037.'
        },
        
        // Post venta - Opción 3: Fallas de fábrica
        {
          orden: 12,
          nombre: 'Info fallas de fábrica',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_post_venta',
            valor: '3'
          },
          mensaje: '🔧 *Fallas de fábrica*\n\nEsto no es común pero suele suceder. Hay fallas que se escapan de nuestras manos, por lo cual siempre sugerimos que luego de realizar la compra se debe revisar el producto.\n\nTe recomendamos acercarte al local con:\n• 📖 Libro en mano en buenas condiciones (Sin forrar o intervenir en el mismo)\n• 🧾 Tu recibo o ticket\n\n📍 San Juan 1037'
        },
        
        // Post venta - Opción 4: Envío
        {
          orden: 13,
          nombre: 'Info envío',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_post_venta',
            valor: '4'
          },
          mensaje: '📦 *Envío de tu compra*\n\nLos envíos son a cargo del cliente.\n\nSi querés cotización de envío dentro de la ciudad de Corrientes, comunicate con nuestros asesores de venta:\n\n👉 https://wa.me/5493794057297?text=Hola%20quiero%20cotizar%20un%20envio\n\nEnviá:\n• Nombre completo\n• Ubicación\n• Recibo de compra'
        },
        
        // Post venta - Opción 5: Estado de compra
        {
          orden: 14,
          nombre: 'Info estado de compra',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_post_venta',
            valor: '5'
          },
          mensaje: '📊 *Estado de tu compra*\n\nPara consultar el estado de tu compra, comunicate con nuestros asesores:\n\n👉 https://wa.me/5493794057297?text=Hola%20quiero%20consultar%20el%20estado%20de%20mi%20compra\n\nTené a mano tu número de pedido o recibo.'
        },

        // ============================================
        // OPCIÓN 4: INFORMACIÓN DEL LOCAL
        // ============================================
        
        {
          orden: 15,
          nombre: 'Información del local',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_principal',
            valor: 'info_local'
          },
          mensaje: '🏪 *Información del local*\n\n📍 Dirección: San Juan 1037, Corrientes Capital\n\n🕗 Horarios de atención:\n• Lunes a Viernes: 8:30 a 12:00hs y 17:00 a 21:00hs\n• Sábados: [Horario]\n\n📞 Contacto:\n• WhatsApp: +54 9 3794 05-7297\n\n¿En qué más puedo ayudarte?'
        },

        // ============================================
        // OPCIÓN 5: PROMOCIONES VIGENTES
        // ============================================
        
        {
          orden: 16,
          nombre: 'Promociones vigentes',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_principal',
            valor: 'promociones'
          },
          mensaje: '🎁 *Promociones vigentes*\n\n⚠️ LEER CON ATENCIÓN\n\n*Banco de Corrientes:*\n👉 Lunes y Miércoles: 3 cuotas sin interés y 20% de bonificación\nÚnicamente con la app +Banco, con tarjetas de crédito Visa y Mastercard vinculadas\nTope de reintegro $20.000\n\n👉 TODOS LOS JUEVES: 30% Off 6 cuotas sin interés\nCON TARJETA DE CRÉDITO BONITA VISA\nTope: $50.000\n\n*Banco Nación:*\n👉 Sábados: Pagando con MODO BNA+, con tarjeta de Crédito Visa o Mastercard: 10% de reintegro y hasta 3 cuotas sin interés\nTope $10.000\n\n*Banco Hipotecario:*\n👉 Todos los días: 6 cuotas fijas con tarjeta de crédito\n👉 Miércoles: 25% off con tarjeta de débito (tope de reintegro $10.000)\n\n*LOCRED:*\n👉 Todos los días: 3 y 6 cuotas sin interés\n\n*NaranjaX:*\n👉 planZ 3 cuotas sin interés\n👉 6 cuotas sin interés\n\n*Go Cuotas:*\n👉 Con tarjeta de Débito, hasta 3 cuotas sin interés\nPara acceder registrate en https://www.gocuotas.com/\n\n📌 Recordamos que las promociones son sobre el precio de lista'
        },

        // ============================================
        // OPCIÓN 6: ATENCIÓN PERSONALIZADA
        // ============================================
        
        {
          orden: 17,
          nombre: 'Atención personalizada',
          tipo: 'mensaje',
          condicion: {
            variable: 'opcion_principal',
            valor: 'atencion_personalizada'
          },
          mensaje: '👤 *Atención personalizada*\n\nPara una atención personalizada, comunicate directamente con nuestros asesores:\n\n👉 https://wa.me/5493794057297?text=Hola%20necesito%20atencion%20personalizada\n\nEstamos para ayudarte con cualquier consulta específica que tengas.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Actualizar workflow
    const result = await db.collection('api_configurations').updateOne(
      { _id: api._id },
      {
        $set: {
          workflows: [workflowCompleto],
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Workflow completo creado:');
    console.log('   Total pasos:', workflowCompleto.steps.length);
    console.log('   Opciones principales: 6');
    console.log('   - 1️⃣ Consultar libros (con búsqueda)');
    console.log('   - 2️⃣ Libros de Inglés');
    console.log('   - 3️⃣ Atención post venta (5 sub-opciones)');
    console.log('   - 4️⃣ Información del local');
    console.log('   - 5️⃣ Promociones vigentes');
    console.log('   - 6️⃣ Atención personalizada');
    console.log('');
    console.log('   Documentos actualizados:', result.modifiedCount);

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearWorkflowCompleto();
