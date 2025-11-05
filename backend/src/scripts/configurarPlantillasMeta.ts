// 📋 Script para configurar plantillas de Meta en las notificaciones
// Empresa: San Jose
// Plantillas:
//   - recordatorios_sanjose (confirmación de turnos para clientes)
//   - choferes_sanjose (notificación diaria para agentes/choferes)

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

const EMPRESA_ID = 'San Jose';

async function configurarPlantillasMeta() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB');

    // Buscar configuración de la empresa
    const config = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_ID });

    if (!config) {
      console.error('❌ No se encontró configuración para empresa:', EMPRESA_ID);
      process.exit(1);
    }

    console.log('📋 Configurando plantillas de Meta para:', EMPRESA_ID);

    // ========================================
    // 1. PLANTILLA PARA CONFIRMACIÓN DE TURNOS (CLIENTES)
    // ========================================
    console.log('\n📋 Configurando plantilla: recordatorios_sanjose');
    
    // Buscar la notificación de confirmación
    const notifConfirmacion = config.notificaciones.find(n => n.tipo === 'confirmacion');
    
    if (notifConfirmacion) {
      notifConfirmacion.usarPlantillaMeta = true;
      notifConfirmacion.plantillaMeta = {
        nombre: 'recordatorios_sanjose',
        idioma: 'es',
        activa: true,
        componentes: {
          // NOTA: Esta plantilla solo envía el mensaje inicial
          // El usuario responde con una opción (1 o 2)
          // Nuestra infraestructura (flowManager) maneja el resto del flujo
          
          // Sin body parameters - la plantilla de Meta ya tiene el texto fijo
          // Solo se usa para iniciar la conversación
          body: {
            parametros: []
          }
        }
      };
      
      console.log('✅ Plantilla configurada para confirmación de turnos');
      console.log('   Nombre:', notifConfirmacion.plantillaMeta.nombre);
      console.log('   Uso: Mensaje inicial para abrir ventana de 24hs');
      console.log('   Flujo: Usuario responde → nuestra infraestructura maneja el resto');
    } else {
      console.log('⚠️ No se encontró notificación de confirmación');
    }

    // ========================================
    // 2. PLANTILLA PARA NOTIFICACIÓN DIARIA DE AGENTES
    // ========================================
    console.log('\n📋 Configurando plantilla: choferes_sanjose');
    
    if (config.notificacionDiariaAgentes) {
      config.notificacionDiariaAgentes.usarPlantillaMeta = true;
      config.notificacionDiariaAgentes.plantillaMeta = {
        nombre: 'choferes_sanjose',
        idioma: 'es',
        activa: true,
        componentes: {
          // Body con variables dinámicas
          body: {
            parametros: [
              { tipo: 'text', variable: 'agente' },       // 1er parámetro: Nombre del agente/chofer
              { tipo: 'text', variable: 'lista_turnos' }  // 2do parámetro: Lista de turnos formateada
            ]
          }
        }
      };
      
      console.log('✅ Plantilla configurada para notificación diaria de agentes');
      console.log('   Nombre:', config.notificacionDiariaAgentes.plantillaMeta.nombre);
      console.log('   Variables body:', config.notificacionDiariaAgentes.plantillaMeta.componentes?.body?.parametros.map(p => p.variable).join(', '));
    } else {
      console.log('⚠️ No se encontró configuración de notificación diaria de agentes');
    }

    // Guardar cambios
    console.log('\n💾 Guardando configuración...');
    await config.save();
    console.log('✅ Configuración guardada exitosamente');

    // Mostrar resumen
    console.log('\n📊 RESUMEN DE CONFIGURACIÓN');
    console.log('═══════════════════════════════════════');
    console.log(`Empresa: ${EMPRESA_ID}`);
    console.log('\n1. Confirmación de Turnos (Clientes):');
    console.log(`   Plantilla: ${notifConfirmacion?.plantillaMeta?.nombre || 'No configurada'}`);
    console.log(`   Activa: ${notifConfirmacion?.usarPlantillaMeta ? '✅' : '❌'}`);
    
    console.log('\n2. Notificación Diaria (Agentes):');
    console.log(`   Plantilla: ${config.notificacionDiariaAgentes?.plantillaMeta?.nombre || 'No configurada'}`);
    console.log(`   Activa: ${config.notificacionDiariaAgentes?.usarPlantillaMeta ? '✅' : '❌'}`);
    console.log('═══════════════════════════════════════');

    console.log('\n✅ Script completado exitosamente');
    console.log('\n💡 IMPORTANTE:');
    console.log('   - Asegúrate de que las plantillas estén aprobadas en Meta Business Manager');
    console.log('   - Verifica que las variables coincidan con tu plantilla en Meta');
    console.log('   - Ajusta los componentes según la estructura de tu plantilla');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

// Ejecutar
configurarPlantillasMeta();
