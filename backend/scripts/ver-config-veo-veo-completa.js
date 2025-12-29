import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verConfigCompleta() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener empresa
    const empresa = await db.collection('empresas').findOne({
      nombre: /veo veo/i
    });

    // Obtener API
    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    console.log('=' .repeat(70));
    console.log('📋 CONFIGURACIÓN COMPLETA DE VEO VEO');
    console.log('='.repeat(70));

    console.log('\n🏢 EMPRESA:');
    console.log('   ID:', empresa._id);
    console.log('   Nombre:', empresa.nombre);
    console.log('   Teléfono:', empresa.telefono);
    console.log('   PhoneNumberId:', empresa.phoneNumberId);
    console.log('   Email:', empresa.email);
    console.log('   Módulos:', empresa.modulos || []);

    console.log('\n🔌 API WOOCOMMERCE:');
    console.log('   ID:', api._id);
    console.log('   Nombre:', api.nombre);
    console.log('   Base URL:', api.baseUrl);
    console.log('   Autenticación:', api.autenticacion.tipo);
    console.log('   Activa:', api.activa);
    console.log('   Asociada a empresa:', api.empresaId);

    console.log('\n📡 ENDPOINTS (' + api.endpoints.length + '):');
    api.endpoints.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.id} - ${ep.method || 'GET'} ${ep.path}`);
    });

    const workflow = api.workflows[0];
    console.log('\n🔄 WORKFLOW:');
    console.log('   Nombre:', workflow.nombre);
    console.log('   Activo:', workflow.activo);
    console.log('   Trigger tipo:', workflow.trigger.tipo);
    console.log('   Keywords:', workflow.trigger.keywords.join(', '));

    console.log('\n💰 CONFIGURACIÓN DE PAGO:');
    console.log('   Seña:', workflow.configPago.seña);
    console.log('   Porcentaje:', workflow.configPago.porcentajeSeña * 100 + '%');
    console.log('   Tiempo expiración:', workflow.configPago.tiempoExpiracion, 'minutos');
    console.log('   Moneda:', workflow.configPago.moneda);

    console.log('\n📝 PASOS DEL WORKFLOW (' + workflow.steps.length + '):');
    workflow.steps.forEach((step, i) => {
      console.log(`\n   PASO ${step.orden}: ${step.nombre}`);
      console.log(`      Tipo: ${step.tipo}`);
      console.log(`      Variable: ${step.nombreVariable}`);
      if (step.endpointId) {
        console.log(`      Endpoint: ${step.endpointId}`);
      }
      if (step.validacion) {
        console.log(`      Validación: ${step.validacion.tipo}`);
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ CONFIGURACIÓN COMPLETA Y LISTA PARA USAR');
    console.log('='.repeat(70));

    console.log('\n🧪 PARA TESTEAR:');
    console.log('   1. Envía un mensaje de WhatsApp al número:', empresa.telefono);
    console.log('   2. Escribe cualquier keyword:', workflow.trigger.keywords.slice(0, 3).join(', '));
    console.log('   3. Sigue el flujo de 8 pasos');
    console.log('   4. Verifica que se genere el link de Mercado Pago');

    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verConfigCompleta();
