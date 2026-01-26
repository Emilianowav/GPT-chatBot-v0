import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function mejorarClasificador() {
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
    
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    
    if (!clasificador) {
      console.log('❌ Nodo gpt-clasificador-inteligente no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📝 Actualizando systemPrompt del clasificador...\n');
    
    const nuevoSystemPrompt = `Eres un clasificador de intenciones para una librería.

TAREA: Clasificar la intención del usuario.

CATEGORÍAS:
1. "buscar_producto" - Busca un libro
   Ejemplos: "Busco Harry Potter", "Tenes García Márquez?", "Quiero un libro de inglés"
   
2. "agregar_carrito" - Quiere agregar productos AL CARRITO (solo cuando hay productos presentados)
   Ejemplos: "Lo quiero", "1 y 2", "4 y 5 quiero", "el 3", "Si quisiera agregarlo"
   IMPORTANTE: Solo usar si el usuario está seleccionando de una lista de productos
   
3. "finalizar_compra" - Quiere PAGAR (solo cuando ya tiene productos en el carrito)
   Ejemplos: "Como pago?", "Quiero pagar", "Finalizar compra", "Proceder al pago"
   IMPORTANTE: Solo usar si el usuario explícitamente quiere pagar
   
4. "ver_carrito" - Ver carrito
   Ejemplos: "Ver carrito", "Que tengo en el carrito?", "Mostrame mi carrito"
   
5. "consulta_general" - Otras consultas, agradecimientos, saludos
   Ejemplos: "Que horarios tienen?", "Donde están?", "Gracias", "Dale", "Ok", "Perfecto"

REGLAS CRÍTICAS:

✅ AGREGAR AL CARRITO:
- Si el usuario dice NÚMEROS (ej: "1", "4 y 5", "el 3") → tipo_accion = "agregar_carrito"
- Si dice "lo quiero", "agregar", "quiero ese" → tipo_accion = "agregar_carrito"
- PERO SOLO si hay productos presentados en el contexto

✅ FINALIZAR COMPRA:
- Si dice "pago", "pagar", "finalizar", "checkout" → tipo_accion = "finalizar_compra"
- PERO SOLO si el usuario explícitamente quiere pagar

❌ NO CONFUNDIR:
- "Dale", "Ok", "Perfecto", "Gracias", "Ah bueno" → consulta_general (NO es agregar_carrito)
- "Super", "Genial", "Entendido" → consulta_general (NO es finalizar_compra)
- Agradecimientos o confirmaciones → consulta_general

🔍 CONTEXTO:
- Si el mensaje anterior fue una respuesta sobre libros de inglés a pedido → "Dale" es consulta_general
- Si el mensaje anterior mostró productos → "1" o "el primero" es agregar_carrito
- Si el usuario tiene carrito con productos → "Pagar" es finalizar_compra

FORMATO DE SALIDA (JSON):
{
  "tipo_accion": "agregar_carrito",
  "confianza": 0.95,
  "variables_completas": true,
  "variables_faltantes": []
}`;

    // Actualizar extractionConfig.systemPrompt
    clasificador.data.config.extractionConfig.systemPrompt = nuevoSystemPrompt;
    
    await flowsCollection.updateOne(
      { _id: flow._id },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ SystemPrompt del clasificador actualizado');
    console.log('\n📋 Cambios principales:');
    console.log('   ✅ Agregadas reglas para NO confundir agradecimientos con compras');
    console.log('   ✅ "Dale", "Ok", "Perfecto" → consulta_general');
    console.log('   ✅ Solo agregar_carrito si hay productos presentados');
    console.log('   ✅ Solo finalizar_compra si usuario explícitamente quiere pagar');
    console.log('   ✅ Consideración de contexto de la conversación');
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

mejorarClasificador();
