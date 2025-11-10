// Script para migrar configuración de San Jose a nuevo formato con parámetros

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ConfiguracionModuloSchema = new mongoose.Schema({}, { strict: false });
// Probar diferentes nombres de colección
const ConfiguracionModulo = mongoose.model('ConfiguracionModulo', ConfiguracionModuloSchema);

async function migrar() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado\n');

    // Buscar configuración de San Jose (probar ambas variantes)
    let config = await ConfiguracionModulo.findOne({ empresaId: 'San Jose' });
    
    if (!config) {
      console.log('   Intentando con "San%20Jose"...');
      config = await ConfiguracionModulo.findOne({ empresaId: 'San%20Jose' });
    }
    
    if (!config) {
      console.log('   Buscando todas las empresas...');
      const todas = await ConfiguracionModulo.find({}, 'empresaId');
      console.log('   Empresas encontradas:', todas.map(c => c.empresaId));
      config = todas.find(c => c.empresaId.includes('San') || c.empresaId.includes('Jose'));
    }
    
    if (!config) {
      console.log('❌ No se encontró configuración para San Jose');
      process.exit(1);
    }

    console.log('📋 Configuración actual encontrada');
    console.log('   Empresa:', config.empresaId);
    
    // Actualizar plantillas
    const actualizacion = {
      'plantillasMeta.confirmacionTurnos.tipo': 'plantilla_meta',
      'plantillasMeta.confirmacionTurnos.parametros': [
        {
          orden: 1,
          variable: 'nombre',
          valor: '{{nombre}}'
        },
        {
          orden: 2,
          variable: 'turnos',
          valor: '{{turnos}}'
        }
      ],
      'plantillasMeta.notificacionDiariaAgentes.tipo': 'plantilla_meta',
      'plantillasMeta.notificacionDiariaAgentes.parametros': [
        {
          orden: 1,
          variable: 'nombre',
          valor: '{{nombre}}'
        },
        {
          orden: 2,
          variable: 'lista_turnos',
          valor: '{{lista_turnos}}'
        }
      ]
    };

    console.log('\n🔧 Aplicando actualización...');
    console.log('   ✅ Confirmación Turnos: 2 parámetros (nombre, turnos)');
    console.log('   ✅ Notificación Agentes: 2 parámetros (nombre, lista_turnos)');

    await ConfiguracionModulo.updateOne(
      { empresaId: 'San Jose' },
      { $set: actualizacion }
    );

    console.log('\n✅ Migración completada exitosamente');
    console.log('\n📝 Configuración actualizada:');
    console.log('   - Tipo: plantilla_meta');
    console.log('   - Parámetros ordenados correctamente');
    console.log('   - Variables mapeadas: {{nombre}}, {{turnos}}, {{lista_turnos}}');

    // Verificar
    const configActualizada = await ConfiguracionModulo.findOne({ empresaId: 'San Jose' });
    console.log('\n🔍 Verificación:');
    console.log('   Confirmación Turnos:');
    console.log('     - Tipo:', configActualizada.plantillasMeta?.confirmacionTurnos?.tipo);
    console.log('     - Parámetros:', configActualizada.plantillasMeta?.confirmacionTurnos?.parametros?.length || 0);
    console.log('   Notificación Agentes:');
    console.log('     - Tipo:', configActualizada.plantillasMeta?.notificacionDiariaAgentes?.tipo);
    console.log('     - Parámetros:', configActualizada.plantillasMeta?.notificacionDiariaAgentes?.parametros?.length || 0);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

migrar();
