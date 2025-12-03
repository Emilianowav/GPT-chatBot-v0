// 🔧 Script para completar configuración de San Jose

import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function completarConfigSanJose() {
  try {
    console.log('\n🔧 Completando configuración de San Jose...\n');

    await connectDB();

    const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
    
    if (!config) {
      console.error('❌ Configuración de San Jose no encontrada');
      process.exit(1);
    }

    // Completar confirmación de turnos
    if (!config.plantillasMeta) {
      config.plantillasMeta = {} as any;
    }

    (config.plantillasMeta as any).confirmacionTurnos = {
      activa: true,
      nombre: 'clientes_sanjose',
      idioma: 'es',
      metaApiUrl: 'https://graph.facebook.com/v22.0/{{phoneNumberId}}/messages',
      metaPayload: {
        messaging_product: 'whatsapp',
        to: '{{telefono}}',
        type: 'template',
        template: {
          name: 'clientes_sanjose',
          language: { code: 'es' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: '{{nombre_cliente}}' },
              { type: 'text', text: '{{fecha_hora}}' }
            ]
          }]
        }
      },
      variables: {
        phoneNumberId: { origen: 'empresa', campo: 'phoneNumberId' },
        telefono: { origen: 'cliente', campo: 'telefono' },
        nombre_cliente: { origen: 'calculado', formula: 'cliente.nombre + " " + cliente.apellido' },
        fecha_hora: { origen: 'calculado', formula: 'construirDetallesTurnos(turnos)' }
      },
      programacion: {
        metodoVerificacion: 'hora_fija',
        horaEnvio: '22:00',
        diasAntes: 1,
        filtroEstado: ['no_confirmado', 'pendiente']
      }
    };

    await config.save();

    console.log('✅ Configuración de San Jose completada');
    console.log('   - confirmacionTurnos: ACTIVA');
    console.log('   - Plantilla: clientes_sanjose');
    console.log('   - Hora: 22:00 (1 día antes)\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

completarConfigSanJose();
