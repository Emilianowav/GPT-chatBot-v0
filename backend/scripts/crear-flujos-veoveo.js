import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearFlujos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener API de Veo Veo
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 API encontrada:', api.nombre);
    console.log('   Workflows actuales:', api.workflows?.length || 0);

    // FLUJO 2: Libros de Inglés
    const flujo2 = {
      nombre: 'Veo Veo - Libros de Inglés',
      descripcion: 'Información sobre pedidos de libros de inglés',
      activo: true,
      trigger: {
        tipo: 'menu',
        valor: '2'
      },
      steps: [
        {
          orden: 1,
          nombre: 'Información libros de inglés',
          tipo: 'mensaje',
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
    };

    // FLUJO 4: Información del Local
    const flujo4 = {
      nombre: 'Veo Veo - Información del Local',
      descripcion: 'Dirección y horarios del local',
      activo: true,
      trigger: {
        tipo: 'menu',
        valor: '4'
      },
      steps: [
        {
          orden: 1,
          nombre: 'Información del local',
          tipo: 'mensaje',
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
    };

    // FLUJO 5: Promociones Vigentes
    const flujo5 = {
      nombre: 'Veo Veo - Promociones Vigentes',
      descripcion: 'Promociones bancarias vigentes',
      activo: true,
      trigger: {
        tipo: 'menu',
        valor: '5'
      },
      steps: [
        {
          orden: 1,
          nombre: 'Promociones vigentes',
          tipo: 'mensaje',
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
    };

    // FLUJO 6: Consultas Personalizadas
    const flujo6 = {
      nombre: 'Veo Veo - Consultas Personalizadas',
      descripcion: 'Derivar a atención personalizada',
      activo: true,
      trigger: {
        tipo: 'menu',
        valor: '6'
      },
      steps: [
        {
          orden: 1,
          nombre: 'Consultas personalizadas',
          tipo: 'mensaje',
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
    };

    // Agregar workflows a la API
    const workflowsExistentes = api.workflows || [];
    
    // Verificar si ya existen
    const flujo2Existe = workflowsExistentes.find(w => w.nombre === flujo2.nombre);
    const flujo4Existe = workflowsExistentes.find(w => w.nombre === flujo4.nombre);
    const flujo5Existe = workflowsExistentes.find(w => w.nombre === flujo5.nombre);
    const flujo6Existe = workflowsExistentes.find(w => w.nombre === flujo6.nombre);

    const nuevosWorkflows = [...workflowsExistentes];

    if (!flujo2Existe) {
      nuevosWorkflows.push(flujo2);
      console.log('✅ FLUJO 2: Libros de Inglés - CREADO');
    } else {
      console.log('⚠️  FLUJO 2: Libros de Inglés - YA EXISTE');
    }

    if (!flujo4Existe) {
      nuevosWorkflows.push(flujo4);
      console.log('✅ FLUJO 4: Información del Local - CREADO');
    } else {
      console.log('⚠️  FLUJO 4: Información del Local - YA EXISTE');
    }

    if (!flujo5Existe) {
      nuevosWorkflows.push(flujo5);
      console.log('✅ FLUJO 5: Promociones Vigentes - CREADO');
    } else {
      console.log('⚠️  FLUJO 5: Promociones Vigentes - YA EXISTE');
    }

    if (!flujo6Existe) {
      nuevosWorkflows.push(flujo6);
      console.log('✅ FLUJO 6: Consultas Personalizadas - CREADO');
    } else {
      console.log('⚠️  FLUJO 6: Consultas Personalizadas - YA EXISTE');
    }

    // Actualizar API
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: nuevosWorkflows } }
    );

    console.log('\n✅ Workflows actualizados correctamente');
    console.log('   Total workflows:', nuevosWorkflows.length);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearFlujos();
