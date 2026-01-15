import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function reorganizarFlujos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 REORGANIZACIÓN: 1 WORKFLOW = 1 OPCIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ESTRUCTURA ÓPTIMA: 1 workflow por cada opción del menú
    const workflowsNuevos = [];

    // ============================================
    // WORKFLOW 0: MENÚ PRINCIPAL (keyword: hola)
    // ============================================
    workflowsNuevos.push({
      nombre: 'Veo Veo - Menú Principal',
      descripcion: 'Menú principal con todas las opciones',
      activo: true,
      trigger: {
        tipo: 'keyword',
        keywords: ['hola', 'menu', 'inicio', 'ayuda', 'consulta', 'libro', 'libros', 'comprar']
      },
      steps: [
        {
          orden: 1,
          nombre: 'Menú principal',
          tipo: 'recopilar',
          pregunta: `👉 Por favor, elegí una opción:

1️⃣ Libros escolares u otros títulos
2️⃣ Libros de Inglés
3️⃣ Soporte de ventas
4️⃣ Información del local
5️⃣ Promociones vigentes
6️⃣ Consultas personalizadas

Escribí el número`,
          nombreVariable: 'opcion_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4', '5', '6']
          }
        }
      ],
      workflowsSiguientes: {
        pregunta: '',
        workflows: [
          { workflowId: 'consultar-libros', opcion: '1' },
          { workflowId: 'libros-ingles', opcion: '2' },
          { workflowId: 'soporte-ventas-menu', opcion: '3' },
          { workflowId: 'info-local', opcion: '4' },
          { workflowId: 'promociones', opcion: '5' },
          { workflowId: 'atencion-personalizada', opcion: '6' }
        ]
      }
    });

    // ============================================
    // OPCIÓN 1: CONSULTAR LIBROS
    // ============================================
    const flujo1 = api.workflows?.find(w => w.nombre === 'Veo Veo - Consultar Libros');
    if (flujo1) {
      flujo1.id = 'consultar-libros';
      flujo1.trigger = { tipo: 'manual' };
      workflowsNuevos.push(flujo1);
    }

    // ============================================
    // OPCIÓN 2: LIBROS DE INGLÉS
    // ============================================
    workflowsNuevos.push({
      id: 'libros-ingles',
      nombre: 'Veo Veo - Libros de Inglés',
      descripcion: 'Información sobre pedidos de libros de inglés',
      activo: true,
      trigger: { tipo: 'manual' },
      steps: [
        {
          orden: 1,
          nombre: 'Información libros de inglés',
          tipo: 'recopilar',
          pregunta: `Los libros de inglés se realizan únicamente a pedido con seña.

Para realizar su pedido, comunicarse con un asesor de venta directo:

👉 https://wa.me/5493794732177?text=Hola,%20estoy%20interesado%20en%20un%20libro%20de%20inglés%20a%20pedido

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ]
    });

    // ============================================
    // OPCIÓN 3: SOPORTE DE VENTAS (MENÚ)
    // ============================================
    workflowsNuevos.push({
      id: 'soporte-ventas-menu',
      nombre: 'Veo Veo - Soporte de Ventas',
      descripcion: 'Menú de atención post venta',
      activo: true,
      trigger: { tipo: 'manual' },
      steps: [
        {
          orden: 1,
          nombre: 'Menú soporte',
          tipo: 'recopilar',
          pregunta: `👉 *Elegí una opción:*

1️⃣ Compré mi libro y quiero retirarlo
2️⃣ Compré un libro por error
3️⃣ El libro que compré tiene fallas de fábrica
4️⃣ Compré un libro y quiero que me lo envíen

Escribí el número`,
          nombreVariable: 'opcion_soporte',
          validacion: {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4']
          }
        }
      ],
      workflowsSiguientes: {
        pregunta: '',
        workflows: [
          { workflowId: 'soporte-retiro', opcion: '1' },
          { workflowId: 'soporte-error', opcion: '2' },
          { workflowId: 'soporte-fallas', opcion: '3' },
          { workflowId: 'soporte-envio', opcion: '4' }
        ]
      }
    });

    // OPCIÓN 3.1: Retiro
    workflowsNuevos.push({
      id: 'soporte-retiro',
      nombre: 'Soporte - Retiro de libro',
      descripcion: 'Información sobre retiro de libros',
      activo: true,
      trigger: { tipo: 'manual' },
      steps: [
        {
          orden: 1,
          nombre: 'Info retiro',
          tipo: 'recopilar',
          pregunta: `📍 Podés retirar tu libro por *San Juan 1037*.

🕗 Nuestro horario de atención es de 8:30 a 12:00hs y de 17:00 a 21:00hs

Podés retirar tu libro después de las *24hs de realizada la compra* para que podamos corroborar y preparar tu pedido.

En el caso de querer recibirlo vía envío comunicate con nuestros asesores de venta:
👉 https://wa.me/5493794732177?text=Hola,%20compré%20un%20libro%20y%20quiero%20que%20me%20lo%20envíen

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ]
    });

    // OPCIÓN 3.2: Error
    workflowsNuevos.push({
      id: 'soporte-error',
      nombre: 'Soporte - Compra por error',
      descripcion: 'Información sobre devoluciones y cambios',
      activo: true,
      trigger: { tipo: 'manual' },
      steps: [
        {
          orden: 1,
          nombre: 'Info error',
          tipo: 'recopilar',
          pregunta: `Uy, qué mal! Para resolverlo te brindamos algunas opciones:

✏️ Después de corroborar que el libro comprado está en el mismo estado en el cual lo recibiste, y con tu recibo de compra en mano:

• Podemos enviarte una *nota de crédito* con el monto del libro para que elijas lo que quieras de nuestra tienda.

• Podés *cambiar el libro* en el momento por otro del mismo valor.

• También podés elegir uno de *mayor valor* y abonar la diferencia.

• O uno de *menor valor* y te entregamos una nota de crédito por la diferencia.

📍 Para completar la gestión acercate a nuestro local en *San Juan 1037*.

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ]
    });

    // OPCIÓN 3.3: Fallas
    workflowsNuevos.push({
      id: 'soporte-fallas',
      nombre: 'Soporte - Fallas de fábrica',
      descripcion: 'Información sobre productos con fallas',
      activo: true,
      trigger: { tipo: 'manual' },
      steps: [
        {
          orden: 1,
          nombre: 'Info fallas',
          tipo: 'recopilar',
          pregunta: `Esto no es común pero suele suceder, hay fallas que se escapan de nuestras manos, por lo cual siempre sugerimos que luego de realizar la compra se debe revisar el producto.

Te recomendamos acercarte al local con libro en mano en buenas condiciones (*Sin forrar o intervenir en el mismo*) y con tu recibo o ticket.

📍 *San Juan 1037 - Corrientes Capital*
🕗 Lunes a Viernes de 8:30 a 12:00hs y de 17:00 a 21:00hs

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ]
    });

    // OPCIÓN 3.4: Envío
    workflowsNuevos.push({
      id: 'soporte-envio',
      nombre: 'Soporte - Solicitar envío',
      descripcion: 'Información sobre envíos',
      activo: true,
      trigger: { tipo: 'manual' },
      steps: [
        {
          orden: 1,
          nombre: 'Info envío',
          tipo: 'recopilar',
          pregunta: `Los envíos son a cargo del cliente.

Si querés cotización de envío dentro de la ciudad de Corrientes, comunicate con nuestros asesores de venta:

👉 https://wa.me/5493794732177?text=Hola,%20compré%20un%20libro%20y%20quiero%20que%20me%20lo%20envíen

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ]
    });

    // ============================================
    // OPCIÓN 4: INFORMACIÓN DEL LOCAL
    // ============================================
    workflowsNuevos.push({
      id: 'info-local',
      nombre: 'Veo Veo - Información del Local',
      descripcion: 'Dirección y horarios del local',
      activo: true,
      trigger: { tipo: 'manual' },
      steps: [
        {
          orden: 1,
          nombre: 'Información del local',
          tipo: 'recopilar',
          pregunta: `Estamos en 📍*San Juan 1037 - Corrientes Capital.*

🕗 *Horarios de atención:*
De Lunes a Viernes de 8:30 a 12:00hs y de 17:00 a 21:00hs
Sábados de 9:00 a 13:00hs y de 17:00 a 21:00hs

Te esperamos! 🤗

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ]
    });

    // ============================================
    // OPCIÓN 5: PROMOCIONES VIGENTES
    // ============================================
    workflowsNuevos.push({
      id: 'promociones',
      nombre: 'Veo Veo - Promociones Vigentes',
      descripcion: 'Promociones bancarias vigentes',
      activo: true,
      trigger: { tipo: 'manual' },
      steps: [
        {
          orden: 1,
          nombre: 'Promociones vigentes',
          tipo: 'recopilar',
          pregunta: `Nuestras promociones bancarias vigentes son:
*LEER CON ATENCIÓN*

*Banco de Corrientes:*
👉🏽 Lunes y Miércoles: 3 cuotas sin interés y 20% de bonificación
   Únicamente con la app +Banco, con tarjetas de crédito Visa y Mastercard vinculadas
   Tope de reintegro $20.000

👉🏻 TODOS LOS JUEVES: 30% Off 6 cuotas sin interés
   *CON TARJETA DE CRÉDITO BONITA VISA*
   Tope: $50.000

*Banco Nación:*
👉🏽 Sábados. Pagando con MODO BNA+, con tarjeta de Crédito Visa o Mastercard:
   10% de reintegro y hasta 3 cuotas sin interés
   Tope $10.000

*Banco Hipotecario:*
👉🏽 Todos los días: 6 cuotas fijas con tarjeta de crédito
👉🏽 Miércoles: 25% off con tarjeta de débito (tope de reintegro $10.000)

*LOCRED:*
👉🏽 Todos los días: 3 y 6 cuotas sin interés

*NaranjaX:*
👉🏽 planZ: 3 cuotas sin interés
👉🏽 6 cuotas sin interés

*Go Cuotas:*
👉🏽 Con tarjeta de Débito, hasta 3 cuotas sin interés
   Para acceder a esta promo deberá registrarse en https://www.gocuotas.com/

*Recordamos que las promociones son sobre el precio de lista*

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ]
    });

    // ============================================
    // OPCIÓN 6: CONSULTAS PERSONALIZADAS
    // ============================================
    workflowsNuevos.push({
      id: 'atencion-personalizada',
      nombre: 'Veo Veo - Consultas Personalizadas',
      descripcion: 'Derivar a atención personalizada',
      activo: true,
      trigger: { tipo: 'manual' },
      steps: [
        {
          orden: 1,
          nombre: 'Consultas personalizadas',
          tipo: 'recopilar',
          pregunta: `Escribinos al siguiente número para contactar a un asesor de ventas!

👉 https://wa.me/5493794732177?text=Hola,%20quiero%20hacer%20una%20consulta%20personalizada

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ]
    });

    // Actualizar en BD
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: workflowsNuevos } }
    );

    console.log('✅ WORKFLOWS REORGANIZADOS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ESTRUCTURA FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    workflowsNuevos.forEach((wf, i) => {
      const trigger = wf.trigger?.tipo === 'keyword' ? 'keyword' : 
                      wf.trigger?.tipo === 'manual' ? 'manual' : 'NO';
      console.log(`${i + 1}. ${wf.nombre}`);
      console.log(`   ID: ${wf.id || 'NO'} | Trigger: ${trigger} | Pasos: ${wf.steps?.length || 0}`);
    });

    console.log(`\n📊 Total workflows: ${workflowsNuevos.length}`);
    console.log('\n✅ Estructura óptima: 1 workflow = 1 opción del menú');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

reorganizarFlujos();
