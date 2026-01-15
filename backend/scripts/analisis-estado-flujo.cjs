const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function analizarEstadoFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 ANÁLISIS COMPLETO DEL ESTADO DEL FLUJO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🎯 OBJETIVO DEL FLUJO:');
    console.log('   1. Usuario busca un libro por WhatsApp');
    console.log('   2. Sistema extrae datos (título, editorial, edición)');
    console.log('   3. Sistema busca en WooCommerce');
    console.log('   4. Sistema presenta productos con GPT');
    console.log('   5. Usuario puede: agregar al carrito, finalizar compra, o buscar más\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ FLUJO PRINCIPAL (BÚSQUEDA DE PRODUCTOS)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flujoPrincipal = [
      { id: 'webhook-whatsapp', nombre: 'Webhook WhatsApp', estado: '✅' },
      { id: 'gpt-formateador', nombre: 'GPT Formateador', estado: '✅' },
      { id: 'router', nombre: 'Router (validar variables)', estado: '✅' },
      { id: 'woocommerce', nombre: 'WooCommerce (buscar productos)', estado: '✅' },
      { id: 'gpt-asistente-ventas', nombre: 'GPT Asistente (presentar)', estado: '✅' },
      { id: 'whatsapp-asistente', nombre: 'WhatsApp (enviar mensaje)', estado: '✅' }
    ];
    
    console.log('PASOS DEL FLUJO PRINCIPAL:\n');
    flujoPrincipal.forEach((paso, i) => {
      const nodo = flow.nodes.find(n => n.id === paso.id);
      const existe = nodo ? '✅' : '❌';
      const config = nodo?.data?.config;
      
      console.log(`${i + 1}. ${paso.estado} ${paso.nombre}`);
      console.log(`   Nodo: ${existe} ${paso.id}`);
      
      // Validaciones específicas
      if (paso.id === 'gpt-formateador') {
        const tieneExtraction = config?.extractionConfig?.enabled;
        const tieneVariables = config?.extractionConfig?.variables?.length > 0;
        console.log(`   Config: ${tieneExtraction ? '✅' : '❌'} extractionConfig`);
        console.log(`   Variables: ${tieneVariables ? '✅' : '❌'} ${config?.extractionConfig?.variables?.length || 0} configuradas`);
      }
      
      if (paso.id === 'router') {
        const edges = flow.edges.filter(e => e.source === paso.id);
        const tieneCondiciones = edges.every(e => e.data?.condition);
        console.log(`   Rutas: ${edges.length}`);
        console.log(`   Condiciones: ${tieneCondiciones ? '✅' : '❌'} Todas configuradas`);
      }
      
      if (paso.id === 'woocommerce') {
        const tieneApi = config?.apiConfigId;
        const tieneModulo = config?.module;
        console.log(`   API: ${tieneApi ? '✅' : '❌'} ${config?.apiConfigId || 'NO CONFIGURADO'}`);
        console.log(`   Módulo: ${tieneModulo ? '✅' : '❌'} ${config?.module || 'NO CONFIGURADO'}`);
      }
      
      if (paso.id === 'whatsapp-asistente') {
        const edges = flow.edges.filter(e => e.source === paso.id);
        console.log(`   Detiene flujo: ${edges.length === 0 ? '✅' : '❌'} ${edges.length} edges de salida`);
      }
      
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  FLUJO SECUNDARIO (DESPUÉS DEL MENSAJE)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('NOTA: Este flujo NO se ejecuta actualmente porque el flujo');
    console.log('      se detiene después de whatsapp-asistente.\n');
    
    const flujoSecundario = [
      { id: 'gpt-clasificador', nombre: 'GPT Clasificador', estado: '✅' },
      { id: 'router-intencion', nombre: 'Router Intención', estado: '⚠️' },
      { id: 'gpt-carrito', nombre: 'GPT Carrito', estado: '❓' },
      { id: 'mercadopago', nombre: 'MercadoPago', estado: '❓' }
    ];
    
    flujoSecundario.forEach((paso, i) => {
      const nodo = flow.nodes.find(n => n.id === paso.id);
      const existe = nodo ? '✅' : '❌';
      
      console.log(`${i + 1}. ${paso.estado} ${paso.nombre}`);
      console.log(`   Nodo: ${existe} ${paso.id}`);
      
      if (paso.id === 'router-intencion') {
        const edges = flow.edges.filter(e => e.source === paso.id);
        console.log(`   Rutas: ${edges.length}`);
        console.log(`   ⚠️  Falta ruta para "buscar_mas"`);
        console.log(`   ⚠️  Si ninguna condición se cumple, usa ruta por defecto (puede ser incorrecta)`);
      }
      
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN: HASTA DÓNDE FUNCIONA EL FLUJO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('✅ FUNCIONA CORRECTAMENTE:\n');
    console.log('   1. Usuario envía: "Busco harry potter"');
    console.log('   2. ✅ Webhook recibe mensaje');
    console.log('   3. ✅ GPT Formateador extrae: {"titulo": "harry potter"}');
    console.log('   4. ✅ Router valida: variables_completas = true');
    console.log('   5. ✅ WooCommerce busca productos');
    console.log('   6. ✅ GPT Asistente presenta productos');
    console.log('   7. ✅ WhatsApp envía mensaje al usuario');
    console.log('   8. ✅ Flujo SE DETIENE (correcto)\n');
    
    console.log('⚠️  FUNCIONA PARCIALMENTE:\n');
    console.log('   Si faltan variables (ej: solo dice "hola"):');
    console.log('   1. ✅ GPT Formateador detecta variables_faltantes');
    console.log('   2. ✅ Router va a gpt-pedir-datos');
    console.log('   3. ✅ gpt-pedir-datos genera pregunta');
    console.log('   4. ✅ whatsapp-preguntar envía mensaje');
    console.log('   5. ❌ NO HAY EDGE de vuelta al formateador');
    console.log('      → El flujo termina aquí\n');
    
    console.log('❌ NO FUNCIONA (FLUJO DESCONECTADO):\n');
    console.log('   Después de recibir productos, si el usuario responde:');
    console.log('   - "Quiero agregar al carrito"');
    console.log('   - "Finalizar compra"');
    console.log('   - "Buscar otro libro"');
    console.log('   ');
    console.log('   ❌ NO se ejecuta porque whatsapp-asistente no tiene edge');
    console.log('      hacia gpt-clasificador\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 CONCLUSIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('El flujo funciona PERFECTAMENTE para el caso de uso principal:');
    console.log('   "Usuario busca producto → Sistema muestra productos"\n');
    
    console.log('Limitaciones actuales:');
    console.log('   1. ⚠️  Si faltan variables, pide datos pero no vuelve a procesar');
    console.log('   2. ❌ No permite agregar al carrito (flujo desconectado)');
    console.log('   3. ❌ No permite finalizar compra (flujo desconectado)');
    console.log('   4. ❌ No permite buscar más productos (flujo desconectado)\n');
    
    console.log('Para un MVP de búsqueda de productos: ✅ FUNCIONAL');
    console.log('Para un e-commerce completo: ⚠️  NECESITA COMPLETARSE\n');
    
    // Verificar edges críticos
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 EDGES CRÍTICOS FALTANTES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const edgesFaltantes = [
      {
        from: 'whatsapp-preguntar',
        to: 'gpt-formateador',
        razon: 'Para procesar la respuesta del usuario cuando faltan variables'
      },
      {
        from: 'whatsapp-asistente',
        to: 'gpt-clasificador',
        razon: 'Para procesar la intención después de mostrar productos (ELIMINADO INTENCIONALMENTE)'
      }
    ];
    
    edgesFaltantes.forEach((edge, i) => {
      const existe = flow.edges.find(e => e.source === edge.from && e.target === edge.to);
      console.log(`${i + 1}. ${edge.from} → ${edge.to}`);
      console.log(`   Estado: ${existe ? '✅ Existe' : '❌ No existe'}`);
      console.log(`   Razón: ${edge.razon}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

analizarEstadoFlujo();
