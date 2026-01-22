import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function conectarVerificarPagoCorrecto() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    console.log('\n🔧 Conectando mercadopago-verificar-pago a gpt-carrito...\n');
    
    // Verificar si ya existe edge
    const edgeExistente = wooFlow.edges.find(e => 
      e.source === 'mercadopago-verificar-pago' && e.target === 'gpt-carrito'
    );
    
    if (edgeExistente) {
      console.log('   ℹ️  Edge ya existe, verificando configuración...');
      console.log(`   ID: ${edgeExistente.id}`);
      console.log(`   Label: ${edgeExistente.data?.label || 'sin label'}`);
    } else {
      // Crear edge usando estándar del proyecto
      const nuevoEdge = {
        id: 'mercadopago-verificar-pago-to-gpt-carrito',
        source: 'mercadopago-verificar-pago',
        target: 'gpt-carrito',
        sourceHandle: 'b',
        targetHandle: 'a',
        type: 'smoothstep',
        animated: false,
        data: {
          label: '✅ Pago Aprobado'
        }
      };
      
      wooFlow.edges.push(nuevoEdge);
      console.log('✅ Edge creado: mercadopago-verificar-pago → gpt-carrito');
      console.log(`   Label: ${nuevoEdge.data.label}`);
    }
    
    console.log('\n💾 Guardando cambios...');
    
    await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          edges: wooFlow.edges,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ CONEXIÓN ESTABLECIDA CORRECTAMENTE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 FLUJO DE CONFIRMACIÓN DE PAGO:');
    console.log('');
    console.log('   mercadopago-verificar-pago');
    console.log('     ↓ Verifica pago en MercadoPago');
    console.log('     ↓ Genera: confirmacion_pago = true');
    console.log('   gpt-carrito');
    console.log('     ↓ Genera: accion_siguiente = "confirmar_pago"');
    console.log('     ↓ Genera: respuesta_gpt con mensaje');
    console.log('   router-carrito');
    console.log('     ↓ Valida: accion_siguiente === "confirmar_pago"');
    console.log('   whatsapp-confirmacion-agregado');
    console.log('     ↓ Envía confirmación al usuario');
    console.log('');
    
    // Mostrar todas las entradas a gpt-carrito
    const entradasGPTCarrito = wooFlow.edges.filter(e => e.target === 'gpt-carrito');
    console.log('📊 ENTRADAS A gpt-carrito:');
    entradasGPTCarrito.forEach(e => {
      console.log(`   ✅ ${e.source} → gpt-carrito`);
      console.log(`      Label: ${e.data?.label || 'sin label'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

conectarVerificarPagoCorrecto();
