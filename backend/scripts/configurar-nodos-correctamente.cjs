/**
 * Script para Configurar Nodos Correctamente
 * 
 * PROBLEMAS A CORREGIR:
 * 1. Clasificador sin prompt
 * 2. Router Principal sin configuración
 * 3. GPT Asistente sin pregunta guía
 * 
 * FECHA: 2026-01-15
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function configurarNodos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log('\n📊 Flujo:', flow.nombre);
    console.log(`   Nodos: ${flow.nodes.length}`);
    
    // ============================================================
    // CORRECCIÓN 1: Configurar Clasificador con Prompt Completo
    // ============================================================
    
    console.log('\n🔧 CORRECCIÓN 1: Configurando Clasificador...');
    
    const indexClasificador = flow.nodes.findIndex(n => n.id === 'gpt-clasificador-inteligente');
    
    if (indexClasificador !== -1) {
      flow.nodes[indexClasificador] = {
        id: 'gpt-clasificador-inteligente',
        type: 'gpt',
        data: {
          label: 'GPT Clasificador',
          config: {
            tipo: 'formateador',
            modelo: 'gpt-4',
            temperatura: 0.3,
            systemPrompt: `Eres un clasificador inteligente de intenciones en un ecommerce conversacional.

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
- Confianza: 0.0 a 1.0 (qué tan seguro estás)`,
            extractionConfig: {
              variablesToExtract: [
                { nombre: 'tipo_accion', tipo: 'string', requerido: true },
                { nombre: 'confianza', tipo: 'number', requerido: true }
              ]
            }
          }
        },
        position: flow.nodes[indexClasificador].position
      };
      
      console.log('   ✅ Clasificador configurado con prompt completo');
    } else {
      console.log('   ❌ Clasificador no encontrado');
    }
    
    // ============================================================
    // CORRECCIÓN 2: Configurar Router Principal
    // ============================================================
    
    console.log('\n🔧 CORRECCIÓN 2: Configurando Router Principal...');
    
    const indexRouter = flow.nodes.findIndex(n => n.id === 'router-principal');
    
    if (indexRouter !== -1) {
      flow.nodes[indexRouter] = {
        id: 'router-principal',
        type: 'router',
        data: {
          label: 'Router Principal',
          config: {
            variable: 'tipo_accion',
            routes: [
              {
                condition: 'equals',
                value: 'buscar_producto',
                label: '🔍 Buscar Producto'
              },
              {
                condition: 'equals',
                value: 'comprar',
                label: '🛒 Comprar'
              },
              {
                condition: 'equals',
                value: 'consultar',
                label: '💬 Consultar'
              },
              {
                condition: 'equals',
                value: 'despedida',
                label: '👋 Despedida'
              }
            ]
          }
        },
        position: flow.nodes[indexRouter].position
      };
      
      console.log('   ✅ Router Principal configurado con 4 rutas');
    } else {
      console.log('   ❌ Router Principal no encontrado');
    }
    
    // ============================================================
    // CORRECCIÓN 3: Actualizar GPT Asistente con Pregunta Guía
    // ============================================================
    
    console.log('\n🔧 CORRECCIÓN 3: Actualizando GPT Asistente...');
    
    const indexAsistente = flow.nodes.findIndex(n => 
      n.type === 'gpt' && 
      n.data?.config?.tipo === 'conversacional' &&
      n.id !== 'gpt-clasificador-inteligente' &&
      n.id !== 'gpt-armar-carrito'
    );
    
    if (indexAsistente !== -1) {
      const asistenteActual = flow.nodes[indexAsistente];
      const promptActual = asistenteActual.data.config.systemPrompt || '';
      
      // Agregar pregunta guía al final del prompt si no existe
      if (!promptActual.includes('¿Deseas agregar')) {
        const promptNuevo = promptActual + `

IMPORTANTE: Al final de tu respuesta, SIEMPRE pregunta:

"¿Deseas agregar este producto al carrito o prefieres seguir buscando?"

Esto ayuda al usuario a decidir su próximo paso.`;
        
        flow.nodes[indexAsistente].data.config.systemPrompt = promptNuevo;
        console.log('   ✅ GPT Asistente actualizado con pregunta guía');
      } else {
        console.log('   ⚠️  GPT Asistente ya tiene pregunta guía');
      }
    } else {
      console.log('   ❌ GPT Asistente no encontrado');
    }
    
    // ============================================================
    // VERIFICACIÓN: Mostrar configuraciones
    // ============================================================
    
    console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIONES:');
    
    const clasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    const router = flow.nodes.find(n => n.id === 'router-principal');
    const asistente = flow.nodes.find(n => 
      n.type === 'gpt' && 
      n.data?.config?.tipo === 'conversacional' &&
      n.id !== 'gpt-clasificador-inteligente' &&
      n.id !== 'gpt-armar-carrito'
    );
    
    console.log('\n📋 Clasificador:');
    console.log(`   Tiene prompt: ${clasificador?.data?.config?.systemPrompt ? '✅' : '❌'}`);
    console.log(`   Tiene extractionConfig: ${clasificador?.data?.config?.extractionConfig ? '✅' : '❌'}`);
    console.log(`   Variables: ${clasificador?.data?.config?.extractionConfig?.variablesToExtract?.map(v => v.nombre).join(', ') || 'ninguna'}`);
    
    console.log('\n📋 Router Principal:');
    console.log(`   Tiene config: ${router?.data?.config ? '✅' : '❌'}`);
    console.log(`   Variable a evaluar: ${router?.data?.config?.variable || 'ninguna'}`);
    console.log(`   Rutas: ${router?.data?.config?.routes?.length || 0}`);
    if (router?.data?.config?.routes) {
      router.data.config.routes.forEach(r => {
        console.log(`      - ${r.label}: ${r.value}`);
      });
    }
    
    console.log('\n📋 GPT Asistente:');
    console.log(`   Tiene prompt: ${asistente?.data?.config?.systemPrompt ? '✅' : '❌'}`);
    console.log(`   Tiene pregunta guía: ${asistente?.data?.config?.systemPrompt?.includes('¿Deseas agregar') ? '✅' : '❌'}`);
    
    // ============================================================
    // GUARDAR CAMBIOS
    // ============================================================
    
    console.log('\n💾 Guardando cambios...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ NODOS CONFIGURADOS CORRECTAMENTE');
    console.log('='.repeat(60));
    
    console.log('\n📊 Resumen:');
    console.log('   1. Clasificador: ✅ Prompt completo + extractionConfig');
    console.log('   2. Router Principal: ✅ 4 rutas configuradas');
    console.log('   3. GPT Asistente: ✅ Pregunta guía agregada');
    
    console.log('\n🧪 Próximos pasos:');
    console.log('   1. Limpiar estado: node scripts/limpiar-mi-numero.js');
    console.log('   2. Enviar: "Busco Harry Potter 5"');
    console.log('   3. Verificar que presenta productos + pregunta guía');
    console.log('   4. Enviar: "Quiero comprarlo"');
    console.log('   5. Verificar que va al flujo de carrito');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
configurarNodos()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
