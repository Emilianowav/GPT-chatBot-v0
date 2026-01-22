import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixGPTOutputFormat() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Corrigiendo outputFormat de gpt-armar-carrito...\n');
    
    const nodoGPT = wooFlow.nodes.find(n => n.id === 'gpt-armar-carrito');
    
    if (!nodoGPT) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }
    
    console.log('📋 Configuración actual:');
    console.log(`   outputFormat: ${nodoGPT.data.config.outputFormat}`);
    console.log(`   globalVariablesOutput: ${JSON.stringify(nodoGPT.data.config.globalVariablesOutput)}`);
    
    // El problema: outputFormat está en "json_object" que hace que GPT genere
    // TODO como string JSON dentro de respuesta_gpt
    
    // Solución: Cambiar a formato estructurado con extractionConfig
    nodoGPT.data.config.outputFormat = 'structured';
    nodoGPT.data.config.extractionConfig = {
      enabled: true,
      systemPrompt: `Extrae la información del carrito del mensaje del usuario.

El usuario acaba de seleccionar un producto de la lista presentada.

IMPORTANTE: Usa productos_presentados[mensaje_usuario - 1] para obtener el producto correcto.

Debes extraer:
- carrito: objeto con productos (array) y total (número)

Ejemplo:
Si mensaje_usuario = "3" y productos_presentados tiene:
[
  {id: "123", titulo: "Libro 1", precio: 10000},
  {id: "456", titulo: "Libro 2", precio: 20000},
  {id: "789", titulo: "Libro 3", precio: 30000}
]

Entonces carrito debe ser:
{
  "productos": [
    {
      "id": "789",
      "nombre": "Libro 3",
      "precio": 30000,
      "cantidad": 1
    }
  ],
  "total": 30000
}`,
      fields: [
        {
          name: 'carrito',
          type: 'object',
          description: 'Objeto con productos (array) y total (número)',
          required: true
        }
      ]
    };
    
    // Mantener globalVariablesOutput
    nodoGPT.data.config.globalVariablesOutput = ['carrito'];
    
    // Actualizar systemPrompt para que sea más claro
    nodoGPT.data.config.systemPrompt = `Eres el asistente de carrito de la librería Veo Veo.

El usuario acaba de seleccionar un producto de la lista.

Genera un mensaje de confirmación amigable y cercano.

Ejemplo:
"¡Genial! Agregué \\"Harry Potter\\" a tu carrito 📚

💰 Total: $35000

¿Querés finalizar la compra o deseas agregar algo más?"`;
    
    console.log('\n✅ Configuración actualizada:');
    console.log(`   outputFormat: ${nodoGPT.data.config.outputFormat}`);
    console.log(`   extractionConfig.enabled: ${nodoGPT.data.config.extractionConfig.enabled}`);
    console.log(`   globalVariablesOutput: ${JSON.stringify(nodoGPT.data.config.globalVariablesOutput)}`);
    
    console.log('\n💾 Guardando cambios...');
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ OUTPUT FORMAT CORREGIDO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 AHORA EL GPT GENERARÁ:');
    console.log(JSON.stringify({
      respuesta_gpt: "¡Genial! Agregué...",
      carrito: {
        productos: [{
          id: "789",
          nombre: "HARRY POTTER...",
          precio: 35000,
          cantidad: 1
        }],
        total: 35000
      }
    }, null, 2));
    
    console.log('\n✅ Y se guardará "carrito" como variable global');
    console.log('✅ MercadoPago podrá acceder a carrito.productos y carrito.total');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGPTOutputFormat();
