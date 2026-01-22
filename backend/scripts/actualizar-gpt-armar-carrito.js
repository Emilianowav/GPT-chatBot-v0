import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function actualizarGPTArmarCarrito() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ WooCommerce Flow no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('🔧 ACTUALIZAR GPT ARMAR CARRITO');
    console.log('═'.repeat(80));
    
    const nodoCarritoIndex = wooFlow.nodes.findIndex(n => n.id === 'gpt-armar-carrito');
    
    if (nodoCarritoIndex === -1) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }
    
    const nuevoSystemPrompt = `Eres un procesador de carrito de compras para Librería Veo Veo.

TAREA: Extraer los productos que el usuario quiere agregar al carrito.

CONTEXTO:
- El usuario ya vio una lista de productos numerados en productos_formateados
- El usuario puede decir: "1 y 2", "el 3", "Lo quiero", "Quiero comprarlo", etc.
- Debes identificar qué productos corresponden a esos números

PRODUCTOS DISPONIBLES:
{{productos_formateados}}

MENSAJE DEL USUARIO:
{{mensaje_usuario}}

REGLAS:
1. Si el usuario dice números (ej: "1 y 2", "el 3"), busca esos productos en productos_formateados
2. Si el usuario dice "lo quiero" o "quiero comprarlo", agrega el último producto mencionado
3. Extrae: id, nombre (titulo), precio de cada producto
4. carrito_total = suma de (precio * cantidad) de todos los items
5. carrito_items_count = cantidad total de items
6. SIEMPRE devuelve JSON válido con estos 3 campos: carrito_items, carrito_total, carrito_items_count

FORMATO DE SALIDA (JSON):
{
  "carrito_items": [
    {
      "id": "producto-id",
      "nombre": "NOMBRE DEL PRODUCTO",
      "precio": 49000,
      "cantidad": 1
    }
  ],
  "carrito_total": 49000,
  "carrito_items_count": 1
}

EJEMPLOS:

productos_formateados:
"1. HARRY POTTER Y LA ORDEN DEL FENIX
   💰 Precio: $49000
   📦 Stock: Disponible
   🔗 Link: https://..."

mensaje_usuario: "1"

Salida:
{
  "carrito_items": [{"id": "hp-1", "nombre": "HARRY POTTER Y LA ORDEN DEL FENIX", "precio": 49000, "cantidad": 1}],
  "carrito_total": 49000,
  "carrito_items_count": 1
}

---

productos_formateados:
"1. LIBRO A
   💰 Precio: $10000
2. LIBRO B
   💰 Precio: $20000"

mensaje_usuario: "1 y 2"

Salida:
{
  "carrito_items": [
    {"id": "libro-a", "nombre": "LIBRO A", "precio": 10000, "cantidad": 1},
    {"id": "libro-b", "nombre": "LIBRO B", "precio": 20000, "cantidad": 1}
  ],
  "carrito_total": 30000,
  "carrito_items_count": 2
}`;

    console.log('\n📝 SystemPrompt anterior (primeros 200 chars):');
    console.log(wooFlow.nodes[nodoCarritoIndex].data.config.systemPrompt?.substring(0, 200) + '...');
    
    // Actualizar systemPrompt
    wooFlow.nodes[nodoCarritoIndex].data.config.systemPrompt = nuevoSystemPrompt;
    wooFlow.nodes[nodoCarritoIndex].data.config.outputFormat = 'json_object';
    
    console.log('\n✅ Nuevo systemPrompt configurado');
    console.log('   outputFormat: json_object');
    
    // Guardar cambios
    console.log('\n💾 Guardando cambios...');
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    console.log(`   Modified count: ${result.modifiedCount}`);
    
    console.log('\n═'.repeat(80));
    console.log('📋 RESUMEN COMPLETO');
    console.log('═'.repeat(80));
    
    console.log('\n✅ CONFIGURACIONES COMPLETADAS:');
    console.log('1. Clasificador: Detecta "finalizar_compra" cuando usuario dice "como pago?"');
    console.log('2. Formateador: Marca variables_completas=true con titulo O autor');
    console.log('3. GPT Armar Carrito: Extrae productos del historial y actualiza carrito_items');
    console.log('4. MercadoPago: Config completo con titulo y notificationUrl');
    console.log('5. FlowExecutor.carrito.ts: Usa carrito_items (no productos_carrito)');
    console.log('6. FlowExecutor.ts: Productos incluyen links del ecommerce');
    
    console.log('\n🔄 FLUJO COMPLETO:');
    console.log('1. "Busco Harry Potter" → WooCommerce → Productos reales con links');
    console.log('2. "1 y 2" → GPT Armar Carrito → carrito_items actualizado');
    console.log('3. "Como pago?" → Clasificador → GPT Armar Carrito → MercadoPago → Link de pago');
    
    console.log('\n💡 PRÓXIMO PASO:');
    console.log('Probar el flujo completo vía WhatsApp:');
    console.log('   1. "Busco Harry Potter"');
    console.log('   2. "1 y 2"');
    console.log('   3. "Como pago?"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

actualizarGPTArmarCarrito();
