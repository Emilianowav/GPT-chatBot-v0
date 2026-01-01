import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function configurarFlujo1() {
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

    const workflows = api.workflows || [];
    const flujo1Index = workflows.findIndex(w => w.nombre === 'Veo Veo - Consultar Libros');

    if (flujo1Index === -1) {
      console.log('❌ No se encontró FLUJO 1: Consultar Libros');
      await mongoose.disconnect();
      return;
    }

    const flujo1 = workflows[flujo1Index];

    // PASO 4: Configurar mensaje sin resultados y opción "0"
    const paso4Index = flujo1.steps.findIndex(s => s.orden === 4);
    if (paso4Index !== -1) {
      flujo1.steps[paso4Index].mensajeSinResultados = `Lo sentimos, este libro parece no encontrarse en stock en este momento, de todas formas nos encontramos haciendo pedidos a las editoriales y puede que lo tengamos disponible en muy poco tiempo.

Podés consultar si tu producto estará en stock pronto, en ese caso podés reservarlo.

Para más información comunicarse a nuestro número de atención personalizada:
👉 https://wa.me/5493794732177?text=Hola,%20quiero%20consultar%20disponibilidad%20de%20un%20libro

👉 *Elegí una opción:*
1️⃣ Buscar otro título
2️⃣ Volver al menú principal

Escribí el número`;

      flujo1.steps[paso4Index].permitirVolverAlMenu = true;
      flujo1.steps[paso4Index].mensajeVolverAlMenu = '🔙 Volviendo al menú principal...';

      console.log('✅ PASO 4: Configuraciones agregadas');
      console.log('   - mensajeSinResultados: ✅');
      console.log('   - permitirVolverAlMenu: true');
      console.log('   - mensajeVolverAlMenu: ✅');
    }

    // Guardar cambios
    workflows[flujo1Index] = flujo1;

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: workflows } }
    );

    console.log('\n✅ FLUJO 1 configurado correctamente en BD');
    console.log('   Ahora TODO es configurable desde la base de datos');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

configurarFlujo1();
