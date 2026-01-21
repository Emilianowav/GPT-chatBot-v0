import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function actualizarFlujoExistente() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar TODOS los flujos de Veo Veo
    const empresaId = new ObjectId('6940a9a181b92bfce970fdb5');
    const flows = await flowsCollection.find({ empresaId }).toArray();
    
    console.log(`📋 Flujos encontrados: ${flows.length}\n`);
    
    flows.forEach((flow, i) => {
      console.log(`${i + 1}. ${flow.nombre}`);
      console.log(`   ID: ${flow._id.toString()}`);
      console.log(`   Activo: ${flow.activo ? 'SÍ' : 'NO'}`);
    });
    
    // Tomar el primer flujo (el que existe)
    const flow = flows[0];
    
    if (!flow) {
      console.log('\n❌ No hay flujos');
      return;
    }
    
    console.log(`\n🔧 Actualizando: ${flow.nombre}`);
    console.log(`   ID: ${flow._id.toString()}\n`);
    
    // Variables globales que necesita VeoVeo
    const variablesGlobales = {
      telefono_cliente: "",
      telefono_empresa: "",
      mensaje_usuario: "",
      productos_presentados: [],
      productos_formateados: "",
      titulo: "",
      autor: "",
      editorial: "",
      edicion: "",
      carrito_id: "",
      carrito_items_count: 0,
      carrito_total: 0,
      mercadopago_link: "",
      mercadopago_preference_id: "",
      mercadopago_estado: ""
    };
    
    // Actualizar systemPrompt del nodo GPT asistente
    const gptNodeIndex = flow.nodes.findIndex(n => n.id === 'gpt-asistente-ventas');
    if (gptNodeIndex !== -1) {
      const nuevoPrompt = `Sos un asistente de ventas de la Librería Veo Veo 📚.

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

      flow.nodes[gptNodeIndex].data.config.systemPrompt = nuevoPrompt;
      console.log('✅ SystemPrompt actualizado en nodo gpt-asistente-ventas');
    }
    
    // Asegurar que config existe
    if (!flow.config) {
      flow.config = {};
    }
    
    // Agregar variables globales
    flow.config.variables_globales = variablesGlobales;
    console.log('✅ Variables globales agregadas:', Object.keys(variablesGlobales).length);
    
    // Guardar en BD
    await flowsCollection.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          nodes: flow.nodes,
          config: flow.config,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados en BD');
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ FLUJO ACTUALIZADO');
    console.log('═'.repeat(80));
    
    console.log('\n📊 Configuración:');
    console.log(`  - ID del flujo: ${flow._id.toString()}`);
    console.log(`  - Variables globales: ${Object.keys(variablesGlobales).length}`);
    console.log(`  - productos_formateados: ✅`);
    console.log(`  - Nodo GPT actualizado: ✅`);
    
    console.log('\n🔄 Refrescá el Flow Builder para ver las variables');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

actualizarFlujoExistente();
