/**
 * 🔍 AUDITORÍA DETALLADA - FLUJO SAN JOSE
 * 
 * Script para auditar el flujo de pasos (workflow) de San Jose
 * Analiza la estructura completa de los flujos conversacionales
 * 
 * Uso: node scripts/auditar-flujo-sanjose.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

function analizarPaso(paso, index) {
  console.log(`\n   📍 PASO ${index + 1}: ${paso.nombre || 'Sin nombre'}`);
  console.log(`      ID: ${paso.id || 'N/A'}`);
  console.log(`      Tipo: ${paso.tipo || 'N/A'}`);
  console.log(`      Mensaje: ${paso.mensaje ? paso.mensaje.substring(0, 100) + '...' : 'N/A'}`);
  
  if (paso.opciones && paso.opciones.length > 0) {
    console.log(`      Opciones: ${paso.opciones.length}`);
    paso.opciones.forEach((opt, i) => {
      console.log(`         ${i + 1}. ${opt.texto || opt.label || 'Sin texto'} → ${opt.siguientePaso || 'N/A'}`);
    });
  }
  
  if (paso.validacion) {
    console.log(`      Validación: ${paso.validacion.tipo || 'N/A'}`);
    if (paso.validacion.regex) console.log(`         Regex: ${paso.validacion.regex}`);
    if (paso.validacion.min) console.log(`         Min: ${paso.validacion.min}`);
    if (paso.validacion.max) console.log(`         Max: ${paso.validacion.max}`);
  }
  
  if (paso.siguientePaso) {
    console.log(`      Siguiente paso: ${paso.siguientePaso}`);
  }
  
  if (paso.endpointId) {
    console.log(`      Endpoint API: ${paso.endpointId}`);
  }
  
  if (paso.guardarEn) {
    console.log(`      Guardar en variable: ${paso.guardarEn}`);
  }
  
  if (paso.condiciones && paso.condiciones.length > 0) {
    console.log(`      Condiciones: ${paso.condiciones.length}`);
    paso.condiciones.forEach((cond, i) => {
      console.log(`         ${i + 1}. ${cond.campo} ${cond.operador} ${cond.valor} → ${cond.siguientePaso}`);
    });
  }
}

function analizarFlujo(flujo, nombre) {
  console.log(`\n   🔀 FLUJO: ${nombre}`);
  console.log(`      Nombre: ${flujo.nombre || 'N/A'}`);
  console.log(`      Descripción: ${flujo.descripcion || 'N/A'}`);
  console.log(`      Paso inicial: ${flujo.pasoInicial || 'N/A'}`);
  console.log(`      Total de pasos: ${flujo.pasos?.length || 0}`);
  console.log(`      Activo: ${flujo.activo !== false ? 'SÍ' : 'NO'}`);
  
  if (flujo.pasos && flujo.pasos.length > 0) {
    console.log(`\n   📋 PASOS DEL FLUJO:`);
    flujo.pasos.forEach((paso, i) => analizarPaso(paso, i));
  } else {
    console.log(`\n   ⚠️  FLUJO VACÍO - No tiene pasos configurados`);
  }
}

async function auditarFlujoSanJose() {
  try {
    console.log('\n🔍 AUDITORÍA DETALLADA - FLUJO SAN JOSE\n');
    console.log('='.repeat(80));
    
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;

    // Buscar configuración del bot
    console.log('📱 CONFIGURACIÓN DEL BOT');
    console.log('-'.repeat(80));
    
    const configBot = await db.collection('configuracionbots').findOne({ empresaId: 'San Jose' });
    
    if (!configBot) {
      console.log('❌ No se encontró configuración del bot para San Jose');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`✅ Configuración encontrada`);
    console.log(`   ID: ${configBot._id}`);
    console.log(`   Activo: ${configBot.activo ? 'SÍ' : 'NO'}`);
    console.log(`   Timeout: ${configBot.timeoutMinutos || 15} minutos`);
    console.log(`   Requiere confirmación: ${configBot.requiereConfirmacion ? 'SÍ' : 'NO'}`);
    console.log(`   Permite cancelación: ${configBot.permiteCancelacion ? 'SÍ' : 'NO'}`);
    
    // Mensajes del bot
    console.log('\n💬 MENSAJES DEL BOT');
    console.log('-'.repeat(80));
    console.log(`\n📩 Mensaje de Bienvenida:`);
    console.log(configBot.mensajeBienvenida || 'N/A');
    console.log(`\n👋 Mensaje de Despedida:`);
    console.log(configBot.mensajeDespedida || 'N/A');
    console.log(`\n❌ Mensaje de Error:`);
    console.log(configBot.mensajeError || 'N/A');
    
    // Horarios de atención
    if (configBot.horariosAtencion) {
      console.log('\n🕐 HORARIOS DE ATENCIÓN');
      console.log('-'.repeat(80));
      console.log(`   Activo: ${configBot.horariosAtencion.activo ? 'SÍ' : 'NO'}`);
      console.log(`   Horario: ${configBot.horariosAtencion.inicio} - ${configBot.horariosAtencion.fin}`);
      console.log(`   Días: ${configBot.horariosAtencion.diasSemana?.join(', ') || 'N/A'}`);
      if (configBot.horariosAtencion.mensajeFueraHorario) {
        console.log(`   Mensaje fuera de horario: ${configBot.horariosAtencion.mensajeFueraHorario}`);
      }
    }
    
    // Analizar flujos
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('🔀 FLUJOS CONVERSACIONALES');
    console.log('='.repeat(80));
    
    if (!configBot.flujos) {
      console.log('❌ No hay flujos configurados');
    } else {
      const flujos = configBot.flujos;
      const nombresFlujos = Object.keys(flujos).filter(k => k !== '_id');
      
      console.log(`\n📊 Total de flujos: ${nombresFlujos.length}`);
      console.log(`   Flujos: ${nombresFlujos.join(', ')}`);
      
      // Analizar cada flujo
      for (const nombreFlujo of nombresFlujos) {
        console.log('\n' + '='.repeat(80));
        analizarFlujo(flujos[nombreFlujo], nombreFlujo);
      }
    }
    
    // Resumen y diagnóstico
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('📊 DIAGNÓSTICO Y RESUMEN');
    console.log('='.repeat(80));
    
    const problemas = [];
    const advertencias = [];
    
    if (!configBot.flujos) {
      problemas.push('No hay flujos configurados');
    } else {
      const flujos = configBot.flujos;
      const nombresFlujos = Object.keys(flujos).filter(k => k !== '_id');
      
      nombresFlujos.forEach(nombre => {
        const flujo = flujos[nombre];
        
        if (!flujo.pasos || flujo.pasos.length === 0) {
          problemas.push(`Flujo "${nombre}" está vacío (0 pasos)`);
        }
        
        if (!flujo.pasoInicial) {
          problemas.push(`Flujo "${nombre}" no tiene paso inicial definido`);
        }
        
        if (flujo.pasos && flujo.pasos.length > 0) {
          // Verificar que el paso inicial existe
          const pasoInicialExiste = flujo.pasos.some(p => p.id === flujo.pasoInicial);
          if (!pasoInicialExiste) {
            problemas.push(`Flujo "${nombre}": paso inicial "${flujo.pasoInicial}" no existe en los pasos`);
          }
          
          // Verificar pasos sin tipo
          flujo.pasos.forEach((paso, i) => {
            if (!paso.tipo) {
              advertencias.push(`Flujo "${nombre}", Paso ${i + 1}: sin tipo definido`);
            }
            if (!paso.id) {
              advertencias.push(`Flujo "${nombre}", Paso ${i + 1}: sin ID definido`);
            }
          });
        }
      });
    }
    
    if (problemas.length > 0) {
      console.log('\n❌ PROBLEMAS CRÍTICOS:');
      problemas.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
    } else {
      console.log('\n✅ No se encontraron problemas críticos');
    }
    
    if (advertencias.length > 0) {
      console.log('\n⚠️  ADVERTENCIAS:');
      advertencias.forEach((a, i) => console.log(`   ${i + 1}. ${a}`));
    } else {
      console.log('✅ No hay advertencias');
    }
    
    // Guardar reporte
    const reportPath = path.join(__dirname, '..', 'analysis-reports', `sanjose-flujo-audit-${new Date().toISOString().split('T')[0]}.json`);
    const reporte = {
      fecha: new Date().toISOString(),
      configuracion: configBot,
      problemas,
      advertencias
    };
    fs.writeFileSync(reportPath, JSON.stringify(reporte, null, 2));
    console.log(`\n💾 Reporte completo guardado en: ${reportPath}`);
    
    console.log('\n✅ Auditoría completada\n');
    
  } catch (error) {
    console.error('❌ Error durante la auditoría:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB\n');
  }
}

auditarFlujoSanJose().catch(console.error);
