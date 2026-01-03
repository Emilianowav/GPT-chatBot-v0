import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificarEstadoCompleto() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Verificar empresa Veo Veo
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. EMPRESA VEO VEO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const empresa = await db.collection('empresas').findOne({
      nombre: 'Veo Veo'
    });

    if (empresa) {
      console.log(`📋 Empresa: ${empresa.nombre}`);
      console.log(`   ID: ${empresa._id}`);
      console.log(`   Activa: ${empresa.activo !== false ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Teléfono: ${empresa.telefono || 'NO'}`);
      console.log(`   Mensaje Bienvenida: ${empresa.mensajeBienvenida ? 'SÍ' : 'NO'}`);
      if (empresa.mensajeBienvenida) {
        console.log(`\n   📝 Mensaje:\n   ${empresa.mensajeBienvenida.substring(0, 200)}${empresa.mensajeBienvenida.length > 200 ? '...' : ''}`);
      }
    } else {
      console.log('❌ No se encontró empresa Veo Veo');
    }

    // 2. Verificar API Configuration
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. API CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (api) {
      console.log(`📋 API: ${api.nombre}`);
      console.log(`   ID: ${api._id}`);
      console.log(`   Activa: ${api.activo !== false ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Workflows: ${api.workflows?.length || 0}\n`);

      // Verificar workflow de consultar libros
      const workflow = api.workflows?.find(w => w.nombre?.includes('Consultar Libros'));
      if (workflow) {
        console.log(`   🔧 Workflow: ${workflow.nombre}`);
        console.log(`      Activo: ${workflow.activo !== false ? '✅ SÍ' : '❌ NO'}`);
        console.log(`      Pasos: ${workflow.steps?.length || 0}`);
        console.log(`      Trigger: ${workflow.trigger || 'NO'}`);
      }

      // Verificar menú principal
      const menuPrincipal = api.workflows?.find(w => w.nombre?.includes('Menú Principal'));
      if (menuPrincipal) {
        console.log(`\n   🔧 Workflow: ${menuPrincipal.nombre}`);
        console.log(`      Activo: ${menuPrincipal.activo !== false ? '✅ SÍ' : '❌ NO'}`);
        console.log(`      Pasos: ${menuPrincipal.steps?.length || 0}`);
        console.log(`      Trigger: ${menuPrincipal.trigger || 'NO'}`);
      }
    } else {
      console.log('❌ No se encontró API de Veo Veo');
    }

    // 3. Verificar contacto de prueba
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. ESTADO DE CONTACTO (tu número)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const contacto = await db.collection('contactos').findOne({
      telefono: '5493794057297'
    });

    if (contacto) {
      console.log(`📱 Contacto: ${contacto.nombre || 'Sin nombre'}`);
      console.log(`   Teléfono: ${contacto.telefono}`);
      console.log(`   Empresa: ${contacto.empresaId}`);
      console.log(`   Workflow State: ${contacto.workflowState ? 'SÍ' : 'NO'}`);
      
      if (contacto.workflowState) {
        console.log(`\n   🔧 Workflow State:`);
        console.log(`      Workflow ID: ${contacto.workflowState.workflowId || 'NO'}`);
        console.log(`      Paso Actual: ${contacto.workflowState.currentStep || 'NO'}`);
        console.log(`      Activo: ${contacto.workflowState.active ? '✅' : '❌'}`);
        console.log(`      Datos Recopilados:`, Object.keys(contacto.workflowState.datosRecopilados || {}).length);
      }
    } else {
      console.log('❌ No se encontró contacto con ese número');
    }

    // 4. Verificar último mensaje
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4. ÚLTIMO MENSAJE ENVIADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const ultimoMensaje = await db.collection('historial_conversaciones')
      .findOne(
        { telefono: '5493794057297' },
        { sort: { timestamp: -1 } }
      );

    if (ultimoMensaje) {
      console.log(`📝 Mensaje: ${ultimoMensaje.mensaje?.substring(0, 150)}${ultimoMensaje.mensaje?.length > 150 ? '...' : ''}`);
      console.log(`   Tipo: ${ultimoMensaje.tipo}`);
      console.log(`   Timestamp: ${ultimoMensaje.timestamp}`);
    } else {
      console.log('❌ No hay mensajes en el historial');
    }

    await mongoose.disconnect();
    console.log('\n\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarEstadoCompleto();
