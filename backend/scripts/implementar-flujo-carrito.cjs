/**
 * Script para Implementar Flujo de Carrito
 * 
 * PROPÓSITO: Agregar nodos nuevos al flujo sin modificar los existentes
 * FECHA: 2026-01-15
 * 
 * IMPORTANTE: Este script NO modifica nodos existentes, solo agrega nuevos
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function implementarFlujoCarrito() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    console.log('\n📊 Flujo actual:');
    console.log(`   Nombre: ${flow.nombre}`);
    console.log(`   Nodos actuales: ${flow.nodes.length}`);
    console.log(`   Edges actuales: ${flow.edges.length}`);
    
    // ============================================================
    // PASO 1: Agregar GPT Clasificador Inteligente
    // ============================================================
    
    console.log('\n🔧 PASO 1: Agregando GPT Clasificador Inteligente...');
    
    const gptClasificador = {
      id: 'gpt-clasificador-inteligente',
      type: 'gpt',
      data: {
        label: 'GPT Clasificador',
        config: {
          tipo: 'formateador',
          modelo: 'gpt-4',
          temperatura: 0.3,
          systemPrompt: `Eres un clasificador inteligente de intenciones en un ecommerce conversacional.

HISTORIAL COMPLETO DE LA CONVERSACIÓN:
{{historial_conversacion}}

PRODUCTOS PRESENTADOS PREVIAMENTE (si existen):
{{global.productos_presentados}}

CARRITO EN PROGRESO (si existe):
{{global.carrito_en_progreso}}

MENSAJE ACTUAL DEL USUARIO:
{{1.message}}

TU TRABAJO:
Analizar el contexto completo y clasificar la intención del usuario en UNA de estas categorías:

1. **"buscar_producto"** - Usuario quiere buscar/consultar productos
   Casos:
   - Primera interacción: "Hola", "Busco libros"
   - Después de ver productos: "Busco otro libro", "Tenés de matemática?"
   - Quiere agregar más al carrito: "También quiero El Principito"
   
   IMPORTANTE: Si NO hay productos_presentados → SIEMPRE es "buscar_producto"

2. **"comprar"** - Usuario quiere comprar productos YA PRESENTADOS
   Casos:
   - "Quiero comprar el primero"
   - "Me llevo ambos"
   - "Sí, lo compro"
   - "Agregalo al carrito"
   
   IMPORTANTE: Solo si productos_presentados existe y usuario los menciona

3. **"consultar"** - Usuario tiene pregunta general (NO sobre productos)
   Casos:
   - "Qué horarios tienen?"
   - "Aceptan mercado pago?"
   - "Dónde están ubicados?"

4. **"despedida"** - Usuario se despide
   Casos:
   - "Nada más gracias"
   - "Chau"
   - "Está bien así"

FORMATO DE SALIDA (JSON):
{
  "tipo_accion": "buscar_producto",
  "confianza": 0.95,
  "razonamiento": "El usuario dijo 'busco harry potter' lo cual indica búsqueda de producto",
  "detalles": {
    "es_primera_interaccion": true,
    "hay_productos_en_contexto": false,
    "productos_referenciados": [],
    "es_agregar_mas": false
  }
}

REGLAS CRÍTICAS:
- Si NO hay productos_presentados → SIEMPRE "buscar_producto"
- Si hay productos_presentados Y usuario los menciona → "comprar"
- Si hay productos_presentados Y usuario busca OTROS → "buscar_producto" con es_agregar_mas=true
- Si pregunta horarios/pagos/ubicación → "consultar"
- Si se despide → "despedida"
- Usa el historial completo para entender el contexto`,
          extractionConfig: {
            variablesToExtract: [
              { nombre: 'tipo_accion', tipo: 'string', requerido: true },
              { nombre: 'confianza', tipo: 'number', requerido: true },
              { nombre: 'razonamiento', tipo: 'string', requerido: true },
              { nombre: 'detalles', tipo: 'object', requerido: false }
            ]
          }
        }
      },
      position: { x: 200, y: 100 }
    };
    
    // Verificar si ya existe
    const existeClasificador = flow.nodes.find(n => n.id === 'gpt-clasificador-inteligente');
    if (!existeClasificador) {
      flow.nodes.push(gptClasificador);
      console.log('   ✅ GPT Clasificador agregado');
    } else {
      console.log('   ⚠️  GPT Clasificador ya existe, actualizando...');
      const index = flow.nodes.findIndex(n => n.id === 'gpt-clasificador-inteligente');
      flow.nodes[index] = gptClasificador;
    }
    
    // ============================================================
    // PASO 2: Agregar Router Principal
    // ============================================================
    
    console.log('\n🔧 PASO 2: Agregando Router Principal...');
    
    const routerPrincipal = {
      id: 'router-principal',
      type: 'router',
      data: {
        label: 'Router Principal',
        config: {
          tipo: 'router',
          descripcion: 'Decide qué flujo ejecutar según la intención del usuario'
        }
      },
      position: { x: 400, y: 100 }
    };
    
    const existeRouterPrincipal = flow.nodes.find(n => n.id === 'router-principal');
    if (!existeRouterPrincipal) {
      flow.nodes.push(routerPrincipal);
      console.log('   ✅ Router Principal agregado');
    } else {
      console.log('   ⚠️  Router Principal ya existe');
    }
    
    // ============================================================
    // PASO 3: Agregar GPT Armar Carrito
    // ============================================================
    
    console.log('\n🔧 PASO 3: Agregando GPT Armar Carrito...');
    
    const gptArmarCarrito = {
      id: 'gpt-armar-carrito',
      type: 'gpt',
      data: {
        label: 'GPT Armar Carrito',
        config: {
          tipo: 'formateador',
          modelo: 'gpt-4',
          temperatura: 0.3,
          systemPrompt: `Eres un asistente que arma carritos de compra.

HISTORIAL COMPLETO:
{{historial_conversacion}}

PRODUCTOS PRESENTADOS:
{{global.productos_presentados}}

MENSAJE ACTUAL:
{{1.message}}

TU TRABAJO:
Extraer información del carrito basándote en el historial y mensaje actual.

FORMATO DE SALIDA (JSON):
{
  "productos_carrito": [
    {
      "id": 124,
      "nombre": "Harry Potter y la Cámara Secreta",
      "cantidad": 1,
      "precio": 25000
    }
  ],
  "total": 25000,
  "confirmacion_compra": true,
  "nombre_cliente": "Juan Pérez",
  "email_cliente": "juan@example.com",
  "telefono_cliente": "{{1.from}}"
}

REGLAS PARA confirmacion_compra:
- true si usuario dijo: "sí", "confirmo", "quiero comprar", "lo llevo", "compro"
- false si usuario NO confirmó explícitamente
- Si es la primera vez que arma el carrito → false (necesita confirmación)
- Si ya confirmó en mensaje anterior → true

REGLAS PARA productos_carrito:
- Si dice "el primero", usar primer producto de productos_presentados
- Si dice "ambos", incluir todos los productos_presentados
- Si menciona nombre específico, buscarlo en productos_presentados

REGLAS PARA datos del cliente:
- Extraer del historial si el usuario ya los proporcionó
- Si no están en el historial → null`,
          extractionConfig: {
            variablesToExtract: [
              { nombre: 'productos_carrito', tipo: 'array', requerido: true },
              { nombre: 'total', tipo: 'number', requerido: true },
              { nombre: 'confirmacion_compra', tipo: 'boolean', requerido: true },
              { nombre: 'nombre_cliente', tipo: 'string', requerido: false },
              { nombre: 'email_cliente', tipo: 'string', requerido: false },
              { nombre: 'telefono_cliente', tipo: 'string', requerido: true }
            ]
          }
        }
      },
      position: { x: 600, y: 200 }
    };
    
    const existeArmarCarrito = flow.nodes.find(n => n.id === 'gpt-armar-carrito');
    if (!existeArmarCarrito) {
      flow.nodes.push(gptArmarCarrito);
      console.log('   ✅ GPT Armar Carrito agregado');
    } else {
      console.log('   ⚠️  GPT Armar Carrito ya existe');
    }
    
    // ============================================================
    // PASO 4: Agregar Router Carrito
    // ============================================================
    
    console.log('\n🔧 PASO 4: Agregando Router Carrito...');
    
    const routerCarrito = {
      id: 'router-carrito',
      type: 'router',
      data: {
        label: 'Router Carrito',
        config: {
          tipo: 'router',
          descripcion: 'Verifica si el carrito está completo'
        }
      },
      position: { x: 800, y: 200 }
    };
    
    const existeRouterCarrito = flow.nodes.find(n => n.id === 'router-carrito');
    if (!existeRouterCarrito) {
      flow.nodes.push(routerCarrito);
      console.log('   ✅ Router Carrito agregado');
    } else {
      console.log('   ⚠️  Router Carrito ya existe');
    }
    
    // ============================================================
    // PASO 5: Agregar Nodos de WhatsApp
    // ============================================================
    
    console.log('\n🔧 PASO 5: Agregando nodos de WhatsApp...');
    
    const whatsappSolicitar = {
      id: 'whatsapp-solicitar-datos',
      type: 'whatsapp',
      data: {
        label: 'WhatsApp Solicitar Datos',
        config: {
          action: 'send-message',
          telefono: '{{1.from}}',
          message: `Para completar tu compra necesito:
- Tu nombre completo
- Tu email

¿Me los podés pasar? 😊`
        }
      },
      position: { x: 1000, y: 300 }
    };
    
    const whatsappLinkPago = {
      id: 'whatsapp-link-pago',
      type: 'whatsapp',
      data: {
        label: 'WhatsApp Link Pago',
        config: {
          action: 'send-message',
          telefono: '{{1.from}}',
          message: '¡Perfecto! 🎉\n\nTu pedido está listo para pagar.\n\n💰 Total: ${{total}}\n\n👉 Pagá aquí: {{mercadopago.init_point}}\n\nTe avisamos cuando se confirme el pago 📦'
        }
      },
      position: { x: 1000, y: 100 }
    };
    
    const existeSolicitar = flow.nodes.find(n => n.id === 'whatsapp-solicitar-datos');
    if (!existeSolicitar) {
      flow.nodes.push(whatsappSolicitar);
      console.log('   ✅ WhatsApp Solicitar Datos agregado');
    }
    
    const existeLinkPago = flow.nodes.find(n => n.id === 'whatsapp-link-pago');
    if (!existeLinkPago) {
      flow.nodes.push(whatsappLinkPago);
      console.log('   ✅ WhatsApp Link Pago agregado');
    }
    
    // ============================================================
    // PASO 6: Agregar Conexiones (Edges)
    // ============================================================
    
    console.log('\n🔧 PASO 6: Agregando conexiones...');
    
    const nuevasConexiones = [
      // Trigger → Clasificador
      {
        id: 'edge-trigger-clasificador',
        source: flow.nodes[0].id, // Primer nodo (trigger)
        target: 'gpt-clasificador-inteligente',
        data: { label: 'Mensaje recibido' }
      },
      // Clasificador → Router Principal
      {
        id: 'edge-clasificador-router',
        source: 'gpt-clasificador-inteligente',
        target: 'router-principal',
        data: { label: 'Intención clasificada' }
      },
      // Router Principal → Formateador (flujo actual)
      {
        id: 'edge-router-formateador',
        source: 'router-principal',
        target: flow.nodes[1].id, // Segundo nodo (formateador)
        data: {
          condition: 'tipo_accion equals buscar_producto',
          label: '🔍 Buscar'
        }
      },
      // Router Principal → Armar Carrito
      {
        id: 'edge-router-carrito',
        source: 'router-principal',
        target: 'gpt-armar-carrito',
        data: {
          condition: 'tipo_accion equals comprar',
          label: '🛒 Comprar'
        }
      },
      // Armar Carrito → Router Carrito
      {
        id: 'edge-armar-router-carrito',
        source: 'gpt-armar-carrito',
        target: 'router-carrito',
        data: { label: 'Carrito armado' }
      },
      // Router Carrito → Solicitar Datos
      {
        id: 'edge-router-solicitar',
        source: 'router-carrito',
        target: 'whatsapp-solicitar-datos',
        data: {
          condition: 'confirmacion_compra equals false',
          label: '❌ Faltan datos'
        }
      },
      // Router Carrito → Link Pago
      {
        id: 'edge-router-link',
        source: 'router-carrito',
        target: 'whatsapp-link-pago',
        data: {
          condition: 'confirmacion_compra equals true AND nombre_cliente exists AND email_cliente exists',
          label: '✅ Completo'
        }
      }
    ];
    
    let conexionesAgregadas = 0;
    for (const conexion of nuevasConexiones) {
      const existe = flow.edges.find(e => e.id === conexion.id);
      if (!existe) {
        flow.edges.push(conexion);
        conexionesAgregadas++;
      }
    }
    
    console.log(`   ✅ ${conexionesAgregadas} conexión(es) agregada(s)`);
    
    // ============================================================
    // PASO 7: Guardar Flujo Actualizado
    // ============================================================
    
    console.log('\n💾 Guardando flujo actualizado...');
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes, edges: flow.edges } }
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ FLUJO DE CARRITO IMPLEMENTADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📊 Resumen:');
    console.log(`   Nodos totales: ${flow.nodes.length}`);
    console.log(`   Edges totales: ${flow.edges.length}`);
    console.log(`   Nodos agregados: ${flow.nodes.length - 14}`);
    
    console.log('\n🎯 Nodos nuevos agregados:');
    console.log('   1. GPT Clasificador Inteligente');
    console.log('   2. Router Principal');
    console.log('   3. GPT Armar Carrito');
    console.log('   4. Router Carrito');
    console.log('   5. WhatsApp Solicitar Datos');
    console.log('   6. WhatsApp Link Pago');
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - El flujo actual NO fue modificado');
    console.log('   - Los nodos 1-14 permanecen intactos');
    console.log('   - Se agregaron nodos nuevos en paralelo');
    
    console.log('\n🧪 Próximos pasos:');
    console.log('   1. Probar el flujo actual (debe funcionar igual)');
    console.log('   2. Probar el clasificador con diferentes mensajes');
    console.log('   3. Probar el flujo de carrito completo');
    
  } catch (error) {
    console.error('❌ Error implementando flujo de carrito:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar implementación
implementarFlujoCarrito()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
