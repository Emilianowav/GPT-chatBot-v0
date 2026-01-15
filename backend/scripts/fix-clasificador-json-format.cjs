/**
 * Script para Agregar Instrucciones JSON al Clasificador
 * 
 * PROBLEMA ENCONTRADO:
 * GPT devuelve texto plano:
 *   "Clasificación: buscar_producto\nConfianza: 0.9"
 * 
 * Pero el código espera JSON:
 *   {"tipo_accion": "buscar_producto", "confianza": 0.9}
 * 
 * SOLUCIÓN:
 * Agregar instrucciones explícitas de formato JSON al systemPrompt
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixClasificadorJSON() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    const indexClasificador = flow.nodes.findIndex(n => n.id === 'gpt-clasificador-inteligente');
    
    if (indexClasificador === -1) {
      console.log('❌ Clasificador no encontrado');
      return;
    }
    
    const clasificador = flow.nodes[indexClasificador];
    
    console.log('🔍 SystemPrompt ACTUAL (primeros 200 chars):');
    console.log(clasificador.data.config.extractionConfig.systemPrompt.substring(0, 200));
    
    // Nuevo systemPrompt con instrucciones JSON
    const nuevoSystemPrompt = `Eres un clasificador inteligente de intenciones en un ecommerce conversacional.

CONTEXTO COMPLETO:
- Historial: {{historial_conversacion}}
- Productos presentados: {{global.productos_presentados}}
- Mensaje actual: {{1.message}}

TU TRABAJO:
Clasificar la intención del usuario en UNA de estas categorías:

1. **"buscar_producto"** - Usuario quiere buscar/consultar productos
   Ejemplos:
   - "Hola", "Busco libros", "Tenés Harry Potter?"
   - "Busco otro libro", "Tenés de matemática?"
   - Primera interacción SIN productos presentados
   
   REGLA: Si NO hay productos_presentados → SIEMPRE "buscar_producto"

2. **"comprar"** - Usuario quiere comprar productos YA PRESENTADOS
   Ejemplos:
   - "Quiero comprarlo", "Me llevo el primero"
   - "Cómo hago para comprarlo?", "Lo compro"
   - "Agregar al carrito", "Quiero ese"
   
   REGLA: Solo si productos_presentados existe Y usuario los menciona

3. **"consultar"** - Usuario tiene pregunta general
   Ejemplos:
   - "Qué horarios tienen?", "Aceptan mercado pago?"
   - "Dónde están ubicados?"

4. **"despedida"** - Usuario se despide
   Ejemplos:
   - "Nada más gracias", "Chau", "Hasta luego"

IMPORTANTE:
- Si NO hay productos_presentados → SIEMPRE "buscar_producto"
- Si hay productos Y usuario pregunta cómo comprar → "comprar"
- Confianza: 0.0 a 1.0 (qué tan seguro estás)

**FORMATO DE RESPUESTA:**
Devuelve SOLO un objeto JSON válido con esta estructura exacta:
{
  "tipo_accion": "buscar_producto" | "comprar" | "consultar" | "despedida",
  "confianza": 0.9
}

NO agregues texto adicional, SOLO el JSON.`;

    console.log('\n🔧 ACTUALIZANDO systemPrompt...');
    
    flow.nodes[indexClasificador].data.config.extractionConfig.systemPrompt = nuevoSystemPrompt;
    
    // Guardar
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CLASIFICADOR ACTUALIZADO CON FORMATO JSON');
    console.log('='.repeat(60));
    
    console.log('\n📋 Cambios realizados:');
    console.log('   ✅ Agregadas instrucciones de formato JSON');
    console.log('   ✅ Especificado: "Devuelve SOLO un objeto JSON válido"');
    console.log('   ✅ Estructura exacta definida');
    
    console.log('\n🧪 Próximo paso:');
    console.log('   1. Esperá que el deploy termine (si está en progreso)');
    console.log('   2. Limpiá el estado: node scripts/limpiar-mi-numero.js');
    console.log('   3. Probá de nuevo con "Hola"');
    console.log('   4. Verificá que los logs muestren:');
    console.log('      ✅ JSON parseado: { tipo_accion: "buscar_producto", confianza: 0.9 }');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
fixClasificadorJSON()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
