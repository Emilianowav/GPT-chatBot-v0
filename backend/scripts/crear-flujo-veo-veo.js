import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearFlujoVeoVeo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CREANDO FLUJO VEO VEO EN BASE DE DATOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const empresaId = 'Veo Veo';
    const flowId = 'veo-veo-completo';
    
    // 1. Crear el flujo principal
    console.log('1️⃣ Creando flujo principal...');
    
    const flow = {
      id: flowId,
      empresaId: empresaId,
      nombre: 'Veo Veo - Flujo Completo',
      descripcion: 'Sistema completo de atención al cliente para Librería Veo Veo',
      categoria: 'atencion_cliente',
      startNode: 'menu-principal',
      activo: true,
      variables: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('flows').updateOne(
      { id: flowId },
      { $set: flow },
      { upsert: true }
    );
    
    console.log('   ✅ Flujo principal creado\n');
    
    // 2. Eliminar nodos antiguos si existen
    console.log('2️⃣ Limpiando nodos antiguos...');
    await db.collection('flownodes').deleteMany({ flowId: flowId });
    console.log('   ✅ Nodos antiguos eliminados\n');
    
    // 3. Crear nodos del flujo
    console.log('3️⃣ Creando nodos del flujo...\n');
    
    const nodes = [
      // MENÚ PRINCIPAL
      {
        id: 'menu-principal',
        flowId: flowId,
        empresaId: empresaId,
        type: 'question',
        name: 'Menú Principal',
        message: `Hola 👋
¡Bienvenido/a a Librería Veo Veo! 📚✏️
Estamos para ayudarte.

👉 Por favor, selecciona un ítem de consulta:

1️⃣ Libros escolares u otros títulos
2️⃣ Libros de Inglés
3️⃣ Soporte de ventas
4️⃣ Información del local
5️⃣ Promociones vigentes
6️⃣ Consultas personalizadas

Escribí el número`,
        variable: 'opcion_menu',
        validation: {
          type: 'option',
          options: ['1', '2', '3', '4', '5', '6']
        },
        next: 'router-menu',
        activo: true,
        metadata: {
          position: { x: 100, y: 100 }
        }
      },
      
      // ROUTER DEL MENÚ
      {
        id: 'router-menu',
        flowId: flowId,
        empresaId: empresaId,
        type: 'condition',
        name: 'Router Menú',
        conditionVariable: 'opcion_menu',
        conditions: [
          { value: '1', next: 'flujo-1-inicio' },
          { value: '2', next: 'flujo-2-ingles' },
          { value: '3', next: 'flujo-3-soporte' },
          { value: '4', next: 'flujo-4-info-local' },
          { value: '5', next: 'flujo-5-promociones' },
          { value: '6', next: 'flujo-6-consulta-personalizada' }
        ],
        next: ['flujo-1-inicio', 'flujo-2-ingles', 'flujo-3-soporte', 'flujo-4-info-local', 'flujo-5-promociones', 'flujo-6-consulta-personalizada'],
        activo: true,
        metadata: {
          position: { x: 100, y: 300 }
        }
      },
      
      // ============================================
      // FLUJO 1: LIBROS ESCOLARES
      // ============================================
      {
        id: 'flujo-1-inicio',
        flowId: flowId,
        empresaId: empresaId,
        type: 'question',
        name: 'Flujo 1 - Solicitar búsqueda',
        message: `Por favor, ingrese su búsqueda en el siguiente orden:

Título - Editorial - Edición

⚠️ No enviar fotografía de libros, únicamente por escrito!`,
        variable: 'busqueda_libro',
        validation: {
          type: 'text'
        },
        next: 'flujo-1-buscar-api',
        activo: true,
        metadata: {
          position: { x: -200, y: 500 }
        }
      },
      
      {
        id: 'flujo-1-buscar-api',
        flowId: flowId,
        empresaId: empresaId,
        type: 'api',
        name: 'Buscar libro en API',
        apiUrl: 'https://api-veo-veo.com/buscar-libro',
        apiMethod: 'GET',
        apiParams: {
          query: '{{busqueda_libro}}'
        },
        next: 'flujo-1-verificar-stock',
        activo: true,
        metadata: {
          position: { x: -200, y: 700 }
        }
      },
      
      {
        id: 'flujo-1-verificar-stock',
        flowId: flowId,
        empresaId: empresaId,
        type: 'condition',
        name: 'Verificar Stock',
        conditionVariable: 'stock_disponible',
        conditions: [
          { value: 'true', next: 'flujo-1-mostrar-resultados' },
          { value: 'false', next: 'flujo-1-sin-stock' }
        ],
        next: ['flujo-1-mostrar-resultados', 'flujo-1-sin-stock'],
        activo: true,
        metadata: {
          position: { x: -200, y: 900 }
        }
      },
      
      {
        id: 'flujo-1-mostrar-resultados',
        flowId: flowId,
        empresaId: empresaId,
        type: 'question',
        name: 'Mostrar resultados con stock',
        message: `Perfecto😊, estos son los resultados que coinciden con tu búsqueda:
📚 Resultados encontrados:

{{resultados_libros}}

💡 ¿Cuál libro querés agregar a tu compra?

→ Escribí el número del libro que buscas
→ Escribí 0 para volver al menú principal`,
        variable: 'libro_seleccionado',
        validation: {
          type: 'number'
        },
        next: 'flujo-1-cantidad',
        activo: true,
        metadata: {
          position: { x: -400, y: 1100 }
        }
      },
      
      {
        id: 'flujo-1-sin-stock',
        flowId: flowId,
        empresaId: empresaId,
        type: 'question',
        name: 'Sin stock disponible',
        message: `Lo sentimos, este libro parece no encontrarse en stock en este momento, de todas formas nos encontramos haciendo pedidos a las editoriales y puede que lo tengamos disponible en muy poco tiempo.

Podes consultar si tu producto estará en stock pronto, en ese caso podes reservarlo.
Para más información comunicarse a nuestro número de atención personalizada
👉 https://wa.me/5493794732177?text=hola

👉 Elegí una opción:
1️⃣ Buscar otro título
2️⃣ Volver al menú principal`,
        variable: 'opcion_sin_stock',
        validation: {
          type: 'option',
          options: ['1', '2']
        },
        next: 'router-sin-stock',
        activo: true,
        metadata: {
          position: { x: 0, y: 1100 }
        }
      },
      
      {
        id: 'router-sin-stock',
        flowId: flowId,
        empresaId: empresaId,
        type: 'condition',
        name: 'Router Sin Stock',
        conditionVariable: 'opcion_sin_stock',
        conditions: [
          { value: '1', next: 'flujo-1-inicio' },
          { value: '2', next: 'menu-principal' }
        ],
        next: ['flujo-1-inicio', 'menu-principal'],
        activo: true,
        metadata: {
          position: { x: 0, y: 1300 }
        }
      },
      
      {
        id: 'flujo-1-cantidad',
        flowId: flowId,
        empresaId: empresaId,
        type: 'question',
        name: 'Solicitar cantidad',
        message: '📦 ¿Cuántos ejemplares de {{libro_nombre}} querés?\n\nEscribí la cantidad (1-10)',
        variable: 'cantidad_libros',
        validation: {
          type: 'number'
        },
        next: 'flujo-1-confirmar-agregado',
        activo: true,
        metadata: {
          position: { x: -400, y: 1300 }
        }
      },
      
      {
        id: 'flujo-1-confirmar-agregado',
        flowId: flowId,
        empresaId: empresaId,
        type: 'question',
        name: 'Confirmar libro agregado',
        message: '✅ Libro agregado a tu compra:\n\n📘 {{libro_nombre}}\n📦 Cantidad: {{cantidad_libros}}\n💰 Precio: ${{precio_unitario}}\n💵 Subtotal: ${{subtotal}}\n\n¿Qué querés hacer?\n\n1️⃣ Agregar otro libro a mi compra\n2️⃣ Finalizar y generar link de pago\n\nEscribí el número',
        variable: 'opcion_continuar',
        validation: {
          type: 'option',
          options: ['1', '2']
        },
        next: 'router-continuar',
        activo: true,
        metadata: {
          position: { x: -400, y: 1500 }
        }
      },
      
      {
        id: 'router-continuar',
        flowId: flowId,
        empresaId: empresaId,
        type: 'condition',
        name: 'Router Continuar',
        conditionVariable: 'opcion_continuar',
        conditions: [
          { value: '1', next: 'flujo-1-inicio' },
          { value: '2', next: 'flujo-1-generar-pago' }
        ],
        next: ['flujo-1-inicio', 'flujo-1-generar-pago'],
        activo: true,
        metadata: {
          position: { x: -400, y: 1700 }
        }
      },
      
      {
        id: 'flujo-1-generar-pago',
        flowId: flowId,
        empresaId: empresaId,
        type: 'message',
        name: 'Generar link de pago',
        message: '🔗 Link de pago: {{link_pago}}\n\n👉 Una vez realizado el pago, por favor enviános:\n• 📸 Comprobante de pago\n• ✍️ Tus datos\n\nAl siguiente número: https://wa.me/5493794732177?text=hola\n\n⏰ Retiro del pedido: Podés pasar a retirarlo a partir de las 24 hs de confirmado el pago.\n\nQuedamos atentos para ayudarte con cualquier otra consulta 📚✨',
        next: null,
        activo: true,
        metadata: {
          position: { x: -400, y: 1900 }
        }
      },
      
      // ============================================
      // FLUJO 2: LIBROS DE INGLÉS
      // ============================================
      {
        id: 'flujo-2-ingles',
        flowId: flowId,
        empresaId: empresaId,
        type: 'question',
        name: 'Libros de Inglés',
        message: `Los libros de inglés se realizan únicamente a pedido con seña.

Para realizar su pedido, comunicarse con un asesor de venta directo:

👉 https://wa.me/5493794732177?text=Hola,%20estoy%20interesado%20en%20un%20libro%20de%20inglés%20a%20pedido

Escribí 1 para volver al menú principal`,
        variable: 'volver_menu_2',
        validation: {
          type: 'option',
          options: ['1']
        },
        next: 'menu-principal',
        activo: true,
        metadata: {
          position: { x: 100, y: 500 }
        }
      },
      
      // ============================================
      // FLUJO 3: SOPORTE DE VENTAS
      // ============================================
      {
        id: 'flujo-3-soporte',
        flowId: flowId,
        empresaId: empresaId,
        type: 'question',
        name: 'Soporte de Ventas',
        message: `👉 Elegí una opción:

1️⃣ Compré mi libro y quiero retirarlo
2️⃣ Compré un libro por error
3️⃣ El libro que compré tiene fallas de fábrica
4️⃣ Compré un libro y quiero que me lo envíen

Escribí el número`,
        variable: 'opcion_soporte',
        validation: {
          type: 'option',
          options: ['1', '2', '3', '4']
        },
        next: 'router-soporte',
        activo: true,
        metadata: {
          position: { x: 400, y: 500 }
        }
      },
      
      {
        id: 'router-soporte',
        flowId: flowId,
        empresaId: empresaId,
        type: 'condition',
        name: 'Router Soporte',
        conditionVariable: 'opcion_soporte',
        conditions: [
          { value: '1', next: 'soporte-retiro' },
          { value: '2', next: 'soporte-error' },
          { value: '3', next: 'soporte-fallas' },
          { value: '4', next: 'soporte-envio' }
        ],
        next: ['soporte-retiro', 'soporte-error', 'soporte-fallas', 'soporte-envio'],
        activo: true,
        metadata: {
          position: { x: 400, y: 700 }
        }
      },
      
      {
        id: 'soporte-retiro',
        flowId: flowId,
        empresaId: empresaId,
        type: 'message',
        name: 'Info Retiro',
        message: `📍 Podes retirar tu libro por San Juan 1037.

🕗 Nuestro horario de atención es de 8:30 a 12:00hs y de 17:00 a 21:00hs

Podes retirar tu libro después de las 24hs de realizada la compra para que podamos corroborar y preparar tu pedido.

En el caso de querer recibirlo vía envío comuníquese con nuestros asesores de venta.`,
        next: 'menu-principal',
        activo: true,
        metadata: {
          position: { x: 200, y: 900 }
        }
      },
      
      {
        id: 'soporte-error',
        flowId: flowId,
        empresaId: empresaId,
        type: 'message',
        name: 'Compra por Error',
        message: `Uy, qué mal! Para resolverlo te brindamos algunas opciones:

✏️ Después de corroborar que el libro comprado está en el mismo estado en el cual lo recibiste, y con tu recibo de compra en mano:

• Podemos enviarte una nota de crédito con el monto del libro para que elijas lo que quieras de nuestra tienda
• Podes cambiar el libro en el momento por otro del mismo valor
• También podes elegir uno de mayor valor y abonar la diferencia
• O uno de menor valor y te entregamos una nota de crédito por la diferencia

📍 Para completar la gestión acércate a nuestro local en San Juan 1037.`,
        next: 'menu-principal',
        activo: true,
        metadata: {
          position: { x: 400, y: 900 }
        }
      },
      
      {
        id: 'soporte-fallas',
        flowId: flowId,
        empresaId: empresaId,
        type: 'message',
        name: 'Fallas de Fábrica',
        message: `Esto no es común pero suele suceder, hay fallas que se escapan de nuestras manos, por lo cual siempre sugerimos que luego de realizar la compra se debe revisar el producto.

Te recomendamos acercarte al local con libro en mano en buenas condiciones (Sin forrar o intervenir en el mismo) y con su recibo o ticket.`,
        next: 'menu-principal',
        activo: true,
        metadata: {
          position: { x: 600, y: 900 }
        }
      },
      
      {
        id: 'soporte-envio',
        flowId: flowId,
        empresaId: empresaId,
        type: 'message',
        name: 'Solicitar Envío',
        message: `Los envíos son a cargo del cliente, si querés cotización de envío dentro de la ciudad de Corrientes debés comunicarte con nuestros asesores de venta:

👉 https://wa.me/5493794732177?text=Hola,%20compré%20un%20libro%20y%20quiero%20que%20me%20lo%20envíen`,
        next: 'menu-principal',
        activo: true,
        metadata: {
          position: { x: 800, y: 900 }
        }
      },
      
      // ============================================
      // FLUJO 4: INFORMACIÓN DEL LOCAL
      // ============================================
      {
        id: 'flujo-4-info-local',
        flowId: flowId,
        empresaId: empresaId,
        type: 'message',
        name: 'Información del Local',
        message: `Estamos en 📍 San Juan 1037 - Corrientes Capital.

De Lunes a Viernes de 8:30 a 17 a 21
Sábados de 9 a 13 y de 17 a 21

Te esperamos! 🤗`,
        next: 'menu-principal',
        activo: true,
        metadata: {
          position: { x: 700, y: 500 }
        }
      },
      
      // ============================================
      // FLUJO 5: PROMOCIONES
      // ============================================
      {
        id: 'flujo-5-promociones',
        flowId: flowId,
        empresaId: empresaId,
        type: 'message',
        name: 'Promociones Vigentes',
        message: `Nuestras promociones bancarias vigentes son:
LEER CON ATENCIÓN

Banco de Corrientes:
👉🏽 Lunes y Miércoles 3 cuotas sin interés y 20% de bonificación
👉🏻 TODOS LOS JUEVES · 30% Off 6 cuotas sin interés

Banco Nación:
👉🏽 Sábados. 10% de reintegro y hasta 3 cuotas sin interés

Banco Hipotecario:
👉🏽 Todos los días 6 cuotas fijas
👉🏽 Miércoles 25% off con tarjeta de débito

LOCRED:
👉🏽 Todos los días 3 y 6 cuotas sin interés

NaranjaX:
👉🏽 6 cuotas sin interés

Go Cuotas:
👉🏽 Con tarjeta de Débito, hasta 3 cuotas sin interés

Recordamos que las promociones son sobre el precio de lista`,
        next: 'menu-principal',
        activo: true,
        metadata: {
          position: { x: 1000, y: 500 }
        }
      },
      
      // ============================================
      // FLUJO 6: CONSULTA PERSONALIZADA
      // ============================================
      {
        id: 'flujo-6-consulta-personalizada',
        flowId: flowId,
        empresaId: empresaId,
        type: 'message',
        name: 'Consulta Personalizada',
        message: `Escríbenos al siguiente número para contactar a un asesor de ventas!

👉 https://wa.me/5493794732177?text=Hola,%20quiero%20hacer%20una%20consulta%20personalizada`,
        next: 'menu-principal',
        activo: true,
        metadata: {
          position: { x: 1300, y: 500 }
        }
      }
    ];
    
    // Insertar todos los nodos
    for (const node of nodes) {
      await db.collection('flownodes').insertOne(node);
      console.log(`   ✅ Nodo creado: ${node.name}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FLUJO VEO VEO CREADO EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 RESUMEN:');
    console.log(`   - Flujo ID: ${flowId}`);
    console.log(`   - Empresa: ${empresaId}`);
    console.log(`   - Total de nodos: ${nodes.length}`);
    console.log(`   - Nodo inicial: menu-principal\n`);
    
    console.log('🎨 PRÓXIMO PASO:');
    console.log('   Abre el editor visual en:');
    console.log('   http://localhost:3001/dashboard/flows');
    console.log('   Y haz click en "Veo Veo - Flujo Completo" para editarlo\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearFlujoVeoVeo();
