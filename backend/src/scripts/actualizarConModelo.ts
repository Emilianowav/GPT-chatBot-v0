// 📋 Actualizar usando modelo de Mongoose
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Definir schema básico
const ConfigSchema = new mongoose.Schema({}, { strict: false });
const ConfigModel = mongoose.model('ConfiguracionModulo', ConfigSchema, 'configuracion_modulos');

async function actualizar() {
  try {
    console.log('🔌 Conectando...');
    
    // Conectar a la base de datos correcta
    const uri = process.env.MONGODB_URI || '';
    await mongoose.connect(uri, {
      dbName: 'neural_chatbot'
    });
    
    console.log('✅ Conectado a neural_chatbot');

    // Buscar el documento
    const config: any = await ConfigModel.findOne({ empresaId: 'San Jose' });
    
    if (!config) {
      console.log('❌ No se encontró configuración para San Jose');
      process.exit(1);
    }

    console.log('✅ Documento encontrado:', config._id);

    // ========================================
    // 1. ACTUALIZAR NOTIFICACIÓN DIARIA AGENTES
    // ========================================
    console.log('\n📋 Actualizando notificacionDiariaAgentes...');
    
    if (!config.notificacionDiariaAgentes) {
      console.log('❌ No existe notificacionDiariaAgentes');
      process.exit(1);
    }

    config.notificacionDiariaAgentes.usarPlantillaMeta = true;
    config.notificacionDiariaAgentes.plantillaMeta = {
      nombre: 'choferes_sanjose',
      idioma: 'es',
      activa: true,
      componentes: {
        body: {
          parametros: [
            { tipo: 'text', variable: 'agente' },
            { tipo: 'text', variable: 'lista_turnos' }
          ]
        }
      }
    };

    config.markModified('notificacionDiariaAgentes');
    console.log('✅ notificacionDiariaAgentes actualizada');

    // ========================================
    // 2. ACTUALIZAR NOTIFICACIÓN DE CONFIRMACIÓN (CLIENTES)
    // ========================================
    console.log('\n📋 Actualizando notificaciones[0] (confirmación clientes)...');
    
    if (!config.notificaciones || config.notificaciones.length === 0) {
      console.log('❌ No existen notificaciones');
      process.exit(1);
    }

    config.notificaciones[0].usarPlantillaMeta = true;
    config.notificaciones[0].plantillaMeta = {
      nombre: 'clientes_sanjose',  // ✅ CORREGIDO: clientes_sanjose
      idioma: 'es',
      activa: true,
      componentes: {
        body: {
          parametros: []  // Sin parámetros - texto fijo
        }
      }
    };

    config.markModified('notificaciones');
    console.log('✅ notificaciones[0] actualizada con clientes_sanjose');

    // Guardar
    console.log('\n💾 Guardando cambios...');
    await config.save();
    console.log('✅ Cambios guardados exitosamente!');

    // Verificar
    const verificar: any = await ConfigModel.findOne({ empresaId: 'San Jose' });
    
    console.log('\n📊 VERIFICACIÓN:');
    console.log('═══════════════════════════════════════');
    console.log('empresaId:', verificar.empresaId);
    console.log('\n1. Notificación Diaria Agentes:');
    console.log('   usarPlantillaMeta:', verificar.notificacionDiariaAgentes?.usarPlantillaMeta);
    console.log('   plantillaMeta.nombre:', verificar.notificacionDiariaAgentes?.plantillaMeta?.nombre);
    console.log('   plantillaMeta.parametros:', verificar.notificacionDiariaAgentes?.plantillaMeta?.componentes?.body?.parametros?.map((p: any) => p.variable).join(', '));
    
    console.log('\n2. Confirmación Clientes:');
    console.log('   usarPlantillaMeta:', verificar.notificaciones?.[0]?.usarPlantillaMeta);
    console.log('   plantillaMeta.nombre:', verificar.notificaciones?.[0]?.plantillaMeta?.nombre);
    console.log('   plantillaMeta.parametros:', verificar.notificaciones?.[0]?.plantillaMeta?.componentes?.body?.parametros?.length || 0);
    console.log('═══════════════════════════════════════');

    console.log('\n✅ TODO LISTO!');
    console.log('\n📝 IMPORTANTE:');
    console.log('   1. Reinicia el servidor backend: npm start');
    console.log('   2. Aprueba las plantillas en Meta Business Manager:');
    console.log('      - clientes_sanjose (para confirmación de clientes)');
    console.log('      - choferes_sanjose (para notificación diaria de agentes)');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
  }
}

actualizar();
