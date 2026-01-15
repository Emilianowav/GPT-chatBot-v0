import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function configurar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CONFIGURANDO WORKFLOWS SIGUIENTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Configuración de workflows siguientes para el menú principal
    const workflowsSiguientes = {
      pregunta: '👉 Por favor, selecciona un ítem de consulta:\n\n1️⃣ Libros escolares u otros títulos\n2️⃣ Libros de Inglés\n3️⃣ Soporte de ventas\n4️⃣ Información del local\n5️⃣ Promociones vigentes\n6️⃣ Consultas personalizadas\n\nEscribí el número',
      workflows: [
        { workflowId: 'consultar-libros', opcion: '1' },
        { workflowId: 'libros-ingles', opcion: '2' },
        { workflowId: 'soporte-ventas-menu', opcion: '3' },
        { workflowId: 'info-local', opcion: '4' },
        { workflowId: 'promociones', opcion: '5' },
        { workflowId: 'atencion-personalizada', opcion: '6' }
      ]
    };
    
    // Actualizar en api_configurations
    console.log('1️⃣ Actualizando workflow en api_configurations...');
    
    const apiUpdate = await db.collection('api_configurations').updateOne(
      { nombre: /veo veo/i },
      {
        $set: {
          'workflows.$[menu].workflowsSiguientes': workflowsSiguientes,
          'workflows.$[menu].steps.0.validacion': {
            tipo: 'opcion',
            opciones: ['1', '2', '3', '4', '5', '6'],
            mensajeError: 'Por favor, escribí un número del 1 al 6'
          }
        }
      },
      {
        arrayFilters: [
          { 'menu.nombre': 'Veo Veo - Menú Principal' }
        ]
      }
    );
    
    console.log(`   ✅ API Configuration actualizada (${apiUpdate.modifiedCount} documento)\n`);
    
    // Verificar configuración
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('VERIFICACIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const api = await db.collection('api_configurations').findOne({ nombre: /veo veo/i });
    const menuWorkflow = api.workflows.find(wf => wf.nombre === 'Veo Veo - Menú Principal');
    
    console.log('Menú Principal:');
    console.log(`   Workflows Siguientes: ${menuWorkflow.workflowsSiguientes ? '✅ CONFIGURADO' : '❌ NO'}`);
    
    if (menuWorkflow.workflowsSiguientes) {
      console.log('\n   Opciones configuradas:');
      menuWorkflow.workflowsSiguientes.workflows.forEach(wf => {
        console.log(`      ${wf.opcion} → ${wf.workflowId}`);
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 COMPORTAMIENTO ESPERADO:');
    console.log('   1. Usuario envía "Hola" → Muestra menú');
    console.log('   2. Usuario envía "1" → Activa workflow "Consultar Libros"');
    console.log('   3. Usuario envía "2" → Activa workflow "Libros de Inglés"');
    console.log('   4. etc...\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

configurar();
