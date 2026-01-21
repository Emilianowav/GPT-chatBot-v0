import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function configurarFlujoVeoVeo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar flujo de Veo Veo por empresaId
    const empresaId = new ObjectId('6940a9a181b92bfce970fdb5');
    const flow = await flowsCollection.findOne({ empresaId });
    
    if (!flow) {
      console.log('❌ Flujo de Veo Veo no encontrado');
      return;
    }
    
    console.log('✅ Flujo encontrado:', flow.nombre || flow._id);
    console.log('📋 Nodos:', flow.nodes?.length || 0);
    
    // ========================================
    // 1. CONFIGURAR VARIABLES GLOBALES
    // ========================================
    console.log('\n📊 CONFIGURANDO VARIABLES GLOBALES...\n');
    
    const variablesGlobales = {
      // Variables del sistema (se llenan automáticamente)
      telefono_cliente: '',
      telefono_empresa: '',
      mensaje_usuario: '',
      
      // Variables de productos (se llenan cuando WooCommerce devuelve resultados)
      productos_presentados: [],
      productos_formateados: '',
      
      // Variables de datos del cliente (se llenan por GPT formateador)
      titulo: '',
      autor: '',
      editorial: '',
      edicion: '',
      
      // Variables del carrito (se llenan cuando se agregan productos)
      carrito_id: '',
      carrito_items_count: 0,
      carrito_total: 0,
      
      // Variables de MercadoPago (se llenan al crear preferencia)
      mercadopago_link: '',
      mercadopago_preference_id: '',
      mercadopago_estado: ''
    };
    
    console.log('Variables globales a configurar:');
    Object.keys(variablesGlobales).forEach(key => {
      console.log(`  - ${key}`);
    });
    
    // ========================================
    // 2. ACTUALIZAR NODO GPT-ASISTENTE-VENTAS
    // ========================================
    console.log('\n🤖 CONFIGURANDO NODO GPT-ASISTENTE-VENTAS...\n');
    
    const gptNodeIndex = flow.nodes?.findIndex(n => n.id === 'gpt-asistente-ventas');
    
    if (gptNodeIndex === -1 || gptNodeIndex === undefined) {
      console.log('❌ Nodo gpt-asistente-ventas no encontrado');
      console.log('Nodos disponibles:');
      flow.nodes?.forEach(n => console.log(`  - ${n.id} (${n.type})`));
      return;
    }
    
    const gptNode = flow.nodes[gptNodeIndex];
    console.log('✅ Nodo encontrado:', gptNode.id);
    
    // Nuevo systemPrompt optimizado
    const nuevoSystemPrompt = `Sos un asistente de ventas de la Librería Veo Veo 📚.

TU TAREA:
Presentar los resultados de búsqueda de libros de forma atractiva y ayudar al cliente a elegir.

📚 PRODUCTOS ENCONTRADOS:
{{productos_formateados}}

REGLA CRÍTICA:
- Presenta EXACTAMENTE los productos listados arriba en {{productos_formateados}}
- NO inventes productos que no estén en la lista
- Los productos ya están formateados con número, título, precio y stock
- Si {{productos_formateados}} está vacío, informa que no se encontraron resultados

FORMATO DE RESPUESTA:
Perfecto😊, estos son los resultados que coinciden con tu búsqueda:

📚 Resultados encontrados:

{{productos_formateados}}

💡 ¿Cuál libro querés agregar a tu compra?

→ Escribí el número del libro que buscás
→ Escribí 0 para volver al menú principal

SI NO HAY STOCK:
Lo sentimos, este libro parece no encontrarse en stock en este momento, de todas formas nos encontramos haciendo pedidos a las editoriales y puede que lo tengamos disponible en muy poco tiempo.

Podés consultar si tu producto estará en stock pronto, en ese caso podés reservarlo.`;

    // Actualizar configuración del nodo
    flow.nodes[gptNodeIndex].data.config.systemPrompt = nuevoSystemPrompt;
    
    console.log('✅ SystemPrompt actualizado');
    console.log('📝 Usa la variable: {{productos_formateados}}');
    
    // ========================================
    // 3. GUARDAR EN BD
    // ========================================
    console.log('\n💾 GUARDANDO CAMBIOS EN BD...\n');
    
    // Actualizar config con variables globales
    if (!flow.config) {
      flow.config = {};
    }
    
    flow.config.variables_globales = variablesGlobales;
    flow.config.topicos_habilitados = flow.config.topicos_habilitados || false;
    flow.config.topicos = flow.config.topicos || {};
    
    // Guardar en BD
    await flowsCollection.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          nodes: flow.nodes,
          config: flow.config
        } 
      }
    );
    
    console.log('✅ Flujo actualizado en BD');
    
    // ========================================
    // 4. RESUMEN
    // ========================================
    console.log('\n' + '═'.repeat(80));
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('═'.repeat(80));
    
    console.log('\n📊 Variables Globales configuradas:');
    Object.entries(variablesGlobales).forEach(([key, value]) => {
      const tipo = Array.isArray(value) ? 'array' : typeof value;
      console.log(`  ✓ ${key} (${tipo})`);
    });
    
    console.log('\n🤖 Nodo GPT configurado:');
    console.log('  ✓ gpt-asistente-ventas');
    console.log('  ✓ Usa {{productos_formateados}} en systemPrompt');
    
    console.log('\n🔄 Flujo de datos:');
    console.log('  1. WooCommerce busca productos');
    console.log('  2. Backend crea productos_formateados (texto legible)');
    console.log('  3. GPT recibe productos_formateados en systemPrompt');
    console.log('  4. GPT presenta productos reales (no inventados)');
    
    console.log('\n✅ TODO LISTO - El flujo está configurado correctamente');
    console.log('   Esperá que termine el deploy y probá enviando "Busco García Márquez"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configurarFlujoVeoVeo();
