const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function debugEmpresaFlujo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const Empresa = mongoose.model('Empresa', new mongoose.Schema({}, { strict: false }));
    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));

    // Buscar empresa Veo Veo
    const empresa = await Empresa.findOne({ nombre: 'Veo Veo' });
    
    if (!empresa) {
      console.log('❌ Empresa Veo Veo no encontrada');
      process.exit(1);
    }

    console.log('🏢 EMPRESA VEO VEO:');
    console.log('   _id:', empresa._id);
    console.log('   nombre:', empresa.nombre);
    console.log('   telefono:', empresa.telefono);
    console.log('   flujoActivo:', empresa.flujoActivo || 'NO CONFIGURADO');
    console.log('   flujoActivo type:', typeof empresa.flujoActivo);
    console.log('   flujoActivo exists:', !!empresa.flujoActivo);
    console.log('\n📋 DOCUMENTO COMPLETO:');
    console.log(JSON.stringify(empresa, null, 2));

    // Buscar todos los flujos
    const flujos = await Flow.find({});
    console.log('\n\n📊 FLUJOS DISPONIBLES:');
    flujos.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.nombre}`);
      console.log(`   ID: ${f._id}`);
      console.log(`   empresaId: ${f.empresaId || 'NO CONFIGURADO'}`);
      console.log(`   activo: ${f.activo || false}`);
      console.log(`   botType: ${f.botType || 'NO CONFIGURADO'}`);
      console.log(`   Nodos: ${f.nodes?.length || 0}`);
    });

    // Verificar el flujo de 9 nodos
    const flujoWoo = await Flow.findById('695a156681f6d67f0ae9cf40');
    if (flujoWoo) {
      console.log('\n\n🎯 FLUJO DE 9 NODOS:');
      console.log('   ID:', flujoWoo._id);
      console.log('   Nombre:', flujoWoo.nombre);
      console.log('   empresaId:', flujoWoo.empresaId);
      console.log('   Nodos:', flujoWoo.nodes.length);
      console.log('   Edges:', flujoWoo.edges.length);
    }

    // Verificar si empresa.flujoActivo apunta al flujo correcto
    if (empresa.flujoActivo) {
      const flujoActivo = await Flow.findById(empresa.flujoActivo);
      if (flujoActivo) {
        console.log('\n\n✅ FLUJO ACTIVO ENCONTRADO:');
        console.log('   Nombre:', flujoActivo.nombre);
        console.log('   Nodos:', flujoActivo.nodes.length);
      } else {
        console.log('\n\n❌ FLUJO ACTIVO NO ENCONTRADO EN BD');
        console.log('   ID buscado:', empresa.flujoActivo);
      }
    } else {
      console.log('\n\n⚠️  EMPRESA NO TIENE flujoActivo CONFIGURADO');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   Ejecutar: node scripts/activar-flujo-woocommerce.cjs');
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugEmpresaFlujo();
