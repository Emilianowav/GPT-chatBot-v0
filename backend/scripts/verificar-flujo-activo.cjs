const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function verificarFlujoActivo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));
    const Empresa = mongoose.model('Empresa', new mongoose.Schema({}, { strict: false }));

    // Buscar empresa Veo Veo
    const empresa = await Empresa.findOne({ nombre: 'Veo Veo' });
    
    if (!empresa) {
      console.log('❌ Empresa Veo Veo no encontrada');
      process.exit(1);
    }

    console.log('🏢 EMPRESA VEO VEO:');
    console.log(`   ID: ${empresa._id}`);
    console.log(`   Nombre: ${empresa.nombre}`);
    console.log(`   Flujo Activo: ${empresa.flujoActivo || 'NO CONFIGURADO'}\n`);

    // Buscar todos los flujos
    const flujos = await Flow.find({});
    
    console.log('📊 FLUJOS DISPONIBLES:\n');
    flujos.forEach((f, i) => {
      const esActivo = empresa.flujoActivo && empresa.flujoActivo.toString() === f._id.toString();
      console.log(`${i + 1}. ${esActivo ? '🟢 ACTIVO' : '⚪'} ${f.nombre}`);
      console.log(`   ID: ${f._id}`);
      console.log(`   Nodos: ${f.nodes.length}`);
      console.log(`   Edges: ${f.edges.length}`);
      
      // Verificar si tiene WooCommerce
      const tieneWoo = f.nodes.some(n => n.type === 'woocommerce');
      console.log(`   WooCommerce: ${tieneWoo ? '✅ SÍ' : '❌ NO'}`);
      
      // Verificar si tiene GPT Conversacional
      const tieneConversacional = f.nodes.some(n => 
        n.type === 'gpt' && 
        n.data?.config?.tipo === 'conversacional'
      );
      console.log(`   GPT Conversacional: ${tieneConversacional ? '✅ SÍ' : '❌ NO'}`);
      
      // Verificar si tiene GPT Formateador
      const tieneFormateador = f.nodes.some(n => 
        n.type === 'gpt' && 
        n.data?.config?.tipo === 'formateador'
      );
      console.log(`   GPT Formateador: ${tieneFormateador ? '✅ SÍ' : '❌ NO'}`);
      
      // Verificar si tiene Validador
      const tieneValidador = f.nodes.some(n => n.id === 'validador-datos');
      console.log(`   Validador de Datos: ${tieneValidador ? '✅ SÍ' : '❌ NO'}\n`);
    });

    // Identificar el flujo correcto (9 nodos con WooCommerce)
    const flujoCompleto = flujos.find(f => 
      f.nodes.length === 9 && 
      f.nodes.some(n => n.type === 'woocommerce') &&
      f.nodes.some(n => n.id === 'validador-datos')
    );

    if (flujoCompleto) {
      console.log('🎯 FLUJO COMPLETO IDENTIFICADO:');
      console.log(`   ID: ${flujoCompleto._id}`);
      console.log(`   Nombre: ${flujoCompleto.nombre}`);
      console.log(`   Nodos: ${flujoCompleto.nodes.length}`);
      
      const esActivo = empresa.flujoActivo && empresa.flujoActivo.toString() === flujoCompleto._id.toString();
      
      if (esActivo) {
        console.log('\n✅ Este flujo YA ESTÁ ACTIVO');
      } else {
        console.log('\n⚠️  Este flujo NO ESTÁ ACTIVO');
        console.log(`   Flujo activo actual: ${empresa.flujoActivo}`);
        console.log(`\n💡 SOLUCIÓN: Actualizar empresa.flujoActivo a ${flujoCompleto._id}`);
      }
    } else {
      console.log('❌ No se encontró el flujo completo de 9 nodos');
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarFlujoActivo();
