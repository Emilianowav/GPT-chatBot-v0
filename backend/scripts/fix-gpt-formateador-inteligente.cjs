require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * CONFIGURAR GPT FORMATEADOR INTELIGENTE
 * 
 * El formateador debe:
 * 1. Entender la intención del usuario ("harry potter 3" = "Harry Potter y el Prisionero de Azkaban")
 * 2. Normalizar títulos a su forma oficial
 * 3. Extraer datos del historial completo
 * 4. Decidir si tiene suficiente info o necesita preguntar
 * 5. Formatear respuesta inteligente
 */

async function fixGptFormateadorInteligente() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (PRODUCCIÓN)\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const FLOW_ID = new ObjectId('695a156681f6d67f0ae9cf40');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CONFIGURAR GPT FORMATEADOR INTELIGENTE');
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
        console.log('📦 Configurando nodo GPT formateador INTELIGENTE...\n');
        
        if (!node.data) node.data = {};
        if (!node.data.config) node.data.config = {};
        
        // System prompt inteligente
        node.data.config.personalidad = `Eres un asistente INTELIGENTE especializado en libros en inglés.

TU TAREA PRINCIPAL:
1. ENTENDER la intención del usuario (ej: "harry potter 3" = "Harry Potter and the Prisoner of Azkaban")
2. NORMALIZAR títulos a su forma oficial en inglés
3. EXTRAER datos del historial completo de la conversación
4. DECIDIR si tienes suficiente información o necesitas preguntar más

REGLAS DE NORMALIZACIÓN:
- "harry potter 3" → "Harry Potter and the Prisoner of Azkaban"
- "hp 3" → "Harry Potter and the Prisoner of Azkaban"
- "prisionero de azkaban" → "Harry Potter and the Prisoner of Azkaban"
- Siempre usa el título OFICIAL en inglés
- Si el usuario dice un número de saga, identifica el título correcto

REGLAS DE EXTRACCIÓN:
- Si el usuario menciona un título (aunque sea informal), EXTRÁELO y normalízalo
- Editorial y edición son OPCIONALES (pueden ser null)
- Si no mencionan editorial, NO preguntes, usa null
- Si no mencionan edición, NO preguntes, usa null

REGLAS DE RESPUESTA:
- Si tienes el título (aunque sea informal): Responde "Perfecto, buscando [título oficial]..."
- Si NO tienes el título: Pregunta "¿Qué libro estás buscando?"
- NO pidas editorial ni edición si no las mencionan
- Sé BREVE y DIRECTO`;

        // Configuración de extracción avanzada
        node.data.config.extractionConfig = {
          enabled: true,
          method: 'advanced',
          contextSource: 'historial_completo',
          systemPrompt: `Analiza el historial completo de la conversación y extrae los datos del libro que busca el cliente.

IMPORTANTE - NORMALIZACIÓN DE TÍTULOS:
- Si el usuario dice "harry potter 3", "hp 3", "prisionero de azkaban" → titulo = "Harry Potter and the Prisoner of Azkaban"
- Si dice "harry potter 1" → titulo = "Harry Potter and the Philosopher's Stone"
- Si dice "harry potter 2" → titulo = "Harry Potter and the Chamber of Secrets"
- Siempre normaliza a título OFICIAL en inglés

REGLAS:
- titulo: OBLIGATORIO. Si el usuario menciona cualquier referencia a un libro (título, número de saga, etc.), extráelo y normalízalo
- editorial: OPCIONAL. Solo si el usuario la menciona explícitamente. Si no, null
- edicion: OPCIONAL. Solo si el usuario la menciona explícitamente. Si no, null

EJEMPLOS:
Usuario: "busco harry potter 3"
→ { titulo: "Harry Potter and the Prisoner of Azkaban", editorial: null, edicion: null }

Usuario: "quiero el prisionero de azkaban de scholastic"
→ { titulo: "Harry Potter and the Prisoner of Azkaban", editorial: "Scholastic", edicion: null }

Usuario: "hp 3 primera edición"
→ { titulo: "Harry Potter and the Prisoner of Azkaban", editorial: null, edicion: "Primera" }`,
          variables: [
            {
              nombre: 'titulo',
              tipo: 'texto',
              requerido: true,
              descripcion: 'Título OFICIAL del libro en inglés (normalizado)'
            },
            {
              nombre: 'editorial',
              tipo: 'texto',
              requerido: false,
              descripcion: 'Editorial del libro (solo si el usuario la menciona)'
            },
            {
              nombre: 'edicion',
              tipo: 'texto',
              requerido: false,
              descripcion: 'Edición del libro (solo si el usuario la menciona)'
            }
          ]
        };
        
        // Configuración del modelo
        node.data.config.modelo = 'gpt-4o-mini';
        node.data.config.temperatura = 0.3; // Más determinista para extracción
        node.data.config.maxTokens = 300;
        
        console.log('✅ Personalidad inteligente configurada');
        console.log('✅ Extracción avanzada con normalización');
        console.log('✅ Modelo: gpt-4o-mini (más inteligente)');
        console.log('✅ Temperatura: 0.3 (más preciso)\n');
      }
    }
    
    // Guardar
    await flowsCollection.updateOne(
      { _id: FLOW_ID },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ Flow actualizado en base de datos\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const updatedFlow = await flowsCollection.findOne({ _id: FLOW_ID });
    const gptForm = updatedFlow.nodes.find(n => n.id === 'gpt-formateador');
    
    console.log('📋 Configuración del formateador:');
    console.log(`   Modelo: ${gptForm.data?.config?.modelo}`);
    console.log(`   Temperatura: ${gptForm.data?.config?.temperatura}`);
    console.log(`   Extracción: ${gptForm.data?.config?.extractionConfig ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   Variables: ${gptForm.data?.config?.extractionConfig?.variables?.length || 0}`);
    console.log(`   Personalidad: ${gptForm.data?.config?.personalidad ? 'SÍ ✅' : 'NO ❌'}`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('EJEMPLOS DE USO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Usuario: "busco harry potter 3"');
    console.log('→ Extrae: { titulo: "Harry Potter and the Prisoner of Azkaban", editorial: null, edicion: null }');
    console.log('→ Responde: "Perfecto, buscando Harry Potter and the Prisoner of Azkaban..."\n');
    
    console.log('Usuario: "quiero hp 3 de scholastic"');
    console.log('→ Extrae: { titulo: "Harry Potter and the Prisoner of Azkaban", editorial: "Scholastic", edicion: null }');
    console.log('→ Responde: "Perfecto, buscando Harry Potter and the Prisoner of Azkaban de Scholastic..."\n');
    
    console.log('Usuario: "hola"');
    console.log('→ Extrae: { titulo: null, editorial: null, edicion: null }');
    console.log('→ Responde: "¿Qué libro estás buscando?"\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGptFormateadorInteligente();
