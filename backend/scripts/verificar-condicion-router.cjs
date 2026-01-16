/**
 * Script para Verificar Condición del Router
 * 
 * Verifica cómo está escrita la condición del edge router → carrito
 * y si coincide con el formato esperado por evaluateCondition
 * 
 * FORMATO ESPERADO:
 * "{{tipo_accion}} equals comprar"
 * 
 * FORMATO INCORRECTO:
 * "tipo_accion equals comprar" (sin {{}})
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function verificarCondicion() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═'.repeat(80));
    console.log('🔍 VERIFICACIÓN DE CONDICIONES DEL ROUTER');
    console.log('═'.repeat(80));
    
    // Buscar todos los edges que salen del router
    const edgesDesdeRouter = flow.edges.filter(e => e.source === 'router-principal');
    
    console.log(`\n📋 EDGES DESDE ROUTER (${edgesDesdeRouter.length}):\n`);
    
    edgesDesdeRouter.forEach((edge, index) => {
      console.log(`${index + 1}. Edge: ${edge.id}`);
      console.log(`   Destino: ${edge.target}`);
      console.log(`   Condición: "${edge.data?.condition || 'SIN CONDICIÓN'}"`);
      
      // Verificar formato
      const condition = edge.data?.condition;
      
      if (!condition) {
        console.log(`   ❌ PROBLEMA: No tiene condición`);
      } else {
        // Verificar si tiene {{}}
        const tieneDobleCorchetes = condition.includes('{{') && condition.includes('}}');
        
        if (tieneDobleCorchetes) {
          console.log(`   ✅ Formato correcto: Usa {{variable}}`);
          
          // Extraer variable
          const match = condition.match(/\{\{([^}]+)\}\}/);
          if (match) {
            const variable = match[1].trim();
            console.log(`   📌 Variable: "${variable}"`);
          }
        } else {
          console.log(`   ❌ PROBLEMA: No usa {{}} para la variable`);
          console.log(`   💡 Debería ser: "{{${condition.split(' ')[0]}}} ${condition.split(' ').slice(1).join(' ')}"`);
        }
        
        // Verificar operador
        if (condition.includes(' equals ') || condition.includes(' equal ')) {
          console.log(`   ✅ Operador: equals`);
        } else if (condition.includes(' contains ')) {
          console.log(`   ✅ Operador: contains`);
        } else if (condition.includes(' not exists')) {
          console.log(`   ✅ Operador: not exists`);
        } else if (condition.includes(' empty')) {
          console.log(`   ✅ Operador: empty`);
        } else {
          console.log(`   ⚠️  Operador no reconocido`);
        }
      }
      
      console.log('');
    });
    
    // Verificar edge específico a carrito
    console.log('\n═'.repeat(80));
    console.log('🎯 EDGE CRÍTICO: router → gpt-armar-carrito');
    console.log('═'.repeat(80));
    
    const edgeACarrito = edgesDesdeRouter.find(e => e.target === 'gpt-armar-carrito');
    
    if (!edgeACarrito) {
      console.log('\n❌ NO EXISTE edge a gpt-armar-carrito');
      console.log('   Crear edge en el frontend con condición: {{tipo_accion}} equals comprar');
    } else {
      const condition = edgeACarrito.data?.condition;
      
      console.log(`\n📋 Condición actual: "${condition}"`);
      
      // Verificar formato correcto
      const formatoCorrecto = condition === '{{tipo_accion}} equals comprar' ||
                              condition === '{{tipo_accion}} equal comprar';
      
      if (formatoCorrecto) {
        console.log('\n✅ FORMATO CORRECTO');
        console.log('   La condición está bien escrita');
      } else {
        console.log('\n❌ FORMATO INCORRECTO');
        console.log(`   Actual:   "${condition}"`);
        console.log(`   Esperado: "{{tipo_accion}} equals comprar"`);
        
        // Verificar si es el problema de los {{}}
        if (!condition.includes('{{')) {
          console.log('\n🔧 PROBLEMA IDENTIFICADO:');
          console.log('   La condición no usa {{}} para la variable');
          console.log('   El código evaluateCondition espera: {{variable}} operator value');
          console.log('   Pero tiene: variable operator value');
        }
      }
    }
    
    // Mostrar cómo debería evaluarse
    console.log('\n\n═'.repeat(80));
    console.log('📖 CÓMO FUNCIONA LA EVALUACIÓN');
    console.log('═'.repeat(80));
    
    console.log('\n1. Clasificador extrae variables:');
    console.log('   GPT responde (texto plano): "Clasificación: comprar\\nConfianza: 0.9"');
    console.log('   FlowExecutor parsea y guarda:');
    console.log('     globalVariables.tipo_accion = "comprar"');
    console.log('     globalVariables.confianza = 0.9');
    
    console.log('\n2. Router evalúa condición:');
    console.log('   Condición: "{{tipo_accion}} equals comprar"');
    console.log('   evaluateCondition hace:');
    console.log('     a) Extrae variable: "tipo_accion"');
    console.log('     b) Busca en globalVariables: "comprar"');
    console.log('     c) Compara: "comprar" === "comprar" → TRUE ✅');
    console.log('     d) Va a: gpt-armar-carrito');
    
    console.log('\n3. Si la condición NO tiene {{}}:');
    console.log('   Condición: "tipo_accion equals comprar"');
    console.log('   evaluateCondition NO reconoce el patrón');
    console.log('   Intenta resolver como string literal');
    console.log('   Resultado: FALSE ❌');
    
    console.log('\n\n═'.repeat(80));
    console.log('🎯 CONCLUSIÓN');
    console.log('═'.repeat(80));
    
    if (edgeACarrito) {
      const condition = edgeACarrito.data?.condition;
      const tieneDobleCorchetes = condition?.includes('{{') && condition?.includes('}}');
      
      if (tieneDobleCorchetes) {
        console.log('\n✅ CONFIGURACIÓN CORRECTA');
        console.log('   El edge tiene la condición con formato correcto');
        console.log('   Si el clasificador extrae tipo_accion="comprar", debería funcionar');
      } else {
        console.log('\n❌ PROBLEMA ENCONTRADO');
        console.log('   El edge NO tiene {{}} en la condición');
        console.log('   Esto hace que evaluateCondition no reconozca el patrón');
        console.log('\n🔧 SOLUCIÓN:');
        console.log('   Ejecutar script para corregir la condición del edge');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
verificarCondicion()
  .then(() => {
    console.log('\n✅ Verificación completada\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verificación falló:', error);
    process.exit(1);
  });
