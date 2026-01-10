require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

async function fixFlowWhatsAppConfig() {
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
    
    // Actualizar nodos WhatsApp con configuración de teléfono
    const updatedNodes = flow.nodes.map(node => {
      // Nodos WhatsApp que envían mensajes
      if (node.type === 'whatsapp' && node.data.config.module === 'send-message') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              telefono: '{{telefono_cliente}}', // Variable del contacto
              phoneNumberId: '906667632531979',
              empresaId: '6940a9a181b92bfce970fdb5'
            }
          }
        };
      }
      
      // Router: asegurar que tenga rutas configuradas correctamente
      if (node.type === 'router') {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              tipo: 'condicional',
              routes: [
                {
                  id: 'route-1',
                  label: 'Faltan datos',
                  condition: '{{busqueda}} not exists',
                  descripcion: 'Si no se extrajo el término de búsqueda'
                },
                {
                  id: 'route-2',
                  label: 'JSON completo',
                  condition: '{{busqueda}} exists',
                  descripcion: 'Si ya tenemos el término de búsqueda'
                }
              ]
            }
          }
        };
      }
      
      return node;
    });
    
    await flowsCollection.updateOne(
      { _id: flowId },
      { 
        $set: { 
          nodes: updatedNodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Flujo actualizado correctamente\n');
    console.log('📋 Cambios aplicados:');
    console.log('  ✓ Nodos WhatsApp: telefono configurado como {{telefono_cliente}}');
    console.log('  ✓ Nodos WhatsApp: phoneNumberId y empresaId configurados');
    console.log('  ✓ Router: rutas configuradas correctamente con IDs');
    console.log('\n✅ Listo para testear desde WhatsApp');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixFlowWhatsAppConfig();
