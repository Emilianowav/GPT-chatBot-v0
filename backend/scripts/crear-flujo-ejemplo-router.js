import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function crearFlujoEjemploRouter() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Definir nodos del flujo
    const nodes = [
      // 1. WhatsApp Trigger (inicio)
      {
        id: 'whatsapp-trigger',
        type: 'whatsapp',
        position: { x: 100, y: 300 },
        data: {
          label: 'Watch Events',
          executionCount: 1,
          hasConnection: true,
          config: {
            tipo: 'trigger',
          },
        },
      },
      // 2. Router
      {
        id: 'router-1',
        type: 'router',
        position: { x: 400, y: 300 },
        data: {
          label: 'Router',
          executionCount: 2,
          routes: 2,
          config: {
            conditions: [
              { label: 'Opción A', condition: '{{message}} contains "A"' },
              { label: 'Opción B', condition: '{{message}} contains "B"' },
            ],
          },
        },
      },
      // 3. Camino A - GPT
      {
        id: 'gpt-opcion-a',
        type: 'gpt',
        position: { x: 700, y: 200 },
        data: {
          label: 'GPT - Opción A',
          executionCount: 3,
          hasConnection: true,
          config: {
            tipo: 'conversacional',
            modelo: 'gpt-4',
            temperatura: 0.7,
            prompt_sistema: 'Responde sobre la opción A',
          },
        },
      },
      // 4. Camino B - WooCommerce
      {
        id: 'woo-opcion-b',
        type: 'woocommerce',
        position: { x: 700, y: 400 },
        data: {
          label: 'WooCommerce - Opción B',
          executionCount: 4,
          hasConnection: true,
          config: {
            apiConfigId: 'woo-api-1',
            endpointId: 'get-products',
          },
        },
      },
      // 5. Respuesta A - WhatsApp
      {
        id: 'whatsapp-respuesta-a',
        type: 'whatsapp',
        position: { x: 1000, y: 200 },
        data: {
          label: 'Send Message A',
          executionCount: 5,
          hasConnection: false,
          config: {
            tipo: 'send_message',
            pregunta: 'Respuesta para opción A: {{gpt_response}}',
          },
        },
      },
      // 6. Respuesta B - WhatsApp
      {
        id: 'whatsapp-respuesta-b',
        type: 'whatsapp',
        position: { x: 1000, y: 400 },
        data: {
          label: 'Send Message B',
          executionCount: 6,
          hasConnection: false,
          config: {
            tipo: 'send_message',
            pregunta: 'Productos encontrados: {{products}}',
          },
        },
      },
    ];

    // Definir edges (conexiones)
    const edges = [
      // WhatsApp → Router
      {
        id: 'whatsapp-trigger-router-1',
        source: 'whatsapp-trigger',
        target: 'router-1',
        type: 'simple',
      },
      // Router → GPT (Camino A)
      {
        id: 'router-1-gpt-opcion-a',
        source: 'router-1',
        sourceHandle: 'source-0',
        target: 'gpt-opcion-a',
        type: 'simple',
        data: {
          routeIndex: 0,
          label: 'Opción A',
        },
      },
      // Router → WooCommerce (Camino B)
      {
        id: 'router-1-woo-opcion-b',
        source: 'router-1',
        sourceHandle: 'source-1',
        target: 'woo-opcion-b',
        type: 'simple',
        data: {
          routeIndex: 1,
          label: 'Opción B',
        },
      },
      // GPT → WhatsApp Respuesta A
      {
        id: 'gpt-opcion-a-whatsapp-respuesta-a',
        source: 'gpt-opcion-a',
        target: 'whatsapp-respuesta-a',
        type: 'simple',
      },
      // WooCommerce → WhatsApp Respuesta B
      {
        id: 'woo-opcion-b-whatsapp-respuesta-b',
        source: 'woo-opcion-b',
        target: 'whatsapp-respuesta-b',
        type: 'simple',
      },
    ];

    // Crear o actualizar flow
    const flowData = {
      nombre: 'Ejemplo Router - Flujo con Bifurcación',
      empresaId: new mongoose.Types.ObjectId('6940a9a181b92bfce970fdb5'), // Veo Veo
      activo: true,
      nodes,
      edges,
      descripcion: 'Flujo de ejemplo que demuestra el uso de Router para bifurcar el flujo en 2 caminos según condiciones',
    };

    const result = await db.collection('flows').insertOne(flowData);

    console.log('✅ Flujo de ejemplo creado exitosamente');
    console.log('📊 ID del flujo:', result.insertedId);
    console.log('📝 Nombre:', flowData.nombre);
    console.log('🔢 Total nodos:', nodes.length);
    console.log('🔗 Total conexiones:', edges.length);
    console.log('\n📋 ESTRUCTURA DEL FLUJO:');
    console.log('1. WhatsApp Watch Events (trigger)');
    console.log('2. Router (2 caminos)');
    console.log('   ├─ Camino A: GPT → WhatsApp Response');
    console.log('   └─ Camino B: WooCommerce → WhatsApp Response');
    console.log('\n💡 Para cargar este flujo en el frontend:');
    console.log(`   Cambiar flowId en page.tsx a: '${result.insertedId}'`);

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

crearFlujoEjemploRouter();
