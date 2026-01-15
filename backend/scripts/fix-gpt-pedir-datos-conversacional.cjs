const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixGptPedirDatos() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX: GPT PEDIR DATOS - CONVERSACIONAL PURO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    const pedirDatos = flow.nodes.find(n => n.id === 'gpt-pedir-datos');
    
    console.log('📋 CONFIGURACIÓN ACTUAL:\n');
    console.log(`   tipo: ${pedirDatos.data.config.tipo}`);
    console.log(`   variablesRecopilar: ${JSON.stringify(pedirDatos.data.config.variablesRecopilar)}`);
    console.log('');
    
    console.log('❌ PROBLEMA:');
    console.log('   El nodo tiene variablesRecopilar configurado, lo que hace que');
    console.log('   entre al modo legacy y marque variables como faltantes.');
    console.log('');
    console.log('✅ SOLUCIÓN:');
    console.log('   1. Cambiar tipo a "conversacional"');
    console.log('   2. Vaciar variablesRecopilar');
    console.log('   3. El nodo solo generará mensajes, NO extraerá variables');
    console.log('');
    
    // Actualizar configuración
    const result = await flowsCollection.updateOne(
      { 
        _id: new ObjectId(FLOW_ID),
        'nodes.id': 'gpt-pedir-datos'
      },
      {
        $set: {
          'nodes.$.data.config.tipo': 'conversacional',
          'nodes.$.data.config.variablesRecopilar': []
        }
      }
    );
    
    console.log(`✅ Nodo actualizado: ${result.modifiedCount} cambio(s)\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 FLUJO CORRECTO AHORA:\n');
    console.log('1. Usuario: "Hola"');
    console.log('   ↓');
    console.log('2. gpt-formateador: Extrae variables (todo null)');
    console.log('   → variables_completas = false');
    console.log('   → variables_faltantes = ["titulo"]');
    console.log('   ↓');
    console.log('3. router: Evalúa condiciones');
    console.log('   → variables_faltantes not_empty = TRUE');
    console.log('   ↓');
    console.log('4. gpt-pedir-datos: Genera mensaje conversacional');
    console.log('   → NO extrae variables (modo conversacional)');
    console.log('   → Responde: "¡Hola! 😊 ¿En qué puedo ayudarte?"');
    console.log('   ↓');
    console.log('5. whatsapp-preguntar: Envía mensaje');
    console.log('   ↓');
    console.log('6. FIN (espera respuesta del usuario)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixGptPedirDatos();
