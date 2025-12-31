import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function actualizarMenuYFlujo1() {
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

    // 1. ACTUALIZAR MENÚ PRINCIPAL
    const menuActualizado = `Hola 👋
¡Bienvenido/a a Librería Veo Veo! 📚✏️
Estamos para ayudarte.

👉 Por favor, selecciona un ítem de consulta:

1️⃣ Libros escolares u otros títulos
2️⃣ Libros de Inglés
3️⃣ Soporte de ventas
4️⃣ Información del local
5️⃣ Promociones vigentes
6️⃣ Consultas personalizadas

Escribí el número`;

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { 'menuPrincipal.mensaje': menuActualizado } }
    );

    console.log('✅ Menú principal actualizado');

    // 2. ACTUALIZAR FLUJO 1: Consultar Libros
    const workflows = api.workflows || [];
    const flujo1Index = workflows.findIndex(w => w.nombre === 'Veo Veo - Consultar Libros');

    if (flujo1Index === -1) {
      console.log('❌ No se encontró FLUJO 1: Consultar Libros');
      await mongoose.disconnect();
      return;
    }

    const flujo1 = workflows[flujo1Index];

    // PASO 4: Actualizar mensaje de resultados con stock
    const paso4Index = flujo1.steps.findIndex(s => s.orden === 4);
    if (paso4Index !== -1) {
      flujo1.steps[paso4Index].pregunta = `Perfecto😊, estos son los resultados que coinciden con tu búsqueda:
📚 *Resultados encontrados:*

{{opciones}}

💡 *¿Cuál libro querés agregar a tu compra?*

➡️ Escribí el número del libro
➡️ Escribí *0* para volver al menú principal`;
      console.log('✅ PASO 4: Mensaje de resultados actualizado');
    }

    // PASO 7: Actualizar mensaje de link de pago
    const paso7Index = flujo1.steps.findIndex(s => s.orden === 7);
    if (paso7Index !== -1) {
      flujo1.steps[paso7Index].pregunta = `💳 *Link de pago generado*

📦 *Resumen de tu pedido:*
📘 {{producto_nombre}}
📦 Cantidad: {{cantidad}}
💰 Total a pagar: $` + '{{subtotal}}' + `

🔗 *Completá tu compra aquí:*
{{link_pago}}

⏰ Tenés 10 minutos para completar el pago.

👉 Una vez realizado el pago, por favor envianos:
   • 📸 Comprobante de pago
   
al siguiente número:
https://wa.me/5493794732177?text=Hola,%20adjunto%20comprobante%20de%20pago

⏰ *Retiro del pedido:* Podés pasar a retirarlo a partir de las 24hs de confirmado el pago.

Quedamos atentos para ayudarte con cualquier otra consulta 📚✨`;
      console.log('✅ PASO 7: Mensaje de link de pago actualizado');
    }

    // Guardar cambios
    workflows[flujo1Index] = flujo1;

    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { workflows: workflows } }
    );

    console.log('\n✅ FLUJO 1 actualizado correctamente');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarMenuYFlujo1();
