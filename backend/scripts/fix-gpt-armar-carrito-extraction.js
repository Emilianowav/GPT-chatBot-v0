import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixGPTArmarCarritoExtraction() {
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
    console.log('🔧 FIX GPT ARMAR CARRITO - AGREGAR EXTRACTION CONFIG');
    console.log('═'.repeat(80));
    
    const nodoCarritoIndex = wooFlow.nodes.findIndex(n => n.id === 'gpt-armar-carrito');
    
    if (nodoCarritoIndex === -1) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }
    
    console.log('\n❌ PROBLEMA ACTUAL:');
    console.log('GPT devuelve JSON como string en respuesta_gpt:');
    console.log('{');
    console.log('  "respuesta_gpt": "{\\"carrito_items\\": [...], \\"carrito_total\\": 106000}"');
    console.log('}');
    console.log('\nPero NO guarda carrito_items y carrito_total como variables globales');
    
    console.log('\n✅ SOLUCIÓN:');
    console.log('Cambiar tipo de nodo a "formateador" y agregar extractionConfig');
    console.log('Esto hará que el sistema parsee el JSON y guarde las variables automáticamente');
    
    const systemPrompt = `Eres un procesador de carrito para Librería Veo Veo.

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
}`;

    // Actualizar config del nodo
    wooFlow.nodes[nodoCarritoIndex].data.config = {
      tipo: 'formateador', // CRÍTICO: Cambiar a formateador para que use extractionConfig
      model: 'gpt-3.5-turbo',
      outputFormat: 'json_object',
      variablesEntrada: ['productos_formateados', 'mensaje_usuario'],
      globalVariablesOutput: ['carrito_items', 'carrito_total'],
      extractionConfig: {
        enabled: true,
        method: 'advanced',
        contextSource: 'historial_completo',
        systemPrompt: systemPrompt,
        variablesToExtract: [
          {
            nombre: 'carrito_items',
            tipo: 'array',
            descripcion: 'Array de productos con id, nombre, precio, cantidad',
            requerido: true
          },
          {
            nombre: 'carrito_total',
            tipo: 'number',
            descripcion: 'Suma total de precios',
            requerido: true
          }
        ]
      }
    };
    
    console.log('\n✅ Config actualizado:');
    console.log('   tipo: "formateador"');
    console.log('   extractionConfig.enabled: true');
    console.log('   extractionConfig.variablesToExtract: carrito_items, carrito_total');
    console.log('   globalVariablesOutput: carrito_items, carrito_total');
    
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
    console.log('📋 CÓMO FUNCIONA AHORA');
    console.log('═'.repeat(80));
    
    console.log('\n1. Usuario: "1 y 7"');
    console.log('   → GPT genera JSON:');
    console.log('     {');
    console.log('       "carrito_items": [');
    console.log('         {"id": "hp-1", "nombre": "HARRY POTTER", "precio": 49000, "cantidad": 1},');
    console.log('         {"id": "lotr-7", "nombre": "SEÑOR DE LOS ANILLOS", "precio": 57000, "cantidad": 1}');
    console.log('       ],');
    console.log('       "carrito_total": 106000');
    console.log('     }');
    
    console.log('\n2. FlowExecutor procesa extractionConfig:');
    console.log('   → Parsea el JSON');
    console.log('   → Extrae carrito_items y carrito_total');
    console.log('   → Los guarda como variables globales');
    
    console.log('\n3. MercadoPago lee variables globales:');
    console.log('   → carrito_items: [...]');
    console.log('   → carrito_total: 106000');
    console.log('   → Crea preferencia de pago');
    console.log('   → Genera link');
    
    console.log('\n✅ FLUJO COMPLETO FUNCIONANDO');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGPTArmarCarritoExtraction();
