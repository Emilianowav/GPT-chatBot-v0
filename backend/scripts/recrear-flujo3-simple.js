import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function recrearFlujo3() {
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

    let workflows = api.workflows || [];

    // Eliminar el FLUJO 3 viejo
    workflows = workflows.filter(w => w.nombre !== 'Veo Veo - Soporte de Ventas');

    // FLUJO 3: Menú principal de Soporte de Ventas con workflows encadenados
    const flujo3 = {
      nombre: 'Veo Veo - Soporte de Ventas',
      descripcion: 'Atención post venta y consultas sobre compras',
      activo: true,
      trigger: {
        tipo: 'menu',
        valor: '3'
      },
      steps: [
        {
          orden: 1,
          nombre: 'Menú soporte de ventas',
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
    };

    // Sub-workflow 1: Retiro
    const soporteRetiro = {
      id: 'soporte-retiro',
      nombre: 'Soporte - Retiro de libro',
      descripcion: 'Información sobre retiro de libros',
      activo: true,
      trigger: {
        tipo: 'manual'
      },
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
    };

    // Sub-workflow 2: Error en compra
    const soporteError = {
      id: 'soporte-error',
      nombre: 'Soporte - Compra por error',
      descripcion: 'Información sobre devoluciones y cambios',
      activo: true,
      trigger: {
        tipo: 'manual'
      },
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
    };

    // Sub-workflow 3: Fallas de fábrica
    const soporteFallas = {
      id: 'soporte-fallas',
      nombre: 'Soporte - Fallas de fábrica',
      descripcion: 'Información sobre productos con fallas',
      activo: true,
      trigger: {
        tipo: 'manual'
      },
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
    };

    // Sub-workflow 4: Envío
    const soporteEnvio = {
      id: 'soporte-envio',
      nombre: 'Soporte - Solicitar envío',
      descripcion: 'Información sobre envíos',
      activo: true,
      trigger: {
        tipo: 'manual'
      },
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
    };

    // Agregar todos los workflows
    workflows.push(flujo3);
    workflows.push(soporteRetiro);
    workflows.push(soporteError);
    workflows.push(soporteFallas);
    workflows.push(soporteEnvio);

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: workflows } }
    );

    console.log('✅ FLUJO 3: Soporte de Ventas - RECREADO con workflows encadenados');
    console.log('   - Flujo principal con menú (4 opciones)');
    console.log('   - 4 sub-workflows (retiro, error, fallas, envío)');
    console.log(`\n📊 Total workflows: ${workflows.length}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

recrearFlujo3();
