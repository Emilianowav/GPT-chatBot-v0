import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function buscarMensajeMercadoPago() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n🔍 Buscando nodos que usan {{mercadopago-crear-preference.mensaje}}...\n');
    
    const nodosConMensajeMp = flow.nodes.filter(nodo => {
      const config = nodo.data.config || {};
      const mensaje = config.message || config.mensaje || '';
      return mensaje.includes('{{mercadopago-crear-preference.mensaje}}');
    });
    
    if (nodosConMensajeMp.length === 0) {
      console.log('❌ No se encontraron nodos con ese mensaje');
    } else {
      console.log(`✅ Encontrados ${nodosConMensajeMp.length} nodo(s):\n`);
      
      nodosConMensajeMp.forEach((nodo, index) => {
        console.log(`${index + 1}. ${nodo.id}`);
        console.log(`   Label: ${nodo.data.label}`);
        console.log(`   Type: ${nodo.type}`);
        
        const config = nodo.data.config || {};
        const mensaje = config.message || config.mensaje || '';
        
        console.log(`   Mensaje completo: "${mensaje}"`);
        console.log('');
      });
    }
    
    // Buscar el nodo mercadopago-crear-preference
    console.log('\n🔍 Analizando nodo mercadopago-crear-preference...\n');
    
    const mpNode = flow.nodes.find(n => n.id === 'mercadopago-crear-preference');
    
    if (!mpNode) {
      console.log('❌ Nodo mercadopago-crear-preference no encontrado');
    } else {
      console.log(`✅ Nodo encontrado: ${mpNode.id}`);
      console.log(`   Label: ${mpNode.data.label}`);
      console.log(`   Type: ${mpNode.type}`);
      console.log(`   Config:`, JSON.stringify(mpNode.data.config, null, 2));
    }
    
    // Buscar edges que conectan a ese nodo
    console.log('\n🔍 Buscando conexiones desde mercadopago-crear-preference...\n');
    
    const edgesFromMp = flow.edges.filter(e => e.source === 'mercadopago-crear-preference');
    
    if (edgesFromMp.length === 0) {
      console.log('❌ No hay conexiones desde mercadopago-crear-preference');
    } else {
      console.log(`✅ Encontradas ${edgesFromMp.length} conexión(es):\n`);
      
      edgesFromMp.forEach((edge, index) => {
        console.log(`${index + 1}. ${edge.id}`);
        console.log(`   Desde: ${edge.source}`);
        console.log(`   Hacia: ${edge.target}`);
        console.log(`   Label: ${edge.label || 'Sin label'}`);
        
        if (edge.data?.condition) {
          console.log(`   Condición: ${edge.data.condition}`);
        }
        
        console.log('');
      });
    }
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

buscarMensajeMercadoPago();
