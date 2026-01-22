import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function diagnosticarProblema() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 DIAGNÓSTICO DEL PROBLEMA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 PROBLEMA REPORTADO:');
    console.log('   - gpt-armar-carrito NO guarda carrito_items ni carrito_total');
    console.log('   - mercadopago-crear-preference recibe variables undefined');
    console.log('   - Error: "El carrito está vacío"\n');
    
    // Ver configuración de gpt-armar-carrito
    const nodoGPT = wooFlow.nodes.find(n => n.id === 'gpt-armar-carrito');
    
    console.log('📊 NODO: gpt-armar-carrito');
    console.log('   Tipo:', nodoGPT.type);
    console.log('   Config tipo:', nodoGPT.data.config.tipo);
    console.log('   globalVariablesOutput:', nodoGPT.data.config.globalVariablesOutput);
    console.log('   outputFormat:', nodoGPT.data.config.outputFormat);
    console.log('\n   ⚠️  PROBLEMA: Este es un nodo GPT, no un nodo de carrito');
    console.log('   ⚠️  El GPT responde solo con respuesta_gpt, no genera carrito_items\n');
    
    // Ver configuración de mercadopago-crear-preference
    const nodoMP = wooFlow.nodes.find(n => n.id === 'mercadopago-crear-preference');
    
    console.log('📊 NODO: mercadopago-crear-preference');
    console.log('   Tipo:', nodoMP.type);
    console.log('   Config:', JSON.stringify(nodoMP.data.config, null, 2));
    console.log('\n   ⚠️  Este nodo espera recibir carrito_items y carrito_total\n');
    
    // Ver si hay nodos de tipo carrito
    const nodosCarrito = wooFlow.nodes.filter(n => n.type === 'carrito' || n.type === 'carrito-action');
    
    console.log('🔍 NODOS DE TIPO CARRITO EN EL FLUJO:');
    if (nodosCarrito.length === 0) {
      console.log('   ❌ NO HAY NODOS DE TIPO CARRITO\n');
    } else {
      nodosCarrito.forEach(n => {
        console.log(`   - ${n.id} (${n.type})`);
      });
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 SOLUCIÓN SEGÚN DOCUMENTACIÓN:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Según docs/RESUMEN-CARRITO-MERCADOPAGO.md:');
    console.log('');
    console.log('El flujo debería ser:');
    console.log('   1. Usuario selecciona producto (ej: "3")');
    console.log('   2. GPT identifica la selección');
    console.log('   3. [FALTA] Nodo tipo "carrito" con action: "agregar"');
    console.log('   4. Nodo carrito guarda carrito_items y carrito_total');
    console.log('   5. GPT confirma agregado');
    console.log('   6. MercadoPago usa las variables globales\n');
    
    console.log('📋 CONFIGURACIÓN CORRECTA DEL NODO CARRITO:');
    console.log(JSON.stringify({
      "id": "carrito-agregar",
      "type": "carrito",
      "data": {
        "label": "Agregar al Carrito",
        "config": {
          "action": "agregar",
          "itemFields": {
            "id": "{{productos_presentados[{{mensaje_usuario}} - 1].id}}",
            "nombre": "{{productos_presentados[{{mensaje_usuario}} - 1].titulo}}",
            "precio": "{{productos_presentados[{{mensaje_usuario}} - 1].precio}}",
            "cantidad": 1,
            "imagen": "{{productos_presentados[{{mensaje_usuario}} - 1].imagen}}",
            "metadata": {
              "permalink": "{{productos_presentados[{{mensaje_usuario}} - 1].url}}"
            }
          }
        }
      }
    }, null, 2));
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 ACCIÓN REQUERIDA:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Necesitamos agregar un nodo de tipo "carrito" ANTES de gpt-armar-carrito');
    console.log('Este nodo se encargará de:');
    console.log('   1. Agregar el producto al carrito en MongoDB');
    console.log('   2. Guardar carrito_items como variable global');
    console.log('   3. Guardar carrito_total como variable global');
    console.log('   4. Pasar el control a gpt-armar-carrito para confirmar\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

diagnosticarProblema();
