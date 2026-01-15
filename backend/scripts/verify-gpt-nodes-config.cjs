require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function verifyGPTNodesConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const flowsCollection = db.collection('flows');
    
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN DE NODOS GPT');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verificar GPT Conversacional
    const gptConv = flow.nodes.find(n => n.id === 'gpt-conversacional');
    if (gptConv) {
      console.log('📋 NODO: gpt-conversacional');
      console.log('─────────────────────────────────────────────────────────');
      console.log('Tipo:', gptConv.data.config.tipo);
      console.log('Modelo:', gptConv.data.config.modelo);
      console.log('\n📝 INSTRUCCIONES:');
      console.log(gptConv.data.config.instrucciones?.substring(0, 200) || 'NO DEFINIDAS');
      console.log('\n👤 PERSONALIDAD:');
      console.log(gptConv.data.config.personalidad || 'NO DEFINIDA');
      console.log('\n📚 TÓPICOS:');
      if (gptConv.data.config.topicos && gptConv.data.config.topicos.length > 0) {
        gptConv.data.config.topicos.forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.titulo || t}`);
        });
      } else {
        console.log('  NO DEFINIDOS');
      }
      console.log('\n📊 VARIABLES A RECOPILAR:');
      if (gptConv.data.config.variablesRecopilar && gptConv.data.config.variablesRecopilar.length > 0) {
        gptConv.data.config.variablesRecopilar.forEach((v, i) => {
          console.log(`  ${i + 1}. ${v.nombre} (${v.tipo}) - ${v.obligatorio ? 'OBLIGATORIO' : 'OPCIONAL'}`);
          console.log(`     ${v.descripcion}`);
        });
      } else {
        console.log('  NO DEFINIDAS');
      }
    }
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    
    // Verificar GPT Formateador
    const gptForm = flow.nodes.find(n => n.id === 'gpt-formateador');
    if (gptForm) {
      console.log('📋 NODO: gpt-formateador');
      console.log('─────────────────────────────────────────────────────────');
      console.log('Tipo:', gptForm.data.config.tipo);
      console.log('Modelo:', gptForm.data.config.modelo);
      
      console.log('\n🔧 CONFIGURACIÓN DE EXTRACCIÓN:');
      if (gptForm.data.config.configuracionExtraccion) {
        const ce = gptForm.data.config.configuracionExtraccion;
        console.log('  Fuente de datos:', ce.fuenteDatos);
        console.log('  Formato salida:', ce.formatoSalida);
        console.log('  Campos esperados:', ce.camposEsperados?.join(', ') || 'NO DEFINIDOS');
        console.log('\n  📝 INSTRUCCIONES DE EXTRACCIÓN:');
        console.log('  ', ce.instruccionesExtraccion?.substring(0, 200) || 'NO DEFINIDAS');
      } else {
        console.log('  NO CONFIGURADA');
      }
      
      console.log('\n📊 VARIABLES A RECOPILAR:');
      if (gptForm.data.config.variablesRecopilar && gptForm.data.config.variablesRecopilar.length > 0) {
        gptForm.data.config.variablesRecopilar.forEach((v, i) => {
          console.log(`  ${i + 1}. ${v.nombre} (${v.tipo}) - ${v.obligatorio ? 'OBLIGATORIO' : 'OPCIONAL'}`);
        });
      } else {
        console.log('  NO DEFINIDAS');
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyGPTNodesConfig();
