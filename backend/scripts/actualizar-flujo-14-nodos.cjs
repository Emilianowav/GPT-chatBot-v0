require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'crm_bot';
const FLUJO_ID = '695a156681f6d67f0ae9cf40';

async function actualizarFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLUJO_ID) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }
    
    console.log('📊 FLUJO ACTUAL:');
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}\n`);
    
    // Verificar si ya tiene el edge
    const edgeExiste = flow.edges.some(e => 
      e.source === 'gpt-pedir-datos' && 
      e.target === 'gpt-formateador' &&
      e.data?.condition?.includes('variables_completas')
    );
    
    if (edgeExiste) {
      console.log('✅ El edge pedir-datos → formateador YA EXISTE\n');
      
      // Mostrar edges actuales
      console.log('📋 EDGES DESDE gpt-pedir-datos:');
      const edgesPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
      edgesPedirDatos.forEach(e => {
        console.log(`   - ${e.target}: ${e.data?.condition || 'sin condición'}`);
      });
      
      return;
    }
    
    console.log('🔧 AGREGANDO EDGE: gpt-pedir-datos → gpt-formateador\n');
    
    // Agregar edge
    flow.edges.push({
      id: 'edge-pedir-formateador-loop',
      source: 'gpt-pedir-datos',
      target: 'gpt-formateador',
      type: 'default',
      data: {
        condition: '{{gpt-pedir-datos.variables_completas}} equals true',
        label: 'Re-evaluar (loop)'
      }
    });
    
    // Actualizar edge existente para que solo se ejecute si faltan variables
    const edgePedirWhatsapp = flow.edges.find(e => 
      e.source === 'gpt-pedir-datos' && e.target === 'whatsapp-preguntar'
    );
    
    if (edgePedirWhatsapp && !edgePedirWhatsapp.data?.condition) {
      edgePedirWhatsapp.data = {
        ...edgePedirWhatsapp.data,
        condition: '{{gpt-pedir-datos.variables_completas}} equals false',
        label: 'Enviar pregunta'
      };
      console.log('✅ Edge pedir-datos → whatsapp actualizado con condición\n');
    }
    
    // Actualizar en BD
    const result = await flowsCollection.updateOne(
      { _id: new ObjectId(FLUJO_ID) },
      { 
        $set: { 
          edges: flow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ FLUJO ACTUALIZADO\n');
      console.log(`📊 Total edges: ${flow.edges.length}`);
      
      console.log('\n📋 EDGES DESDE gpt-pedir-datos:');
      const edgesPedirDatos = flow.edges.filter(e => e.source === 'gpt-pedir-datos');
      edgesPedirDatos.forEach(e => {
        console.log(`   - ${e.target}: ${e.data?.condition || 'sin condición'}`);
      });
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

actualizarFlujo();
