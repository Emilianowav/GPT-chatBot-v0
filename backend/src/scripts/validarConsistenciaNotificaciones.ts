// Script para validar consistencia de notificaciones
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

interface ValidationError {
  empresa: string;
  notifIndex: number;
  campo: string;
  problema: string;
  valorActual: any;
  valorEsperado?: any;
}

async function validarConsistencia() {
  const errores: ValidationError[] = [];
  const advertencias: ValidationError[] = [];

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    const configuraciones = await ConfiguracionModuloModel.find({});
    console.log(`📋 Validando ${configuraciones.length} configuración(es)...\n`);

    for (const config of configuraciones) {
      console.log(`🏢 Empresa: ${config.empresaId}`);
      
      if (!config.notificaciones || config.notificaciones.length === 0) {
        console.log('   ℹ️  Sin notificaciones configuradas\n');
        continue;
      }

      config.notificaciones.forEach((notif, index) => {
        console.log(`   📧 Notificación ${index + 1}: ${notif.tipo} - ${notif.momento}`);

        // VALIDACIÓN 1: Campos según momento
        if (notif.momento === 'dia_antes_turno') {
          // Debe tener diasAntes y horaEnvioDiaAntes
          if (!notif.diasAntes) {
            errores.push({
              empresa: config.empresaId,
              notifIndex: index,
              campo: 'diasAntes',
              problema: 'Campo requerido faltante',
              valorActual: undefined,
              valorEsperado: 1
            });
            console.log('      ❌ Falta campo: diasAntes');
          } else if (notif.diasAntes > 30) {
            advertencias.push({
              empresa: config.empresaId,
              notifIndex: index,
              campo: 'diasAntes',
              problema: 'Valor muy alto (>30 días)',
              valorActual: notif.diasAntes
            });
            console.log(`      ⚠️  diasAntes muy alto: ${notif.diasAntes}`);
          } else {
            console.log(`      ✅ diasAntes: ${notif.diasAntes}`);
          }

          if (!(notif as any).horaEnvioDiaAntes) {
            errores.push({
              empresa: config.empresaId,
              notifIndex: index,
              campo: 'horaEnvioDiaAntes',
              problema: 'Campo requerido faltante',
              valorActual: undefined,
              valorEsperado: '22:00'
            });
            console.log('      ❌ Falta campo: horaEnvioDiaAntes');
          } else {
            const horaRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
            if (!horaRegex.test((notif as any).horaEnvioDiaAntes)) {
              errores.push({
                empresa: config.empresaId,
                notifIndex: index,
                campo: 'horaEnvioDiaAntes',
                problema: 'Formato incorrecto (debe ser HH:MM)',
                valorActual: (notif as any).horaEnvioDiaAntes,
                valorEsperado: '22:00'
              });
              console.log(`      ❌ Formato incorrecto: ${(notif as any).horaEnvioDiaAntes}`);
            } else {
              console.log(`      ✅ horaEnvioDiaAntes: ${(notif as any).horaEnvioDiaAntes}`);
            }
          }

          // No debe tener horasAntesTurno
          if ((notif as any).horasAntesTurno !== undefined) {
            errores.push({
              empresa: config.empresaId,
              notifIndex: index,
              campo: 'horasAntesTurno',
              problema: 'Campo incorrecto para dia_antes_turno',
              valorActual: (notif as any).horasAntesTurno
            });
            console.log(`      ❌ Campo incorrecto: horasAntesTurno = ${(notif as any).horasAntesTurno}`);
          }

        } else if (notif.momento === 'horas_antes_turno') {
          // Debe tener horasAntesTurno
          if (!(notif as any).horasAntesTurno) {
            errores.push({
              empresa: config.empresaId,
              notifIndex: index,
              campo: 'horasAntesTurno',
              problema: 'Campo requerido faltante',
              valorActual: undefined,
              valorEsperado: 24
            });
            console.log('      ❌ Falta campo: horasAntesTurno');
          } else if ((notif as any).horasAntesTurno > 168) {
            advertencias.push({
              empresa: config.empresaId,
              notifIndex: index,
              campo: 'horasAntesTurno',
              problema: 'Valor muy alto (>168h = 7 días)',
              valorActual: (notif as any).horasAntesTurno
            });
            console.log(`      ⚠️  horasAntesTurno muy alto: ${(notif as any).horasAntesTurno}`);
          } else {
            console.log(`      ✅ horasAntesTurno: ${(notif as any).horasAntesTurno}`);
          }

          // No debe tener diasAntes
          if (notif.diasAntes !== undefined) {
            errores.push({
              empresa: config.empresaId,
              notifIndex: index,
              campo: 'diasAntes',
              problema: 'Campo incorrecto para horas_antes_turno',
              valorActual: notif.diasAntes
            });
            console.log(`      ❌ Campo incorrecto: diasAntes = ${notif.diasAntes}`);
          }

        } else if (notif.momento === 'noche_anterior' || notif.momento === 'mismo_dia') {
          // Debe tener horaEnvio
          if (!notif.horaEnvio) {
            errores.push({
              empresa: config.empresaId,
              notifIndex: index,
              campo: 'horaEnvio',
              problema: 'Campo requerido faltante',
              valorActual: undefined,
              valorEsperado: '22:00'
            });
            console.log('      ❌ Falta campo: horaEnvio');
          } else {
            console.log(`      ✅ horaEnvio: ${notif.horaEnvio}`);
          }
        }

        // VALIDACIÓN 2: Campos obsoletos
        if (notif.momento === 'dia_antes_turno' && notif.horaEnvio) {
          advertencias.push({
            empresa: config.empresaId,
            notifIndex: index,
            campo: 'horaEnvio',
            problema: 'Campo obsoleto (usar horaEnvioDiaAntes)',
            valorActual: notif.horaEnvio
          });
          console.log(`      ⚠️  Campo obsoleto: horaEnvio = ${notif.horaEnvio}`);
        }

        console.log('');
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // RESUMEN
    console.log('\n📊 RESUMEN DE VALIDACIÓN\n');
    
    if (errores.length === 0 && advertencias.length === 0) {
      console.log('✅ ¡TODO CORRECTO! No se encontraron problemas.\n');
    } else {
      if (errores.length > 0) {
        console.log(`❌ ERRORES CRÍTICOS: ${errores.length}\n`);
        errores.forEach((error, i) => {
          console.log(`${i + 1}. ${error.empresa} - Notificación ${error.notifIndex + 1}`);
          console.log(`   Campo: ${error.campo}`);
          console.log(`   Problema: ${error.problema}`);
          console.log(`   Valor actual: ${error.valorActual}`);
          if (error.valorEsperado) {
            console.log(`   Valor esperado: ${error.valorEsperado}`);
          }
          console.log('');
        });
      }

      if (advertencias.length > 0) {
        console.log(`⚠️  ADVERTENCIAS: ${advertencias.length}\n`);
        advertencias.forEach((adv, i) => {
          console.log(`${i + 1}. ${adv.empresa} - Notificación ${adv.notifIndex + 1}`);
          console.log(`   Campo: ${adv.campo}`);
          console.log(`   Problema: ${adv.problema}`);
          console.log(`   Valor actual: ${adv.valorActual}`);
          console.log('');
        });
      }
    }

    if (errores.length > 0) {
      console.log('💡 RECOMENDACIÓN: Ejecuta npm run limpiar:notif-duplicadas para corregir automáticamente.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(errores.length > 0 ? 1 : 0);
  }
}

validarConsistencia();
