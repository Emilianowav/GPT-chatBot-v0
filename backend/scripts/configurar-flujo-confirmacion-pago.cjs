/**
 * Script para Configurar Flujo de Confirmación de Pago
 * 
 * OBJETIVO:
 * 1. Crear nodo MercadoPago de verificación
 * 2. Modificar GPT Armar Carrito para detectar confirmación de pago
 * 3. Agregar tercera rama al Router Carrito
 * 4. Crear nodo WhatsApp de confirmación
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function configurarFlujoConfirmacion() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    
    console.log('═'.repeat(80));
    console.log('🔧 CONFIGURANDO FLUJO DE CONFIRMACIÓN DE PAGO');
    console.log('═'.repeat(80));
    
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      return;
    }

    // 1. CREAR NODO MERCADOPAGO VERIFICAR PAGO
    console.log('\n📦 1. Creando nodo MercadoPago Verificar Pago...');
    
    const verificarPagoNode = {
      id: 'mercadopago-verificar-pago',
      type: 'mercadopago',
      position: { x: 250, y: 450 },
      data: {
        label: 'Verificar Pago MP',
        config: {
          action: 'verificar_pago'
        }
      }
    };
    
    // Verificar si ya existe
    const existeVerificar = flow.nodes.find(n => n.id === 'mercadopago-verificar-pago');
    if (!existeVerificar) {
      flow.nodes.push(verificarPagoNode);
      console.log('   ✅ Nodo mercadopago-verificar-pago creado');
    } else {
      console.log('   ⚠️  Nodo mercadopago-verificar-pago ya existe, actualizando...');
      const index = flow.nodes.findIndex(n => n.id === 'mercadopago-verificar-pago');
      flow.nodes[index] = verificarPagoNode;
    }

    // 2. MODIFICAR GPT ARMAR CARRITO
    console.log('\n📝 2. Modificando GPT Armar Carrito para detectar confirmación...');
    
    const carritoIndex = flow.nodes.findIndex(n => n.id === 'gpt-armar-carrito');
    if (carritoIndex !== -1) {
      const nuevoSystemPrompt = `Eres un asistente experto en armar carritos de compra para una librería.

HISTORIAL COMPLETO DE LA CONVERSACIÓN:
{{historial_conversacion}}

MENSAJE ACTUAL DEL USUARIO:
{{1.message}}

ESTADO DEL PAGO (si existe):
{{mercadopago_estado}}

LINK DE PAGO (si existe):
{{mercadopago_link}}

TU TRABAJO:
Analizar el historial completo y el mensaje actual para extraer información del carrito.

REGLAS IMPORTANTES:

1. DETECTAR TIPO DE MENSAJE:
   - Si usuario pregunta "ya pagué", "pagué", "hice el pago" → tipo_mensaje = "verificar_pago"
   - Si usuario confirma compra "lo quiero", "confirmo" → tipo_mensaje = "confirmar_compra"
   - Si usuario pregunta o consulta → tipo_mensaje = "consulta"

2. PRODUCTOS EN EL CARRITO:
   - Busca en el historial TODOS los productos que el bot presentó (con precio, nombre, ID)
   - Si el usuario dijo "lo quiero", "agregar al carrito", "sí", "confirmo" → agregar ese producto
   - Si el usuario pregunta "podemos agregar otro" → mantener productos previos y esperar confirmación
   - Si el usuario menciona un producto específico → buscarlo en el historial

3. CONFIRMACIÓN DE COMPRA:
   - true SOLO si el usuario confirmó explícitamente: "sí", "lo quiero", "confirmo", "comprar"
   - false si es una pregunta o consulta: "podemos agregar", "cuánto cuesta", etc.

4. DATOS DEL CLIENTE:
   - Extraer del historial si el usuario ya los proporcionó
   - Si no están → null

FORMATO DE SALIDA (JSON estricto):
{
  "tipo_mensaje": "verificar_pago" | "confirmar_compra" | "consulta",
  "productos_carrito": [
    {
      "id": 126,
      "nombre": "Harry Potter y la Orden del Fénix",
      "cantidad": 1,
      "precio": 49000
    }
  ],
  "total": 49000,
  "confirmacion_compra": true,
  "nombre_cliente": null,
  "email_cliente": null,
  "telefono_cliente": "{{1.from}}"
}

EJEMPLOS:

Usuario: "ya pagué"
→ Output: {"tipo_mensaje": "verificar_pago", "productos_carrito": [], "total": 0, "confirmacion_compra": false}

Usuario: "lo quiero"
→ Output: {"tipo_mensaje": "confirmar_compra", "productos_carrito": [...], "total": 49000, "confirmacion_compra": true}

Usuario: "podemos agregar otro?"
→ Output: {"tipo_mensaje": "consulta", "productos_carrito": [], "total": 0, "confirmacion_compra": false}`;

      if (flow.nodes[carritoIndex].data.config.extractionConfig) {
        flow.nodes[carritoIndex].data.config.extractionConfig.systemPrompt = nuevoSystemPrompt;
        
        // Agregar tipo_mensaje a las variables a extraer
        const variables = flow.nodes[carritoIndex].data.config.extractionConfig.variables || [];
        if (!variables.find(v => v.nombre === 'tipo_mensaje')) {
          variables.unshift({
            nombre: 'tipo_mensaje',
            tipo: 'string',
            descripcion: 'Tipo de mensaje: verificar_pago, confirmar_compra, consulta',
            obligatoria: true
          });
          flow.nodes[carritoIndex].data.config.extractionConfig.variables = variables;
        }
      }
      
      console.log('   ✅ GPT Armar Carrito actualizado con detección de tipo_mensaje');
    }

    // 3. AGREGAR TERCERA RAMA AL ROUTER CARRITO
    console.log('\n🔀 3. Agregando tercera rama al Router Carrito...');
    
    // Buscar edge de router a mercadopago
    const edgeRouterMP = flow.edges.find(e => 
      e.source === 'router-carrito' && 
      e.target === 'mercadopago-crear-preference'
    );
    
    if (edgeRouterMP) {
      edgeRouterMP.id = 'edge-router-mercadopago';
      edgeRouterMP.sourceHandle = 'edge-router-mercadopago';
      edgeRouterMP.data = {
        ...edgeRouterMP.data,
        label: '💳 Generar Link',
        condition: '{{tipo_mensaje}} equals confirmar_compra'
      };
      console.log('   ✅ Edge router → mercadopago actualizado');
    }

    // Crear edge de router a verificar pago
    const edgeRouterVerificar = {
      id: 'edge-router-verificar',
      source: 'router-carrito',
      target: 'mercadopago-verificar-pago',
      sourceHandle: 'edge-router-verificar',
      data: {
        label: '✅ Verificar Pago',
        condition: '{{tipo_mensaje}} equals verificar_pago'
      }
    };
    
    const existeEdgeVerificar = flow.edges.find(e => e.id === 'edge-router-verificar');
    if (!existeEdgeVerificar) {
      flow.edges.push(edgeRouterVerificar);
      console.log('   ✅ Edge router → verificar-pago creado');
    }

    // 4. CREAR EDGE DE VERIFICAR PAGO A GPT CARRITO
    console.log('\n🔗 4. Conectando verificar-pago → gpt-armar-carrito...');
    
    const edgeVerificarCarrito = {
      id: 'edge-verificar-carrito',
      source: 'mercadopago-verificar-pago',
      target: 'gpt-armar-carrito',
      data: {
        label: 'Procesar resultado'
      }
    };
    
    const existeEdgeVerificarCarrito = flow.edges.find(e => e.id === 'edge-verificar-carrito');
    if (!existeEdgeVerificarCarrito) {
      flow.edges.push(edgeVerificarCarrito);
      console.log('   ✅ Edge verificar-pago → gpt-armar-carrito creado');
    }

    // 5. CREAR NODO WHATSAPP CONFIRMACION
    console.log('\n📱 5. Creando nodo WhatsApp Confirmación...');
    
    const whatsappConfirmacionNode = {
      id: 'whatsapp-confirmacion-pago',
      type: 'whatsapp',
      position: { x: 650, y: 500 },
      data: {
        label: 'WhatsApp Confirmación',
        config: {
          module: 'send-message',
          message: '{{mercadopago-verificar-pago.mensaje}}',
          to: '{{1.from}}'
        }
      }
    };
    
    const existeWhatsappConf = flow.nodes.find(n => n.id === 'whatsapp-confirmacion-pago');
    if (!existeWhatsappConf) {
      flow.nodes.push(whatsappConfirmacionNode);
      console.log('   ✅ Nodo whatsapp-confirmacion-pago creado');
    }

    // 6. AGREGAR CUARTA RAMA AL ROUTER (confirmación)
    console.log('\n🔀 6. Agregando rama de confirmación al Router...');
    
    const edgeRouterConfirmacion = {
      id: 'edge-router-confirmacion',
      source: 'router-carrito',
      target: 'whatsapp-confirmacion-pago',
      sourceHandle: 'edge-router-confirmacion',
      data: {
        label: '✅ Pago Confirmado',
        condition: '{{mercadopago_estado}} equals approved'
      }
    };
    
    const existeEdgeConfirmacion = flow.edges.find(e => e.id === 'edge-router-confirmacion');
    if (!existeEdgeConfirmacion) {
      flow.edges.push(edgeRouterConfirmacion);
      console.log('   ✅ Edge router → whatsapp-confirmacion creado');
    }

    // Guardar cambios
    console.log('\n💾 Guardando cambios en BD...');
    const result = await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          nodes: flow.nodes,
          edges: flow.edges,
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Flow actualizado exitosamente\n');
      
      console.log('📊 RESUMEN DE CAMBIOS:');
      console.log('   ✅ Nodo mercadopago-verificar-pago creado');
      console.log('   ✅ GPT Armar Carrito detecta tipo_mensaje');
      console.log('   ✅ Router Carrito tiene 4 ramas:');
      console.log('      1. Pedir datos (sin condición)');
      console.log('      2. Generar link (tipo_mensaje = confirmar_compra)');
      console.log('      3. Verificar pago (tipo_mensaje = verificar_pago)');
      console.log('      4. Confirmación (mercadopago_estado = approved)');
      console.log('   ✅ Nodo whatsapp-confirmacion-pago creado');
      
      console.log('\n💡 FLUJO COMPLETO:');
      console.log('   Usuario: "ya pagué"');
      console.log('   → Clasificador → Router Principal → GPT Carrito');
      console.log('   → tipo_mensaje = "verificar_pago"');
      console.log('   → Router Carrito → MercadoPago Verificar');
      console.log('   → Verificar Pago → GPT Carrito (con estado)');
      console.log('   → Router Carrito → WhatsApp Confirmación');
      console.log('   → Mensaje: "✅ ¡Pago aprobado!" o "⏳ Pago pendiente"');
    } else {
      console.log('⚠️  No se modificó el flow');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
configurarFlujoConfirmacion()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
