// 📋 Script para verificar y configurar plantilla de agentes
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

const EMPRESA_ID = 'San Jose';

async function verificarYConfigurar() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB');

    const config = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_ID });

    if (!config) {
      console.error('❌ No se encontró configuración para empresa:', EMPRESA_ID);
      process.exit(1);
    }

    console.log('\n📊 ESTADO ACTUAL:');
    console.log('═══════════════════════════════════════');
    console.log('Empresa:', EMPRESA_ID);
    console.log('\n¿Tiene notificacionDiariaAgentes?', !!config.notificacionDiariaAgentes);
    
    if (config.notificacionDiariaAgentes) {
      console.log('Activa:', config.notificacionDiariaAgentes.activa);
      console.log('Hora envío:', config.notificacionDiariaAgentes.horaEnvio);
      console.log('Usa plantilla Meta:', config.notificacionDiariaAgentes.usarPlantillaMeta || false);
      
      if (config.notificacionDiariaAgentes.plantillaMeta) {
        console.log('\nPlantilla configurada:');
        console.log('  Nombre:', config.notificacionDiariaAgentes.plantillaMeta.nombre);
        console.log('  Idioma:', config.notificacionDiariaAgentes.plantillaMeta.idioma);
        console.log('  Activa:', config.notificacionDiariaAgentes.plantillaMeta.activa);
      } else {
        console.log('\n⚠️ NO tiene plantilla configurada');
        console.log('\n📋 Configurando plantilla choferes_sanjose...');
        
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
        
        await config.save();
        console.log('✅ Plantilla configurada exitosamente!');
      }
    } else {
      console.log('\n❌ La empresa no tiene configurada la notificación diaria de agentes');
      console.log('   Ejecuta primero: npm run config:notif-diaria-agentes');
    }

    console.log('\n═══════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

verificarYConfigurar();
