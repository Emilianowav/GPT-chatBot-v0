import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixFlujoCompleto() {
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
    console.log('🔧 FIX FLUJO COMPLETO - PROBLEMAS IDENTIFICADOS');
    console.log('═'.repeat(80));
    
    console.log('\n❌ PROBLEMA 1: Clasificador detecta mal');
    console.log('   "4 y 5 quiero" → tipo_accion: "ver_carrito"');
    console.log('   Debería ser: "agregar_carrito"');
    
    console.log('\n❌ PROBLEMA 2: WooCommerce no guarda productos_formateados');
    console.log('   El nodo WooCommerce genera productos_formateados en FlowExecutor.ts');
    console.log('   Pero NO lo guarda como variable global');
    
    console.log('\n❌ PROBLEMA 3: Router envía a nodo incorrecto');
    console.log('   "4 y 5 quiero" debería ir a: GPT Armar Carrito');
    console.log('   Pero va a: gpt-asistente-ventas (que inventa)');
    
    console.log('\n═'.repeat(80));
    console.log('🔧 SOLUCIONES');
    console.log('═'.repeat(80));
    
    // 1. Actualizar clasificador para detectar números
    const clasificadorIndex = wooFlow.nodes.findIndex(n => n.id === 'gpt-clasificador-inteligente');
    
    if (clasificadorIndex !== -1) {
      const nuevoPromptClasificador = `Eres un clasificador de intenciones para una librería.

TAREA: Clasificar la intención del usuario.

CATEGORÍAS:
1. "buscar_producto" - Busca un libro
   Ejemplos: "Busco Harry Potter", "Tenes García Márquez?"
   
2. "agregar_carrito" - Quiere agregar productos
   Ejemplos: "Lo quiero", "1 y 2", "4 y 5 quiero", "el 3", "Si quisiera agregarlo"
   
3. "finalizar_compra" - Quiere pagar
   Ejemplos: "Como pago?", "Quiero pagar", "Comprar"
   
4. "ver_carrito" - Ver carrito
   Ejemplos: "Ver carrito", "Que tengo en el carrito?"
   
5. "consulta_general" - Otras consultas
   Ejemplos: "Que horarios tienen?", "Donde están?"

REGLAS CRÍTICAS:
- Si el usuario dice NÚMEROS (ej: "1", "4 y 5", "el 3") → tipo_accion = "agregar_carrito"
- Si dice "lo quiero", "agregar", "comprar" → tipo_accion = "agregar_carrito"
- Si dice "pago", "pagar", "finalizar" → tipo_accion = "finalizar_compra"

FORMATO DE SALIDA (JSON):
{
  "tipo_accion": "agregar_carrito",
  "confianza": 0.95,
  "variables_completas": true,
  "variables_faltantes": []
}`;

      wooFlow.nodes[clasificadorIndex].data.config.extractionConfig.systemPrompt = nuevoPromptClasificador;
      console.log('\n✅ 1. Clasificador actualizado para detectar números');
    }
    
    // 2. Verificar router-principal
    const routerPrincipalIndex = wooFlow.nodes.findIndex(n => n.id === 'router-principal');
    const edges = wooFlow.edges.filter(e => e.source === 'router-principal');
    
    console.log('\n📋 2. Router Principal - Rutas actuales:');
    edges.forEach(edge => {
      const target = wooFlow.nodes.find(n => n.id === edge.target);
      console.log(`   ${edge.sourceHandle}: ${target?.data?.label} (${edge.target})`);
      console.log(`      Label: ${edge.data?.label}`);
    });
    
    console.log('\n⚠️  PROBLEMA: Necesitamos verificar que:');
    console.log('   - Ruta "agregar_carrito" → gpt-armar-carrito');
    console.log('   - Ruta "buscar_producto" → gpt-formateador');
    console.log('   - Ruta "finalizar_compra" → gpt-armar-carrito');
    
    // 3. Verificar que WooCommerce guarde productos_formateados
    console.log('\n📋 3. Nodo WooCommerce:');
    console.log('   El código en FlowExecutor.ts YA genera productos_formateados');
    console.log('   Pero debe guardarlo como variable global');
    console.log('   Verificar línea 1283 en FlowExecutor.ts');
    
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
    console.log('📋 FLUJO CORRECTO');
    console.log('═'.repeat(80));
    
    console.log('\n1. "Busco Harry Potter"');
    console.log('   → Clasificador: tipo_accion = "buscar_producto"');
    console.log('   → Router: Ruta "buscar_producto" → Formateador');
    console.log('   → Formateador: variables_completas = true');
    console.log('   → Router: Ruta "Buscar en WooCommerce" → WooCommerce');
    console.log('   → WooCommerce: Genera productos_formateados (GUARDAR COMO GLOBAL)');
    console.log('   → GPT Asistente: Presenta productos');
    
    console.log('\n2. "4 y 5 quiero"');
    console.log('   → Clasificador: tipo_accion = "agregar_carrito"');
    console.log('   → Router: Ruta "agregar_carrito" → GPT Armar Carrito');
    console.log('   → GPT Armar Carrito: Lee productos_formateados del historial');
    console.log('   → Actualiza: carrito_items, carrito_total');
    console.log('   → GPT Asistente: Confirma agregado');
    
    console.log('\n3. "Como pago?"');
    console.log('   → Clasificador: tipo_accion = "finalizar_compra"');
    console.log('   → Router: Ruta "finalizar_compra" → GPT Armar Carrito');
    console.log('   → Router Carrito: Ruta "b" → MercadoPago');
    console.log('   → MercadoPago: Genera link de pago');
    
    console.log('\n⚠️  ACCIÓN REQUERIDA:');
    console.log('1. Verificar que FlowExecutor.ts guarde productos_formateados como variable global');
    console.log('2. Verificar rutas del router-principal en el frontend');
    console.log('3. Reiniciar backend para aplicar cambios');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlujoCompleto();
