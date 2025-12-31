import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearFlujo3() {
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

    // FLUJO 3: Soporte de Ventas (con submenú)
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
        },
        {
          orden: 2,
          nombre: 'Respuesta opción 1 - Retiro',
          tipo: 'condicional',
          condicion: {
            variable: 'opcion_soporte',
            operador: '==',
            valor: '1'
          },
          pregunta: `📍 Podés retirar tu libro por *San Juan 1037*.

🕗 Nuestro horario de atención es de 8:30 a 12:00hs y de 17:00 a 21:00hs

Podés retirar tu libro después de las *24hs de realizada la compra* para que podamos corroborar y preparar tu pedido.

En el caso de querer recibirlo vía envío comunicate con nuestros asesores de venta:
👉 https://wa.me/5493794732177?text=Hola,%20compré%20un%20libro%20y%20quiero%20que%20me%20lo%20envíen

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu_1',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        },
        {
          orden: 3,
          nombre: 'Respuesta opción 2 - Error',
          tipo: 'condicional',
          condicion: {
            variable: 'opcion_soporte',
            operador: '==',
            valor: '2'
          },
          pregunta: `Uy, qué mal! Para resolverlo te brindamos algunas opciones:

✏️ Después de corroborar que el libro comprado está en el mismo estado en el cual lo recibiste, y con tu recibo de compra en mano:

• Podemos enviarte una *nota de crédito* con el monto del libro para que elijas lo que quieras de nuestra tienda.

• Podés *cambiar el libro* en el momento por otro del mismo valor.

• También podés elegir uno de *mayor valor* y abonar la diferencia.

• O uno de *menor valor* y te entregamos una nota de crédito por la diferencia.

📍 Para completar la gestión acercate a nuestro local en *San Juan 1037*.

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu_2',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        },
        {
          orden: 4,
          nombre: 'Respuesta opción 3 - Fallas',
          tipo: 'condicional',
          condicion: {
            variable: 'opcion_soporte',
            operador: '==',
            valor: '3'
          },
          pregunta: `Esto no es común pero suele suceder, hay fallas que se escapan de nuestras manos, por lo cual siempre sugerimos que luego de realizar la compra se debe revisar el producto.

Te recomendamos acercarte al local con libro en mano en buenas condiciones (*Sin forrar o intervenir en el mismo*) y con tu recibo o ticket.

📍 *San Juan 1037 - Corrientes Capital*
🕗 Lunes a Viernes de 8:30 a 12:00hs y de 17:00 a 21:00hs

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu_3',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        },
        {
          orden: 5,
          nombre: 'Respuesta opción 4 - Envío',
          tipo: 'condicional',
          condicion: {
            variable: 'opcion_soporte',
            operador: '==',
            valor: '4'
          },
          pregunta: `Los envíos son a cargo del cliente.

Si querés cotización de envío dentro de la ciudad de Corrientes, comunicate con nuestros asesores de venta:

👉 https://wa.me/5493794732177?text=Hola,%20compré%20un%20libro%20y%20quiero%20que%20me%20lo%20envíen

Escribí *1* para volver al menú principal`,
          nombreVariable: 'volver_menu_4',
          validacion: {
            tipo: 'opcion',
            opciones: ['1']
          }
        }
      ]
    };

    const workflowsExistentes = api.workflows || [];
    const flujo3Existe = workflowsExistentes.find(w => w.nombre === flujo3.nombre);

    if (flujo3Existe) {
      // Actualizar el existente
      const index = workflowsExistentes.findIndex(w => w.nombre === flujo3.nombre);
      workflowsExistentes[index] = flujo3;
      console.log('✅ FLUJO 3: Soporte de Ventas - ACTUALIZADO');
    } else {
      // Crear nuevo
      workflowsExistentes.push(flujo3);
      console.log('✅ FLUJO 3: Soporte de Ventas - CREADO');
    }

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: workflowsExistentes } }
    );

    console.log('\n✅ Workflow actualizado correctamente');
    console.log('   Total workflows:', workflowsExistentes.length);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearFlujo3();
