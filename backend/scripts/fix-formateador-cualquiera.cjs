require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * FIX FORMATEADOR - Reconocer "cualquiera" como valor válido
 * 
 * PROBLEMA:
 * Usuario: "cualquiera está bien"
 * Formateador extrae: { editorial: null, edicion: null }
 * Debería extraer: { editorial: "cualquiera", edicion: "cualquiera" }
 * 
 * SOLUCIÓN:
 * Actualizar prompt de extracción para reconocer:
 * - "cualquiera"
 * - "cualquier editorial"
 * - "cualquier edición"
 * - "la que sea"
 * - "no importa"
 * Como valores válidos (no null)
 */

async function fixFormateadorCualquiera() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('FIX FORMATEADOR - Reconocer "cualquiera" como válido');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`✅ Flow encontrado: ${flow.nombre}\n`);
    
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'gpt' && node.id === 'gpt-formateador') {
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        if (!node.data.config.extractionConfig) node.data.config.extractionConfig = {};
        
        // System prompt MEJORADO que reconoce "cualquiera"
        node.data.config.extractionConfig.systemPrompt = `Analiza el historial completo y extrae los datos del libro.

REGLA CRÍTICA - EXTRACCIÓN DE DATOS:
Debes extraer título, editorial y edición del HISTORIAL COMPLETO de la conversación.

VARIABLES:
- titulo: El término de búsqueda TAL CUAL lo menciona el usuario (OBLIGATORIO si lo menciona)
- editorial: La editorial mencionada (OPCIONAL, pero reconoce "cualquiera" como válido)
- edicion: La edición mencionada (OPCIONAL, pero reconoce "cualquiera" como válido)

IMPORTANTE - RECONOCER "CUALQUIERA":
Si el usuario dice:
- "cualquiera"
- "cualquier editorial"
- "cualquier edición"
- "la que sea"
- "no importa"
- "cualquiera está bien"

Entonces extrae como "cualquiera" (NO como null)

EJEMPLOS:

Historial:
Usuario: "busco harry potter 3"
Asistente: "¿De qué editorial y edición?"
Usuario: "cualquiera está bien"
→ { "titulo": "harry potter 3", "editorial": "cualquiera", "edicion": "cualquiera" }

Historial:
Usuario: "quiero hp 3"
Asistente: "¿Editorial y edición?"
Usuario: "scholastic, cualquier edición"
→ { "titulo": "hp 3", "editorial": "scholastic", "edicion": "cualquiera" }

Historial:
Usuario: "prisionero de azkaban"
Asistente: "¿Editorial?"
Usuario: "no importa"
→ { "titulo": "prisionero de azkaban", "editorial": "cualquiera", "edicion": "cualquiera" }

Historial:
Usuario: "busco harry potter 3"
→ { "titulo": "harry potter 3", "editorial": null, "edicion": null }

REGLA FINAL:
- Si el usuario menciona explícitamente editorial/edición → extraer el valor
- Si el usuario dice "cualquiera" o similar → extraer "cualquiera"
- Si el usuario NO menciona nada → extraer null`;

        console.log('✅ System prompt de extracción actualizado');
        console.log('✅ Ahora reconoce "cualquiera" como valor válido\n');
      }
    }
    
    // Guardar
    await flowsCollection.updateOne(
      { _id: FLOW_ID },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ Flow actualizado en base de datos\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('FLUJO ESPERADO AHORA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Usuario: "busco harry potter 3"');
    console.log('→ Formateador: { titulo: "harry potter 3", editorial: null, edicion: null }');
    console.log('→ Router: editorial = null OR edicion = null → TRUE');
    console.log('→ Ruta 1 (Faltan datos)');
    console.log('→ Pregunta: "¿De qué editorial y edición?"');
    console.log('');
    console.log('Usuario: "cualquiera está bien"');
    console.log('→ Formateador: { titulo: "harry potter 3", editorial: "cualquiera", edicion: "cualquiera" } ✅');
    console.log('→ Router: editorial = "cualquiera" AND edicion = "cualquiera" → EXISTS');
    console.log('→ Ruta 2 (Datos completos) ✅');
    console.log('→ WooCommerce: Busca "harry potter 3"');
    console.log('→ Muestra resultados');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFormateadorCualquiera();
