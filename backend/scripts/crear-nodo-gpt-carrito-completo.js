import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function crearNodoGPTCarritoCompleto() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Creando nodo GPT Carrito completo...\n');
    
    // Eliminar nodo gpt-armar-carrito si existe
    const indexGPTViejo = wooFlow.nodes.findIndex(n => n.id === 'gpt-armar-carrito');
    if (indexGPTViejo !== -1) {
      wooFlow.nodes.splice(indexGPTViejo, 1);
      console.log('✅ Nodo gpt-armar-carrito eliminado');
    }
    
    // Crear nuevo nodo GPT Carrito
    const nodoGPTCarrito = {
      id: 'gpt-carrito',
      type: 'gpt',
      data: {
        label: 'GPT Carrito',
        config: {
          tipo: 'conversacional',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          outputFormat: 'structured',
          systemPrompt: `Eres el asistente de carrito de la librería Veo Veo.

Tu trabajo es manejar TODO lo relacionado con el carrito de compras.

CONTEXTO QUE RECIBIRÁS:

1. Si viene de "agregar_carrito":
   - productos_presentados: array de productos mostrados
   - mensaje_usuario: número del producto seleccionado (ej: "3")
   - Debes crear el objeto carrito con el producto seleccionado

2. Si viene de confirmación de pago (webhook MercadoPago):
   - confirmacion_pago: true
   - Debes generar mensaje de confirmación de pago exitoso

INSTRUCCIONES:

Para AGREGAR AL CARRITO:
- Usa productos_presentados[mensaje_usuario - 1] para obtener el producto
- Crea el objeto carrito con: productos (array) y total (número)
- Genera mensaje amigable confirmando el agregado
- Establece accion_siguiente = "pagar"

Para CONFIRMACIÓN DE PAGO:
- Genera mensaje de confirmación de pago exitoso
- Establece accion_siguiente = "confirmar_pago"
- NO necesitas objeto carrito en este caso

IMPORTANTE:
- Siempre genera respuesta_gpt con mensaje claro para el usuario
- Siempre establece accion_siguiente para que el router sepa qué hacer`,
          extractionConfig: {
            enabled: true,
            systemPrompt: `Extrae la información necesaria según el contexto:

Si es agregar_carrito:
- carrito: objeto con productos (array) y total (número)
- accion_siguiente: "pagar"

Si es confirmacion_pago:
- accion_siguiente: "confirmar_pago"

Ejemplo para agregar_carrito:
{
  "carrito": {
    "productos": [{
      "id": "789",
      "nombre": "HARRY POTTER Y EL MISTERIO DEL PRINCIPE",
      "precio": 35000,
      "cantidad": 1
    }],
    "total": 35000
  },
  "accion_siguiente": "pagar"
}

Ejemplo para confirmacion_pago:
{
  "accion_siguiente": "confirmar_pago"
}`,
            fields: [
              {
                name: 'carrito',
                type: 'object',
                description: 'Objeto con productos (array) y total (número). Solo para agregar_carrito.',
                required: false
              },
              {
                name: 'accion_siguiente',
                type: 'string',
                description: 'Acción siguiente: "pagar" o "confirmar_pago"',
                required: true
              }
            ]
          },
          globalVariablesOutput: ['carrito', 'accion_siguiente']
        },
        hasConnection: true,
        color: '#10b981'
      },
      position: {
        x: 525,
        y: 150
      },
      width: 80,
      height: 80
    };
    
    wooFlow.nodes.push(nodoGPTCarrito);
    console.log('✅ Nodo gpt-carrito creado');
    
    // Actualizar edge de router-principal a gpt-carrito
    const edgeRouterPrincipal = wooFlow.edges.find(e => 
      e.source === 'router-principal' && 
      e.data?.label === '🛒 Agregar al Carrito'
    );
    
    if (edgeRouterPrincipal) {
      edgeRouterPrincipal.target = 'gpt-carrito';
      console.log('✅ Edge actualizado: router-principal → gpt-carrito');
    }
    
    // Crear edge de gpt-carrito a router-carrito
    const edgeGPTCarrito = wooFlow.edges.find(e => e.source === 'gpt-armar-carrito');
    if (edgeGPTCarrito) {
      edgeGPTCarrito.source = 'gpt-carrito';
      edgeGPTCarrito.id = 'gpt-carrito-to-router-carrito';
      console.log('✅ Edge actualizado: gpt-carrito → router-carrito');
    } else {
      wooFlow.edges.push({
        id: 'gpt-carrito-to-router-carrito',
        source: 'gpt-carrito',
        target: 'router-carrito',
        sourceHandle: 'b',
        targetHandle: 'a',
        type: 'smoothstep',
        animated: false
      });
      console.log('✅ Edge creado: gpt-carrito → router-carrito');
    }
    
    // Actualizar condiciones del router-carrito
    const routerCarrito = wooFlow.nodes.find(n => n.id === 'router-carrito');
    if (routerCarrito) {
      console.log('\n🔀 Actualizando router-carrito...');
      
      // Buscar edges del router-carrito
      const edgesRouterCarrito = wooFlow.edges.filter(e => e.source === 'router-carrito');
      
      edgesRouterCarrito.forEach(edge => {
        if (edge.data?.label?.includes('Pago')) {
          // Ruta a MercadoPago
          edge.data.condition = {
            field: 'accion_siguiente',
            operator: 'equals',
            value: 'pagar'
          };
          console.log(`   ✅ Condición agregada a "${edge.data.label}": accion_siguiente === "pagar"`);
        } else if (edge.data?.label?.includes('Confirmación') || edge.target === 'whatsapp-confirmacion-pago') {
          // Ruta a confirmación de pago
          edge.data.condition = {
            field: 'accion_siguiente',
            operator: 'equals',
            value: 'confirmar_pago'
          };
          console.log(`   ✅ Condición agregada a "${edge.data.label}": accion_siguiente === "confirmar_pago"`);
        }
      });
    }
    
    console.log('\n💾 Guardando cambios...');
    
    await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          edges: wooFlow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ NODO GPT CARRITO CREADO Y CONFIGURADO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 FLUJO COMPLETO:');
    console.log('');
    console.log('CASO 1: Agregar al carrito');
    console.log('   router-principal (agregar_carrito)');
    console.log('     ↓');
    console.log('   gpt-carrito');
    console.log('     ↓ Genera: carrito.productos, carrito.total');
    console.log('     ↓ Genera: accion_siguiente = "pagar"');
    console.log('   router-carrito');
    console.log('     ↓ Valida: accion_siguiente === "pagar"');
    console.log('   mercadopago-crear-preference');
    console.log('     ↓ Lee: carrito.productos, carrito.total');
    console.log('   whatsapp-link-pago');
    console.log('');
    console.log('CASO 2: Confirmación de pago (desde webhook)');
    console.log('   webhook-mercadopago');
    console.log('     ↓ Genera: confirmacion_pago = true');
    console.log('   gpt-carrito');
    console.log('     ↓ Genera: accion_siguiente = "confirmar_pago"');
    console.log('   router-carrito');
    console.log('     ↓ Valida: accion_siguiente === "confirmar_pago"');
    console.log('   whatsapp-confirmacion-pago');
    console.log('');
    
    console.log('✅ Variables globales guardadas:');
    console.log('   - carrito (objeto con productos y total)');
    console.log('   - accion_siguiente ("pagar" o "confirmar_pago")');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

crearNodoGPTCarritoCompleto();
