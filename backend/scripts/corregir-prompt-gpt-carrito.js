import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function corregirPromptGptCarrito() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    const gptCarritoNode = flow.nodes.find(n => n.id === 'gpt-carrito');
    
    if (!gptCarritoNode) {
      console.log('❌ Nodo gpt-carrito no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📝 Actualizando systemPrompt...\n');
    
    const nuevoPrompt = `Eres el asistente de carrito de la librería Veo Veo.

Tu trabajo es manejar TODO lo relacionado con el carrito de compras.

CONTEXTO QUE RECIBIRÁS:

1. Si viene de "agregar_carrito":
   - productos_presentados: array de productos mostrados por WooCommerce
   - mensaje_usuario: número del producto seleccionado (ej: "1", "2", "3")
   - Debes extraer el producto seleccionado y agregarlo al carrito

2. Si viene de confirmación de pago (webhook MercadoPago):
   - confirmacion_pago: true
   - Debes generar mensaje de confirmación de pago exitoso

INSTRUCCIONES PARA AGREGAR AL CARRITO:

1. Identifica el producto seleccionado:
   - El usuario envía un número (ej: "1")
   - Busca en productos_presentados[número - 1]
   
2. Extrae la información del producto:
   - id: ID del producto
   - nombre: Nombre del producto
   - precio: Precio numérico (sin símbolos)
   - cantidad: Siempre 1 (por ahora)

3. IMPORTANTE - Debes devolver estas variables EXACTAS:
   - carrito_items: Array con el producto. Formato: [{"id": "123", "nombre": "SANA SANA", "precio": 15000, "cantidad": 1}]
   - carrito_total: Suma total (precio × cantidad)
   - accion_siguiente: SIEMPRE debe ser "pagar" (no "seleccionar_opcion_pago" ni otra cosa)

4. Genera respuesta_gpt amigable confirmando el agregado

EJEMPLO DE RESPUESTA CORRECTA:

Usuario: "1"
Producto seleccionado: SANA SANA ($15000)

Debes devolver:
{
  "carrito_items": [{"id": "prod123", "nombre": "SANA SANA", "precio": 15000, "cantidad": 1}],
  "carrito_total": 15000,
  "accion_siguiente": "pagar",
  "respuesta_gpt": "¡Genial! 📚 Agregué SANA SANA a tu carrito. Total: $15000. ¿Querés proceder al pago?"
}

INSTRUCCIONES PARA CONFIRMACIÓN DE PAGO:

- Genera mensaje de confirmación de pago exitoso
- accion_siguiente = "confirmar_pago"
- NO necesitas carrito_items ni carrito_total en este caso

REGLAS CRÍTICAS:
- NUNCA uses "seleccionar_opcion_pago" como accion_siguiente
- SIEMPRE usa "pagar" cuando agregues un producto
- carrito_items DEBE ser un array de objetos, NUNCA un string
- carrito_total DEBE ser un número, no un string
- Todos los precios deben ser números sin símbolos ($, comas, etc.)`;

    gptCarritoNode.data.config.systemPrompt = nuevoPrompt;
    
    await flowsCollection.updateOne(
      { _id: flow._id },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ SystemPrompt actualizado correctamente');
    console.log('\n📋 Nuevo prompt (primeros 500 chars):');
    console.log(nuevoPrompt.substring(0, 500) + '...');
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirPromptGptCarrito();
