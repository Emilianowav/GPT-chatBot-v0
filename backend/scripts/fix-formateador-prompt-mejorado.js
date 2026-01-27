import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

async function fixFormateadorPrompt() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ 
      empresaId: 'Veo Veo', 
      nombre: 'WooCommerce Flow' 
    });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo');
      return;
    }

    console.log('🔧 MEJORANDO PROMPT DEL FORMATEADOR\n');
    console.log('═'.repeat(70));

    const systemPromptMejorado = `Analiza la conversación y extrae EXACTAMENTE lo que el usuario está buscando.

TU ÚNICA TAREA: Identificar si el usuario menciona un TÍTULO ESPECÍFICO o una CATEGORÍA GENERAL.

REGLAS CRÍTICAS:
1. Si menciona un NOMBRE DE LIBRO específico (Harry Potter, El Principito, etc.) → extrae SOLO "titulo"
2. Si pide RECOMENDACIONES o menciona un GÉNERO (novelas, autoayuda, infantil) → extrae SOLO "categoria"
3. NUNCA extraigas ambos a la vez
4. NUNCA inventes información
5. Si menciona "Harry Potter" → titulo = "Harry Potter" (NO categoria = "fantasía")

EJEMPLOS CORRECTOS:

Usuario: "Busco Harry Potter"
→ {"titulo": "Harry Potter"}

Usuario: "y sobre harry potter ?"
→ {"titulo": "Harry Potter"}

Usuario: "Tenés novelas?"
→ {"categoria": "novela"}

Usuario: "Recomendame algo de autoayuda"
→ {"categoria": "autoayuda"}

Usuario: "El principito"
→ {"titulo": "El Principito"}

EJEMPLOS INCORRECTOS:

Usuario: "y sobre harry potter ?"
→ {"categoria": "fantasía"} ❌ INCORRECTO - Harry Potter es un TÍTULO

Usuario: "Busco Harry Potter"
→ {"titulo": "Harry Potter", "categoria": "fantasía"} ❌ INCORRECTO - Solo uno

IMPORTANTE: 
- Si el usuario menciona un nombre de libro, es SIEMPRE "titulo", nunca "categoria"
- Solo devuelve el JSON, sin explicaciones`;

    const extractionPromptMejorado = `Extrae EXACTAMENTE lo que el usuario busca:
- Si menciona un NOMBRE DE LIBRO específico → "titulo"
- Si pide RECOMENDACIONES o menciona un GÉNERO → "categoria"
NUNCA ambos. NUNCA inventes.`;

    await flowsCollection.updateOne(
      { empresaId: 'Veo Veo', nombre: 'WooCommerce Flow' },
      {
        $set: {
          'nodes.$[node].data.config.systemPrompt': systemPromptMejorado,
          'nodes.$[node].data.config.extractionConfig.systemPrompt': extractionPromptMejorado,
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'node.id': 'gpt-formateador' }]
      }
    );

    console.log('✅ Prompt del formateador mejorado');
    console.log('');

    console.log('═'.repeat(70));
    console.log('✅ CORRECCIÓN COMPLETADA');
    console.log('═'.repeat(70));
    console.log('');
    console.log('📝 MEJORAS APLICADAS:');
    console.log('');
    console.log('1. Instrucciones más claras y directas');
    console.log('2. Énfasis en NO confundir títulos con categorías');
    console.log('3. Ejemplo explícito: "Harry Potter" es TÍTULO, no categoría');
    console.log('4. Regla: NUNCA extraer ambos a la vez');
    console.log('');
    console.log('🧪 TESTEAR:');
    console.log('   1. Limpiar: node scripts/limpiar-mi-numero.js');
    console.log('   2. Enviar: "y sobre harry potter ?"');
    console.log('   3. DEBE extraer: {"titulo": "Harry Potter"}');
    console.log('   4. NO debe extraer: {"categoria": "fantasía"}');
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

fixFormateadorPrompt();
