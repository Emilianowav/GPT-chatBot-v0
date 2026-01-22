import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function configurarNodosGPT() {
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
    
    console.log('✅ Flujo encontrado:', wooFlow.nombre);
    console.log('🔗 Nodos totales:', wooFlow.nodes?.length);
    
    // Buscar nodos por executionCount
    const nodo4a = wooFlow.nodes.find(n => n.data?.executionCount === '4a');
    const nodo7a = wooFlow.nodes.find(n => n.data?.executionCount === '7a');
    
    console.log('\n📊 Nodos encontrados:');
    console.log('  Nodo 4a:', nodo4a ? `✅ ${nodo4a.id} (${nodo4a.data?.label})` : '❌ No encontrado');
    console.log('  Nodo 7a:', nodo7a ? `✅ ${nodo7a.id} (${nodo7a.data?.label})` : '❌ No encontrado');
    
    if (!nodo4a || !nodo7a) {
      console.log('\n⚠️  Listando todos los nodos con executionCount:');
      wooFlow.nodes.forEach(n => {
        if (n.data?.executionCount) {
          console.log(`  - ${n.data.executionCount}: ${n.id} (${n.data?.label || n.type})`);
        }
      });
      return;
    }
    
    // CONFIGURAR NODO 4A - GPT PROCESADOR CARRITO
    console.log('\n🔧 CONFIGURANDO NODO 4A - GPT PROCESADOR CARRITO');
    console.log('─'.repeat(80));
    
    const nodo4aIndex = wooFlow.nodes.findIndex(n => n.data?.executionCount === '4a');
    
    wooFlow.nodes[nodo4aIndex].data.config = {
      ...wooFlow.nodes[nodo4aIndex].data.config,
      tipo: 'procesador',
      module: 'procesador',
      modelo: 'gpt-4o-mini',
      temperatura: 0.3,
      maxTokens: 1000,
      systemPrompt: 'Sos un procesador inteligente del carrito de compras de Librería Veo Veo 📚.\n\nTU TAREA:\nAnalizar el mensaje del usuario y actualizar el carrito según su intención.\n\n📚 PRODUCTOS DISPONIBLES:\n{{productos_formateados}}\n\n📦 CARRITO ACTUAL:\nItems: {{carrito_items}}\nCantidad: {{carrito_items_count}}\nTotal: ${{carrito_total}}\n\nREGLAS CRÍTICAS:\n1. USA SOLO los productos de {{productos_formateados}}\n2. NO inventes productos que no estén en la lista\n3. Si el usuario dice "lo quiero", "agregar", "comprar" → agregar al carrito\n4. Si el usuario dice "quitar", "eliminar" → quitar del carrito\n5. Si el usuario pregunta por el carrito → mostrar contenido actual\n\nOUTPUT (JSON):\n{\n  "accion": "agregar" | "quitar" | "ver_carrito" | "consulta",\n  "producto_id": "ID del producto si aplica",\n  "producto_nombre": "Nombre del producto",\n  "cantidad": 1,\n  "carrito_actualizado": {\n    "items": [...],\n    "total": 0,\n    "cantidad_items": 0\n  }\n}',
      outputFormat: 'json_object',
      variablesEntrada: [
        'mensaje_usuario',
        'productos_formateados',
        'productos_presentados',
        'carrito_items',
        'carrito_items_count',
        'carrito_total'
      ],
      globalVariablesOutput: [
        'carrito_items',
        'carrito_items_count',
        'carrito_total'
      ]
    };
    
    console.log('✅ Nodo 4a configurado');
    console.log('   - Tipo: procesador');
    console.log('   - Modelo: gpt-4o-mini');
    console.log('   - Variables entrada: 6');
    console.log('   - Variables salida: 3');
    
    // CONFIGURAR NODO 7A - GPT CONVERSACIONAL PRESENTAR PRODUCTOS
    console.log('\n🔧 CONFIGURANDO NODO 7A - GPT CONVERSACIONAL PRESENTAR PRODUCTOS');
    console.log('─'.repeat(80));
    
    const nodo7aIndex = wooFlow.nodes.findIndex(n => n.data?.executionCount === '7a');
    
    wooFlow.nodes[nodo7aIndex].data.config = {
      ...wooFlow.nodes[nodo7aIndex].data.config,
      tipo: 'conversacional',
      module: 'conversacional',
      modelo: 'gpt-4o-mini',
      temperatura: 0.7,
      maxTokens: 800,
      systemPrompt: 'Sos un asistente de ventas de la Librería Veo Veo 📚.\n\nTU TAREA:\nPresentar los resultados de búsqueda de libros de forma atractiva y ayudar al cliente a elegir.\n\n📚 PRODUCTOS ENCONTRADOS:\n{{productos_formateados}}\n\nREGLA CRÍTICA:\n- Presenta EXACTAMENTE los productos listados arriba en {{productos_formateados}}\n- NO inventes productos que no estén en la lista\n- Los productos ya están formateados con número, título, precio y stock\n- Si {{productos_formateados}} está vacío, informa que no se encontraron resultados\n\nFORMATO DE RESPUESTA:\nPerfecto😊, estos son los resultados que coinciden con tu búsqueda:\n\n📚 Resultados encontrados:\n\n{{productos_formateados}}\n\n💡 ¿Cuál libro querés agregar a tu compra?\n\n→ Escribí el número del libro que buscás\n→ Escribí "ver carrito" para ver tu carrito\n→ Escribí 0 para volver al menú principal\n\nSI NO HAY STOCK:\nLo sentimos, este libro parece no encontrarse en stock en este momento, de todas formas nos encontramos haciendo pedidos a las editoriales y puede que lo tengamos disponible en muy poco tiempo.\n\nPodés consultar si tu producto estará en stock pronto, en ese caso podés reservarlo.',
      outputFormat: 'text',
      variablesEntrada: [
        'productos_formateados',
        'productos_presentados',
        'mensaje_usuario'
      ]
    };
    
    console.log('✅ Nodo 7a configurado');
    console.log('   - Tipo: conversacional');
    console.log('   - Modelo: gpt-4o-mini');
    console.log('   - Variables entrada: 3');
    
    // GUARDAR EN BD
    console.log('\n💾 Guardando cambios en BD...');
    
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
    console.log('   Modified count:', result.modifiedCount);
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ NODOS CONFIGURADOS');
    console.log('═'.repeat(80));
    
    console.log('\n📋 Resumen:');
    console.log('  ✓ Nodo 4a (GPT Procesador Carrito):');
    console.log('    - Lee: productos_formateados, carrito_items, carrito_total');
    console.log('    - Actualiza: carrito_items, carrito_items_count, carrito_total');
    console.log('    - Output: JSON con acción y carrito actualizado');
    
    console.log('\n  ✓ Nodo 7a (GPT Conversacional Productos):');
    console.log('    - Lee: productos_formateados');
    console.log('    - Presenta: Productos reales (no inventados)');
    console.log('    - Output: Texto amigable para WhatsApp');
    
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Refrescá el Flow Builder');
    console.log('   2. Verificá la configuración de ambos nodos');
    console.log('   3. Probá enviando "Busco García Márquez" a WhatsApp');
    console.log('   4. Verificá que GPT presente productos reales');
    console.log('   5. Probá "lo quiero" para agregar al carrito');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configurarNodosGPT();
