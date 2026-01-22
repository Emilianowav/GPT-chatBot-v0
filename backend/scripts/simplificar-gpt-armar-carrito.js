import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function simplificarGPTArmarCarrito() {
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
    console.log('🔧 SIMPLIFICAR GPT ARMAR CARRITO - USAR ESTRUCTURA EXISTENTE');
    console.log('═'.repeat(80));
    
    const nodoCarritoIndex = wooFlow.nodes.findIndex(n => n.id === 'gpt-armar-carrito');
    
    if (nodoCarritoIndex === -1) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }
    
    console.log('\n📋 LINEAMIENTOS DEL NODO MERCADOPAGO (executeMercadoPagoNode):');
    console.log('─'.repeat(80));
    console.log('Variables requeridas del contexto:');
    console.log('  • carrito_items - Array de productos con id, nombre, precio, cantidad');
    console.log('  • carrito_total - Total a cobrar');
    console.log('  • telefono_cliente - Teléfono del cliente (o usa {{1.from}})');
    console.log('\nEstructura de carrito_items:');
    console.log('  [');
    console.log('    { id: "producto-123", nombre: "HARRY POTTER", precio: 49000, cantidad: 1 }');
    console.log('  ]');
    
    const systemPromptSimplificado = `Eres un procesador de carrito para Librería Veo Veo.

TAREA: Extraer productos que el usuario quiere agregar del historial de conversación.

PRODUCTOS DISPONIBLES:
{{productos_formateados}}

MENSAJE DEL USUARIO:
{{mensaje_usuario}}

REGLAS:
1. Si usuario dice números (ej: "1 y 2"), busca esos productos en productos_formateados
2. Si dice "lo quiero" o "quiero comprarlo", agrega el último producto mencionado
3. Extrae: id, nombre, precio de cada producto
4. carrito_total = suma de precios
5. SIEMPRE devuelve JSON con: carrito_items, carrito_total

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
  "carrito_total": 49000
}

EJEMPLO:

productos_formateados:
"1. HARRY POTTER Y LA ORDEN DEL FENIX
   💰 Precio: $49000"

mensaje_usuario: "1"

Salida:
{
  "carrito_items": [
    {"id": "hp-1", "nombre": "HARRY POTTER Y LA ORDEN DEL FENIX", "precio": 49000, "cantidad": 1}
  ],
  "carrito_total": 49000
}`;

    // Actualizar nodo
    wooFlow.nodes[nodoCarritoIndex].data.config.systemPrompt = systemPromptSimplificado;
    wooFlow.nodes[nodoCarritoIndex].data.config.outputFormat = 'json_object';
    
    // Variables de salida: SOLO las que MercadoPago necesita
    wooFlow.nodes[nodoCarritoIndex].data.config.globalVariablesOutput = [
      'carrito_items',
      'carrito_total'
    ];
    
    console.log('\n✅ Configuración simplificada:');
    console.log('   Variables de salida:', wooFlow.nodes[nodoCarritoIndex].data.config.globalVariablesOutput.join(', '));
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
    console.log('📋 FLUJO SIMPLIFICADO');
    console.log('═'.repeat(80));
    
    console.log('\n1. Usuario: "1 y 2"');
    console.log('   → GPT Armar Carrito actualiza:');
    console.log('     • carrito_items: [{ id, nombre, precio, cantidad }]');
    console.log('     • carrito_total: 49000');
    
    console.log('\n2. Usuario: "Como pago?"');
    console.log('   → Clasificador: tipo_accion = "finalizar_compra"');
    console.log('   → Router: Ruta "b" → GPT Armar Carrito (reprocesa)');
    console.log('   → Router Carrito: Ruta "b" → MercadoPago');
    
    console.log('\n3. MercadoPago (executeMercadoPagoNode):');
    console.log('   → Lee carrito_items de variables globales');
    console.log('   → Lee carrito_total de variables globales');
    console.log('   → Lee telefono_cliente o {{1.from}}');
    console.log('   → Crea carrito en BD si no existe');
    console.log('   → Llama MercadoPagoService.crearPreferencia()');
    console.log('   → Genera link de pago');
    console.log('   → Actualiza variables globales:');
    console.log('     • link_pago');
    console.log('     • mensaje (con link formateado)');
    console.log('     • preferencia_id');
    console.log('     • estado_pago');
    
    console.log('\n4. WhatsApp:');
    console.log('   → Envía {{mensaje}} con el link de pago');
    
    console.log('\n✅ CÓDIGO SIMPLIFICADO - SIN DUPLICACIÓN');
    console.log('   • GPT Armar Carrito: Solo actualiza carrito_items y carrito_total');
    console.log('   • MercadoPago: Usa la lógica existente de executeMercadoPagoNode');
    console.log('   • No se duplica código de creación de preferencias');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

simplificarGPTArmarCarrito();
