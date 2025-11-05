// 📋 Forzar configuración de notificación diaria de agentes con plantilla
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function forzarConfiguracion() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado');

    const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
    
    if (!config) {
      console.log('❌ No se encontró configuración');
      process.exit(1);
    }

    console.log('\n📋 Configurando notificación diaria de agentes con plantilla Meta...');

    // Crear configuración completa
    (config as any).notificacionDiariaAgentes = {
      activa: true,
      horaEnvio: '06:00',
      enviarATodos: false,
      plantillaMensaje: 'Buenos días {agente}! Estos son tus {turnos} de hoy:',
      
      frecuencia: {
        tipo: 'diaria',
        diasSemana: [1, 2, 3, 4, 5] // Lunes a Viernes
      },
      
      rangoHorario: {
        activo: true,
        tipo: 'hoy'
      },
      
      filtroHorario: {
        activo: false,
        tipo: 'todo_el_dia'
      },
      
      filtroEstado: {
        activo: true,
        estados: ['pendiente', 'confirmado']
      },
      
      filtroTipo: {
        activo: false,
        tipos: []
      },
      
      incluirDetalles: {
        origen: true,
        destino: true,
        nombreCliente: true,
        telefonoCliente: true,
        horaReserva: true,
        notasInternas: false
      },
      
      // ✅ PLANTILLA DE META
      usarPlantillaMeta: true,
      plantillaMeta: {
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
      }
    };

    await config.save();
    
    console.log('✅ Configuración guardada exitosamente!');
    console.log('\n📊 RESUMEN:');
    console.log('═══════════════════════════════════════');
    console.log('Empresa: San Jose');
    console.log('Activa: ✅');
    console.log('Hora envío: 06:00');
    console.log('Plantilla Meta: choferes_sanjose');
    console.log('Parámetros: agente, lista_turnos');
    console.log('═══════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado');
  }
}

forzarConfiguracion();
