const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function agregarWhatsAppRespuesta() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const flowId = '695a156681f6d67f0ae9cf40';
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(flowId) });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log(`📊 Flujo actual:\n`);
    console.log('NODOS:');
    flow.nodes.forEach((n, i) => {
      console.log(`${i + 1}. ${n.id} (${n.type}) - ${n.data?.label}`);
    });
    
    console.log('\nEDGES:');
    flow.edges.forEach((e, i) => {
      console.log(`${i + 1}. ${e.source} → ${e.target} (${e.sourceHandle || 'default'})`);
    });

    // Verificar si el edge gpt-conversacional → gpt-formateador existe
    const edgeDirecto = flow.edges.find(e => 
      e.source === 'gpt-conversacional' && e.target === 'gpt-formateador'
    );

    if (edgeDirecto) {
      console.log('\n❌ PROBLEMA: GPT conversacional va directo a GPT formateador');
      console.log('   Falta nodo WhatsApp Send Message en el medio\n');

      // Agregar nuevo nodo WhatsApp
      const nuevoNodo = {
        id: 'whatsapp-respuesta-gpt',
        type: 'whatsapp',
        category: 'action',
        position: { x: 400, y: 200 },
        data: {
          label: 'WhatsApp Business Cloud',
          subtitle: 'Send a Message',
          executionCount: 2,
          config: {
            module: 'send-message',
            phoneNumberId: '906667632531979',
            message: '{{respuesta_gpt}}',
            to: '{{from}}'
          }
        }
      };

      // Insertar nodo después de gpt-conversacional
      const gptConvIndex = flow.nodes.findIndex(n => n.id === 'gpt-conversacional');
      flow.nodes.splice(gptConvIndex + 1, 0, nuevoNodo);

      // Modificar edge existente: gpt-conversacional → whatsapp-respuesta-gpt
      const edgeIndex = flow.edges.findIndex(e => 
        e.source === 'gpt-conversacional' && e.target === 'gpt-formateador'
      );
      
      flow.edges[edgeIndex].target = 'whatsapp-respuesta-gpt';

      // Agregar nuevo edge: whatsapp-respuesta-gpt → gpt-formateador
      flow.edges.push({
        id: 'whatsapp-respuesta-gpt-to-formateador',
        source: 'whatsapp-respuesta-gpt',
        target: 'gpt-formateador',
        sourceHandle: 'default',
        type: 'simple'
      });

      console.log('✅ Cambios preparados:\n');
      console.log('   ➕ Nodo agregado: whatsapp-respuesta-gpt');
      console.log('   🔄 Edge modificado: gpt-conversacional → whatsapp-respuesta-gpt');
      console.log('   ➕ Edge agregado: whatsapp-respuesta-gpt → gpt-formateador\n');

      // Guardar
      const result = await flowsCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(flowId) },
        { $set: { nodes: flow.nodes, edges: flow.edges } }
      );

      console.log(`💾 Resultado: ${result.modifiedCount} documento(s) modificado(s)\n`);

      if (result.modifiedCount > 0) {
        console.log('✅ Flujo actualizado correctamente\n');
        
        console.log('📋 NUEVA ESTRUCTURA:\n');
        console.log('1. whatsapp-trigger (trigger)');
        console.log('   ↓');
        console.log('2. gpt-conversacional (processor)');
        console.log('   ↓');
        console.log('3. whatsapp-respuesta-gpt (action) ← NUEVO');
        console.log('   ↓');
        console.log('4. gpt-formateador (processor)');
        console.log('   ↓');
        console.log('5. validador-datos (processor)');
        console.log('   ↓');
        console.log('...\n');
      }
    } else {
      console.log('\n✅ El flujo ya tiene la estructura correcta');
      console.log('   No hay edge directo gpt-conversacional → gpt-formateador\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

agregarWhatsAppRespuesta();
