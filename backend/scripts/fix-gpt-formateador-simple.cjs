require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * CONFIGURAR GPT FORMATEADOR SIMPLE Y EFECTIVO
 * 
 * PROBLEMA: Los productos en WooCommerce están en ESPAÑOL
 * - "harry potter 3" → "HARRY POTTER 03 PRISIONERO DE AZKABAN" ✅
 * - "Harry Potter and the Prisoner of Azkaban" → 0 resultados ❌
 * 
 * SOLUCIÓN: NO normalizar, pasar el término tal cual
 * - Usuario dice "harry potter 3" → buscar "harry potter 3"
 * - Usuario dice "hp 3" → buscar "hp 3"
 * - Usuario dice "prisionero de azkaban" → buscar "prisionero de azkaban"
 */

async function fixGptFormateadorSimple() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CONFIGURAR GPT FORMATEADOR SIMPLE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: FLOW_ID });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }
    
    console.log(`✅ Flow encontrado: ${flow.nombre}\n`);
    
    // Actualizar nodo GPT formateador
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      
      if (node.type === 'gpt' && node.id === 'gpt-formateador') {
        console.log('📦 Configurando nodo GPT formateador SIMPLE...\n');
        
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        // System prompt SIMPLE
        node.data.config.personalidad = `Eres un asistente especializado en libros.

TU TAREA:
1. Identificar si el usuario menciona un libro
2. Extraer el término de búsqueda TAL CUAL lo dice el usuario
3. NO traducir, NO normalizar, NO cambiar nada
4. Si tiene el término, confirmar la búsqueda
5. Si no tiene el término, preguntar qué libro busca

REGLAS IMPORTANTES:
- Si dice "harry potter 3" → extraer "harry potter 3" (NO traducir a inglés)
- Si dice "hp 3" → extraer "hp 3" (tal cual)
- Si dice "prisionero de azkaban" → extraer "prisionero de azkaban" (tal cual)
- NO normalizar títulos
- NO traducir a inglés
- Editorial y edición son OPCIONALES

RESPUESTAS:
- Con título: "Perfecto, buscando [término]..."
- Sin título: "¿Qué libro estás buscando?"
- Sé BREVE`;

        // Configuración de extracción SIMPLE
        node.data.config.extractionConfig = {
          enabled: true,
          method: 'advanced',
          contextSource: 'historial_completo',
          systemPrompt: `Analiza el historial y extrae el término de búsqueda TAL CUAL lo menciona el usuario.

REGLAS CRÍTICAS:
- NO traducir a inglés
- NO normalizar títulos
- Extraer el término EXACTAMENTE como lo dice el usuario
- Si dice "harry potter 3" → titulo = "harry potter 3"
- Si dice "hp 3" → titulo = "hp 3"
- Si dice "prisionero de azkaban" → titulo = "prisionero de azkaban"

VARIABLES:
- titulo: El término de búsqueda TAL CUAL (OBLIGATORIO si lo menciona)
- editorial: Solo si la menciona explícitamente (OPCIONAL)
- edicion: Solo si la menciona explícitamente (OPCIONAL)

EJEMPLOS:
Usuario: "busco harry potter 3"
→ { titulo: "harry potter 3", editorial: null, edicion: null }

Usuario: "quiero hp 3"
→ { titulo: "hp 3", editorial: null, edicion: null }

Usuario: "prisionero de azkaban de scholastic"
→ { titulo: "prisionero de azkaban", editorial: "scholastic", edicion: null }`,
          variables: [
            {
              nombre: 'titulo',
              tipo: 'texto',
              requerido: true,
              descripcion: 'Término de búsqueda TAL CUAL lo dice el usuario (sin traducir, sin normalizar)'
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
        
        // Modelo y configuración
        node.data.config.modelo = 'gpt-4o-mini';
        node.data.config.temperatura = 0.3;
        node.data.config.maxTokens = 300;
        
        console.log('✅ Personalidad SIMPLE configurada');
        console.log('✅ Extracción SIN normalización');
        console.log('✅ Pasa términos TAL CUAL a WooCommerce');
        console.log('✅ Modelo: gpt-4o-mini\n');
      }
    }
    
    // Guardar
    await flowsCollection.updateOne(
      { _id: FLOW_ID },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ Flow actualizado en base de datos\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('EJEMPLOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Usuario: "busco harry potter 3"');
    console.log('→ Extrae: { titulo: "harry potter 3" }');
    console.log('→ WooCommerce busca: "harry potter 3"');
    console.log('→ Encuentra: "HARRY POTTER 03 PRISIONERO DE AZKABAN" ✅\n');
    
    console.log('Usuario: "quiero hp 3"');
    console.log('→ Extrae: { titulo: "hp 3" }');
    console.log('→ WooCommerce busca: "hp 3"');
    console.log('→ Puede no encontrar (término muy corto) ⚠️\n');
    
    console.log('Usuario: "prisionero de azkaban"');
    console.log('→ Extrae: { titulo: "prisionero de azkaban" }');
    console.log('→ WooCommerce busca: "prisionero de azkaban"');
    console.log('→ Puede encontrar resultados ✅\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGptFormateadorSimple();
