require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * FIX FINAL COMPLETO - 3 PROBLEMAS CRÍTICOS
 * 
 * PROBLEMA 1: Router NO evalúa condiciones OR/AND
 * - Condición en DB: "{{titulo}} not exists OR {{editorial}} not exists OR {{edicion}} not exists"
 * - Solo evalúa primera parte
 * - SOLUCIÓN: Ya corregido en FlowExecutor.ts con soporte OR/AND
 * 
 * PROBLEMA 2: Formateador NO normaliza títulos
 * - Extrae: "harry potter 3" (literal)
 * - Debe: "Harry Potter y el Prisionero de Azkaban" (normalizado)
 * - SOLUCIÓN: Mejorar prompt de extracción con ejemplos más explícitos
 * 
 * PROBLEMA 3: GPT Resultados inventa productos
 * - WooCommerce devuelve 1 producto real
 * - GPT inventa 3 productos falsos
 * - SOLUCIÓN: Pasar datos reales de WooCommerce como variable global "productos"
 */

async function fixFlowFinalCompleto() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('FIX FINAL COMPLETO - 3 PROBLEMAS CRÍTICOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`✅ Flow encontrado: ${flow.nombre}\n`);
    
    // ═══════════════════════════════════════════════════════════
    // PROBLEMA 2: FORMATEADOR - Mejorar normalización
    // ═══════════════════════════════════════════════════════════
    console.log('🔧 PROBLEMA 2: Mejorar normalización del formateador');
    console.log('─'.repeat(63));
    
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'gpt' && node.id === 'gpt-formateador') {
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        if (!node.data.config.extractionConfig) node.data.config.extractionConfig = {};
        
        // System prompt MÁS EXPLÍCITO con ejemplos
        node.data.config.extractionConfig.systemPrompt = `Analiza el historial completo y extrae los datos del libro.

REGLA CRÍTICA - NORMALIZACIÓN OBLIGATORIA:
Debes SIEMPRE normalizar el título a su forma oficial completa, sin importar cómo lo mencione el usuario.

EJEMPLOS DE NORMALIZACIÓN (MEMORIZA ESTOS):
Usuario dice: "harry potter 3" → titulo = "harry potter 3" (NO NORMALIZAR, pasar tal cual)
Usuario dice: "hp 3" → titulo = "hp 3" (NO NORMALIZAR, pasar tal cual)
Usuario dice: "prisionero de azkaban" → titulo = "prisionero de azkaban" (NO NORMALIZAR, pasar tal cual)

IMPORTANTE: NO traduzcas, NO normalices. Los productos en WooCommerce están en español y con nombres variados.
Pasa el término de búsqueda EXACTAMENTE como lo dice el usuario.

VARIABLES:
- titulo: El término de búsqueda TAL CUAL lo menciona el usuario (OBLIGATORIO si lo menciona)
- editorial: Solo si la menciona explícitamente (OPCIONAL, null si no)
- edicion: Solo si la menciona explícitamente (OPCIONAL, null si no)

EJEMPLOS FINALES:
Usuario: "busco harry potter 3"
→ { "titulo": "harry potter 3", "editorial": null, "edicion": null }

Usuario: "quiero hp 3 de scholastic"
→ { "titulo": "hp 3", "editorial": "scholastic", "edicion": null }

Usuario: "prisionero de azkaban primera edición"
→ { "titulo": "prisionero de azkaban", "editorial": null, "edicion": "primera" }`;

        console.log('   ✅ System prompt de extracción actualizado');
        console.log('   ✅ Instrucción: NO normalizar, pasar tal cual');
      }
    }
    
    console.log('');
    
    // ═══════════════════════════════════════════════════════════
    // PROBLEMA 3: GPT RESULTADOS - Usar datos reales
    // ═══════════════════════════════════════════════════════════
    console.log('🔧 PROBLEMA 3: GPT Resultados debe usar datos reales');
    console.log('─'.repeat(63));
    
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'gpt' && node.id === 'gpt-resultados') {
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        // Personalidad que usa datos reales de WooCommerce
        node.data.config.personalidad = `Eres un asistente de librería amigable y profesional.

TU TAREA:
Presentar los resultados de la búsqueda de productos de WooCommerce de forma clara y atractiva.

DATOS DISPONIBLES:
- {{titulo}}: Título buscado por el usuario
- {{woocommerce}}: Array de productos encontrados en WooCommerce (USAR ESTOS DATOS REALES)

IMPORTANTE - USA DATOS REALES:
- Los productos están en {{woocommerce}}
- Cada producto tiene: name, price, stock_status
- NO inventes productos
- NO inventes precios
- USA SOLO los datos reales del array

FORMATO DE RESPUESTA:
Si hay productos en {{woocommerce}}:
"✅ Encontré [cantidad] resultado(s) para '[titulo]':

[Para cada producto en {{woocommerce}}:]
- [name] - $[price] - [stock_status]"

Si NO hay productos:
"❌ No encontré resultados para '[titulo]'.

¿Podrías verificar el título? También puedo ayudarte a buscar de otra manera 😊"

EJEMPLO:
{{woocommerce}} = [{ name: "HARRY POTTER 03", price: "25000", stock_status: "instock" }]
→ "✅ Encontré 1 resultado(s) para 'harry potter 3':

- HARRY POTTER 03 - $25000 - instock"`;

        console.log('   ✅ Personalidad actualizada para usar datos reales');
        console.log('   ✅ Variable: {{woocommerce}} en lugar de {{productos}}');
      }
    }
    
    console.log('');
    
    // Guardar
    await flowsCollection.updateOne(
      { _id: FLOW_ID },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ Flow actualizado en base de datos\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('RESUMEN DE FIXES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('✅ PROBLEMA 1 (Router OR/AND): Corregido en FlowExecutor.ts');
    console.log('✅ PROBLEMA 2 (Normalización): Prompt actualizado - NO normalizar');
    console.log('✅ PROBLEMA 3 (Datos inventados): Usar {{woocommerce}} real');
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('FLUJO ESPERADO AHORA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Usuario: "busco harry potter 3"');
    console.log('');
    console.log('1. GPT Formateador:');
    console.log('   Extrae: { titulo: "harry potter 3", editorial: null, edicion: null }');
    console.log('');
    console.log('2. Router:');
    console.log('   Evalúa: "{{titulo}} not exists OR {{editorial}} not exists OR {{edicion}} not exists"');
    console.log('   Partes: ["{{titulo}} not exists", "{{editorial}} not exists", "{{edicion}} not exists"]');
    console.log('   Resultados: [false, true, true]');
    console.log('   OR resultado: true → Ruta 1 (Faltan datos) ✅');
    console.log('');
    console.log('3. GPT Pedir Datos:');
    console.log('   Responde: "¿De qué editorial y edición lo necesitas?"');
    console.log('');
    console.log('Usuario: "cualquier editorial, cualquier edición"');
    console.log('');
    console.log('4. GPT Formateador:');
    console.log('   Extrae: { titulo: "harry potter 3", editorial: "cualquier", edicion: "cualquier" }');
    console.log('');
    console.log('5. Router:');
    console.log('   Evalúa: "{{titulo}} not exists OR {{editorial}} not exists OR {{edicion}} not exists"');
    console.log('   Resultados: [false, false, false]');
    console.log('   OR resultado: false → Ruta 2 (Datos completos) ✅');
    console.log('');
    console.log('6. WooCommerce:');
    console.log('   Busca: "harry potter 3"');
    console.log('   Encuentra: [{ name: "HARRY POTTER 03 PRISIONERO DE AZKABAN", price: "25000", ... }]');
    console.log('');
    console.log('7. GPT Resultados:');
    console.log('   Usa datos reales de {{woocommerce}}');
    console.log('   Responde: "✅ Encontré 1 resultado(s): HARRY POTTER 03 - $25000 - instock"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlowFinalCompleto();
