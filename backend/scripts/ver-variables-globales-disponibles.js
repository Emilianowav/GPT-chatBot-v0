import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verVariablesGlobales() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 ANÁLISIS DE VARIABLES GLOBALES DISPONIBLES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Buscar todos los nodos que generan variables globales
    const nodosConVariables = wooFlow.nodes.filter(n => 
      n.data.config?.globalVariablesOutput && 
      n.data.config.globalVariablesOutput.length > 0
    );
    
    console.log('📊 NODOS QUE GENERAN VARIABLES GLOBALES:\n');
    
    nodosConVariables.forEach(nodo => {
      console.log(`   ${nodo.id} (${nodo.type}):`);
      console.log(`   Variables: ${JSON.stringify(nodo.data.config.globalVariablesOutput)}`);
      console.log('');
    });
    
    // Buscar nodo de WooCommerce para ver qué productos presenta
    const nodoWoo = wooFlow.nodes.find(n => n.type === 'woocommerce');
    if (nodoWoo) {
      console.log('📦 NODO WOOCOMMERCE:');
      console.log(`   ID: ${nodoWoo.id}`);
      console.log(`   Genera: productos_presentados, productos_formateados`);
      console.log('');
    }
    
    // Ver nodo clasificador
    const nodoClasificador = wooFlow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    if (nodoClasificador) {
      console.log('🤖 NODO CLASIFICADOR:');
      console.log(`   Variables: ${JSON.stringify(nodoClasificador.data.config.globalVariablesOutput)}`);
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 VARIABLES DISPONIBLES PARA EL CARRITO:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('✅ De nodo 1 (WhatsApp Trigger):');
    console.log('   - {{1.from}} → teléfono del cliente');
    console.log('   - {{1.message}} → mensaje del usuario');
    console.log('   - {{1.phoneNumberId}} → ID del número de WhatsApp\n');
    
    console.log('✅ De gpt-clasificador-inteligente:');
    console.log('   - {{tipo_accion}} → tipo de acción (agregar_carrito, finalizar_compra, etc.)');
    console.log('   - {{confianza}} → nivel de confianza');
    console.log('   - {{variables_completas}} → si tiene todas las variables\n');
    
    console.log('✅ De nodos WooCommerce:');
    console.log('   - {{productos_presentados}} → array de productos mostrados');
    console.log('   - {{productos_formateados}} → productos formateados para WhatsApp');
    console.log('   - {{mensaje_usuario}} → índice seleccionado por el usuario\n');
    
    console.log('✅ Variables del sistema:');
    console.log('   - {{telefono_cliente}} → teléfono del cliente');
    console.log('   - {{telefono_empresa}} → teléfono de la empresa');
    console.log('   - {{phoneNumberId}} → ID del número de WhatsApp\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 DISEÑO DEL NODO GPT CARRITO:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('ENTRADA 1: Desde router-principal (agregar_carrito)');
    console.log('   - Tiene: productos_presentados, mensaje_usuario');
    console.log('   - Debe: Crear objeto carrito con el producto seleccionado\n');
    
    console.log('ENTRADA 2: Desde webhook MercadoPago');
    console.log('   - Tiene: confirmacion_pago = true');
    console.log('   - Debe: Generar mensaje de confirmación de pago\n');
    
    console.log('OUTPUT DEL GPT CARRITO:');
    console.log('   - respuesta_gpt → mensaje para el usuario');
    console.log('   - carrito → objeto con productos y total');
    console.log('   - accion_siguiente → "pagar" o "confirmar_pago"\n');
    
    console.log('ROUTER CARRITO:');
    console.log('   - Si accion_siguiente === "pagar" → ir a MercadoPago');
    console.log('   - Si accion_siguiente === "confirmar_pago" → ir a WhatsApp directo\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verVariablesGlobales();
