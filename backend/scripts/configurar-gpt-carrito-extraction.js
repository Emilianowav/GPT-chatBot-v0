import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function configurarGPTCarritoExtraction() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flowId = new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    
    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }
    
    const nodeIndex = flow.nodes?.findIndex(n => n.id === 'gpt-carrito');
    
    if (nodeIndex === -1) {
      console.log('❌ Nodo gpt-carrito no encontrado');
      process.exit(1);
    }
    
    const node = flow.nodes[nodeIndex];
    
    console.log('\n🔧 Configurando extractionConfig para gpt-carrito...');
    
    // Configurar extractionConfig
    node.data.config.extractionConfig = {
      enabled: true,
      contextSource: 'historial_completo',
      method: 'advanced',
      variablesToExtract: [
        {
          nombre: 'carrito_items',
          tipo: 'array',
          descripcion: 'Array de productos en el carrito. Cada producto debe tener: id (string), nombre (string), precio (number), cantidad (number)',
          obligatoria: true,
          ejemplo: '[{"id": "123", "nombre": "Alfa y Beto", "precio": 700, "cantidad": 1}]'
        },
        {
          nombre: 'carrito_total',
          tipo: 'number',
          descripcion: 'Suma total del carrito (precio × cantidad de cada producto)',
          obligatoria: true,
          ejemplo: '700'
        },
        {
          nombre: 'accion_siguiente',
          tipo: 'string',
          descripcion: 'Acción que el usuario quiere realizar: agregar_mas, ver_carrito, confirmar_pago, vaciar_carrito',
          obligatoria: true,
          ejemplo: 'confirmar_pago'
        }
      ]
    };
    
    console.log('✅ extractionConfig configurado');
    console.log('   - enabled: true');
    console.log('   - contextSource: historial_completo');
    console.log('   - Variables a extraer: carrito_items, carrito_total, accion_siguiente');
    
    // Guardar cambios
    flow.nodes[nodeIndex] = node;
    
    await flowsCollection.updateOne(
      { _id: flowId },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n✅ Cambios guardados en BD');
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

configurarGPTCarritoExtraction();
