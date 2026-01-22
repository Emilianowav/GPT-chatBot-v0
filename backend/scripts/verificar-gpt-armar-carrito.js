import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarGPTArmarCarrito() {
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
    console.log('🔍 VERIFICAR GPT ARMAR CARRITO');
    console.log('═'.repeat(80));
    
    const nodoCarrito = wooFlow.nodes.find(n => n.id === 'gpt-armar-carrito');
    
    if (!nodoCarrito) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }
    
    console.log('\n📋 CONFIGURACIÓN ACTUAL:');
    console.log('─'.repeat(80));
    console.log('ID:', nodoCarrito.id);
    console.log('Label:', nodoCarrito.data?.label);
    console.log('Tipo:', nodoCarrito.data?.config?.tipo);
    console.log('Modelo:', nodoCarrito.data?.config?.model);
    console.log('\nVariables de entrada:', nodoCarrito.data?.config?.variablesEntrada?.join(', '));
    console.log('Variables de salida:', nodoCarrito.data?.config?.globalVariablesOutput?.join(', '));
    
    console.log('\n📝 SYSTEM PROMPT ACTUAL:');
    console.log('─'.repeat(80));
    const systemPrompt = nodoCarrito.data?.config?.systemPrompt || 'NO CONFIGURADO';
    console.log(systemPrompt);
    
    console.log('\n═'.repeat(80));
    console.log('💡 ANÁLISIS');
    console.log('═'.repeat(80));
    
    const variablesSalida = nodoCarrito.data?.config?.globalVariablesOutput || [];
    
    console.log('\n✅ Variables que DEBE actualizar:');
    console.log('   1. carrito_items - Array de productos: [{ id, nombre, precio, cantidad }]');
    console.log('   2. carrito_total - Suma total de precios');
    console.log('   3. carrito_items_count - Cantidad de items');
    
    console.log('\n📊 Variables configuradas actualmente:');
    variablesSalida.forEach(v => console.log(`   - ${v}`));
    
    if (!variablesSalida.includes('carrito_items')) {
      console.log('\n⚠️  FALTA: carrito_items no está en globalVariablesOutput');
    }
    if (!variablesSalida.includes('carrito_total')) {
      console.log('⚠️  FALTA: carrito_total no está en globalVariablesOutput');
    }
    if (!variablesSalida.includes('carrito_items_count')) {
      console.log('⚠️  FALTA: carrito_items_count no está en globalVariablesOutput');
    }
    
    console.log('\n═'.repeat(80));
    console.log('🔧 SYSTEM PROMPT CORRECTO');
    console.log('═'.repeat(80));
    
    const promptCorrecto = `Eres un asistente de carrito de compras para Librería Veo Veo.

TAREA: Extraer los productos que el usuario quiere agregar al carrito del historial de conversación.

CONTEXTO:
- El usuario ya vio una lista de productos numerados
- El usuario puede decir: "1 y 2", "el 3", "Lo quiero", "Quiero comprarlo", etc.
- Debes buscar en el historial qué productos corresponden a esos números

VARIABLES DE ENTRADA:
- productos_formateados: Lista de productos que se le mostró al usuario
- mensaje_usuario: Lo que el usuario acaba de decir

SALIDA REQUERIDA (JSON):
{
  "carrito_items": [
    {
      "id": "producto-123",
      "nombre": "HARRY POTTER Y LA ORDEN DEL FENIX",
      "precio": 49000,
      "cantidad": 1
    }
  ],
  "carrito_total": 49000,
  "carrito_items_count": 1
}

REGLAS:
1. Si el usuario dice números (ej: "1 y 2"), busca esos productos en productos_formateados
2. Si el usuario dice "lo quiero" o "quiero comprarlo", agrega el último producto mencionado
3. carrito_total = suma de (precio * cantidad) de todos los items
4. carrito_items_count = cantidad total de items
5. SIEMPRE devuelve JSON válido con estos 3 campos

EJEMPLOS:

Historial:
- Bot: "1. HARRY POTTER (Precio: $49000)"
- Usuario: "1"

Salida:
{
  "carrito_items": [{"id": "hp-1", "nombre": "HARRY POTTER", "precio": 49000, "cantidad": 1}],
  "carrito_total": 49000,
  "carrito_items_count": 1
}

Historial:
- Bot: "1. LIBRO A ($10000), 2. LIBRO B ($20000)"
- Usuario: "1 y 2"

Salida:
{
  "carrito_items": [
    {"id": "a-1", "nombre": "LIBRO A", "precio": 10000, "cantidad": 1},
    {"id": "b-2", "nombre": "LIBRO B", "precio": 20000, "cantidad": 1}
  ],
  "carrito_total": 30000,
  "carrito_items_count": 2
}`;

    console.log(promptCorrecto);
    
    console.log('\n💾 ¿Actualizar el systemPrompt y globalVariablesOutput?');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verificarGPTArmarCarrito();
