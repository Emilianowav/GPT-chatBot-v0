require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * FIX COMPLETO DEL FLUJO
 * 
 * PROBLEMAS:
 * 1. Formateador NO es inteligente (no normaliza "harry potter 3" → "prisionero de azkaban")
 * 2. Router NO valida editorial/edición (debe pedir datos si son null)
 * 3. GPT resultados muestra {{editorial}} sin resolver
 * 
 * SOLUCIONES:
 * 1. Formateador INTELIGENTE con normalización
 * 2. Router valida titulo + editorial + edicion (todos requeridos)
 * 3. GPT resultados sin variables opcionales en el prompt
 */

async function fixFlowCompletoFinal() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('FIX COMPLETO DEL FLUJO WOOCOMMERCE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`✅ Flow encontrado: ${flow.nombre}\n`);
    
    // ═══════════════════════════════════════════════════════════
    // 1. GPT FORMATEADOR INTELIGENTE
    // ═══════════════════════════════════════════════════════════
    console.log('1️⃣  CONFIGURANDO GPT FORMATEADOR INTELIGENTE');
    console.log('─'.repeat(63));
    
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'gpt' && node.id === 'gpt-formateador') {
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        // Personalidad INTELIGENTE
        node.data.config.personalidad = `Eres un asistente INTELIGENTE especializado en libros.

TU TAREA PRINCIPAL:
1. ENTENDER la intención del usuario y normalizar a título oficial
2. EXTRAER título, editorial y edición del historial completo
3. Si el usuario NO menciona editorial/edición, extraer como null

NORMALIZACIÓN INTELIGENTE:
- "harry potter 3" → "Harry Potter y el Prisionero de Azkaban"
- "hp 3" → "Harry Potter y el Prisionero de Azkaban"
- "prisionero de azkaban" → "Harry Potter y el Prisionero de Azkaban"
- "harry potter 1" → "Harry Potter y la Piedra Filosofal"
- "harry potter 2" → "Harry Potter y la Cámara Secreta"

IMPORTANTE:
- Normaliza SIEMPRE el título a su forma oficial
- Editorial y edición son OPCIONALES (null si no se mencionan)
- NO pidas datos que el usuario no mencionó

RESPUESTAS:
- Con título: "Perfecto, buscando [título oficial]..."
- Sin título: "¿Qué libro estás buscando?"`;

        // Extracción INTELIGENTE
        node.data.config.extractionConfig = {
          enabled: true,
          method: 'advanced',
          contextSource: 'historial_completo',
          systemPrompt: `Analiza el historial completo y extrae los datos del libro.

NORMALIZACIÓN INTELIGENTE DE TÍTULOS:
- "harry potter 3", "hp 3", "prisionero" → titulo = "Harry Potter y el Prisionero de Azkaban"
- "harry potter 1", "hp 1", "piedra filosofal" → titulo = "Harry Potter y la Piedra Filosofal"
- "harry potter 2", "hp 2", "camara secreta" → titulo = "Harry Potter y la Cámara Secreta"
- "harry potter 4", "hp 4", "caliz de fuego" → titulo = "Harry Potter y el Cáliz de Fuego"
- "harry potter 5", "hp 5", "orden del fenix" → titulo = "Harry Potter y la Orden del Fénix"
- "harry potter 6", "hp 6", "misterio del principe" → titulo = "Harry Potter y el Misterio del Príncipe"
- "harry potter 7", "hp 7", "reliquias de la muerte" → titulo = "Harry Potter y las Reliquias de la Muerte"

REGLAS:
- titulo: OBLIGATORIO. Normalizar a título oficial completo
- editorial: OPCIONAL. Solo si el usuario la menciona. Si no, null
- edicion: OPCIONAL. Solo si el usuario la menciona. Si no, null

EJEMPLOS:
Usuario: "busco harry potter 3"
→ { titulo: "Harry Potter y el Prisionero de Azkaban", editorial: null, edicion: null }

Usuario: "quiero hp 3 de scholastic"
→ { titulo: "Harry Potter y el Prisionero de Azkaban", editorial: "Scholastic", edicion: null }

Usuario: "prisionero de azkaban primera edición"
→ { titulo: "Harry Potter y el Prisionero de Azkaban", editorial: null, edicion: "Primera" }`,
          variables: [
            {
              nombre: 'titulo',
              tipo: 'texto',
              requerido: true,
              descripcion: 'Título OFICIAL del libro (normalizado)'
            },
            {
              nombre: 'editorial',
              tipo: 'texto',
              requerido: false,
              descripcion: 'Editorial (solo si la menciona)'
            },
            {
              nombre: 'edicion',
              tipo: 'texto',
              requerido: false,
              descripcion: 'Edición (solo si la menciona)'
            }
          ]
        };
        
        node.data.config.modelo = 'gpt-3.5-turbo';
        node.data.config.temperatura = 0.3;
        
        console.log('   ✅ Personalidad INTELIGENTE');
        console.log('   ✅ Normalización de títulos configurada');
        console.log('   ✅ Extracción: titulo (requerido), editorial/edicion (opcionales)');
      }
    }
    
    console.log('');
    
    // ═══════════════════════════════════════════════════════════
    // 2. ROUTER CON VALIDACIÓN COMPLETA
    // ═══════════════════════════════════════════════════════════
    console.log('2️⃣  CONFIGURANDO ROUTER CON VALIDACIÓN');
    console.log('─'.repeat(63));
    
    // Actualizar edges del router
    for (let i = 0; i < flow.edges.length; i++) {
      const edge = flow.edges[i];
      
      if (edge.source === 'router') {
        if (!edge.data) edge.data = {};
        
        if (edge.sourceHandle === 'route-1') {
          // Ruta 1: Faltan datos (titulo OR editorial OR edicion son null/undefined)
          edge.data.label = 'Faltan datos';
          edge.data.condition = '{{titulo}} not exists OR {{editorial}} not exists OR {{edicion}} not exists';
          console.log('   ✅ Ruta 1 (Faltan datos): titulo OR editorial OR edicion = null');
        } else if (edge.sourceHandle === 'route-2') {
          // Ruta 2: Datos completos (titulo AND editorial AND edicion existen)
          edge.data.label = 'Datos completos';
          edge.data.condition = '{{titulo}} exists AND {{editorial}} exists AND {{edicion}} exists';
          console.log('   ✅ Ruta 2 (Datos completos): titulo AND editorial AND edicion existen');
        }
      }
    }
    
    console.log('');
    
    // ═══════════════════════════════════════════════════════════
    // 3. GPT RESULTADOS SIN VARIABLES OPCIONALES
    // ═══════════════════════════════════════════════════════════
    console.log('3️⃣  CONFIGURANDO GPT RESULTADOS');
    console.log('─'.repeat(63));
    
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'gpt' && node.id === 'gpt-resultados') {
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        // Personalidad SIN mencionar editorial/edición
        node.data.config.personalidad = `Eres un asistente de librería amigable y profesional.

TU TAREA:
Presentar los resultados de la búsqueda de productos de WooCommerce de forma clara y atractiva.

DATOS DISPONIBLES:
- {{titulo}}: Título buscado
- {{productos}}: Array de productos encontrados

FORMATO DE RESPUESTA:
Si hay productos:
"✅ Encontré [cantidad] resultado(s) para '[titulo]':

[Lista de productos con nombre, precio, stock]"

Si NO hay productos:
"❌ No encontré resultados para '[titulo]'.

¿Podrías verificar el título? También puedo ayudarte a buscar de otra manera 😊"

IMPORTANTE:
- NO menciones editorial ni edición en la respuesta
- Sé breve y directo
- Usa emojis para hacerlo más amigable`;

        console.log('   ✅ Personalidad sin variables opcionales');
        console.log('   ✅ Solo usa: titulo y productos');
      }
    }
    
    console.log('');
    
    // Guardar
    await flowsCollection.updateOne(
      { _id: FLOW_ID },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('✅ Flow actualizado en base de datos\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const updatedFlow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    const gptForm = updatedFlow.nodes.find(n => n.id === 'gpt-formateador');
    const routerEdges = updatedFlow.edges.filter(e => e.source === 'router');
    const gptRes = updatedFlow.nodes.find(n => n.id === 'gpt-resultados');
    
    console.log('📋 GPT Formateador:');
    console.log(`   Extracción: ${gptForm.data?.config?.extractionConfig ? 'SÍ' : 'NO'}`);
    console.log(`   Variables: ${gptForm.data?.config?.extractionConfig?.variables?.length || 0}`);
    console.log('');
    
    console.log('📋 Router:');
    routerEdges.forEach(edge => {
      console.log(`   ${edge.data?.label}: ${edge.data?.condition || 'SIN CONDICIÓN'}`);
    });
    console.log('');
    
    console.log('📋 GPT Resultados:');
    console.log(`   Personalidad: ${gptRes.data?.config?.personalidad ? 'SÍ' : 'NO'}`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('FLUJO ESPERADO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('ITERACIÓN 1:');
    console.log('Usuario: "busco harry potter 3"');
    console.log('→ Formateador extrae: { titulo: "Harry Potter y el Prisionero de Azkaban", editorial: null, edicion: null }');
    console.log('→ Router evalúa: editorial = null OR edicion = null → TRUE');
    console.log('→ Va por Ruta 1 (Faltan datos)');
    console.log('→ GPT conversacional pregunta: "¿De qué editorial y edición?"');
    console.log('');
    
    console.log('ITERACIÓN 2:');
    console.log('Usuario: "scholastic, primera edición"');
    console.log('→ Formateador extrae: { titulo: "Harry Potter y el Prisionero de Azkaban", editorial: "Scholastic", edicion: "Primera" }');
    console.log('→ Router evalúa: titulo AND editorial AND edicion existen → TRUE');
    console.log('→ Va por Ruta 2 (Datos completos)');
    console.log('→ WooCommerce busca el producto');
    console.log('→ GPT resultados muestra los productos encontrados');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlowCompletoFinal();
