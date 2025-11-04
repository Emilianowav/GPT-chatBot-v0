// 🧹 Script para limpiar módulo de calendario de Paraná Lodge
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import { ConfiguracionBotModel } from '../src/modules/calendar/models/ConfiguracionBot.js';
import { ConfiguracionModuloModel } from '../src/modules/calendar/models/ConfiguracionModulo.js';
import { TurnoModel } from '../src/modules/calendar/models/Turno.js';
import { AgenteModel } from '../src/modules/calendar/models/Agente.js';
import { ConversationStateModel } from '../src/models/ConversationState.js';
import { EmpresaModel } from '../src/models/Empresa.js';

const EMPRESA_NOMBRE = 'Paraná Lodge';

async function limpiarModuloParanaLodge() {
  try {
    console.log('🧹 Limpiando módulo de calendario de Paraná Lodge...\n');
    await connectDB();
    
    let cambiosRealizados = 0;
    
    // 1. Verificar empresa
    console.log('1️⃣ Verificando empresa...');
    const empresa = await EmpresaModel.findOne({ nombre: EMPRESA_NOMBRE });
    
    if (!empresa) {
      console.error(`❌ Empresa "${EMPRESA_NOMBRE}" no encontrada`);
      process.exit(1);
    }
    
    console.log(`   ✅ Empresa encontrada: ${empresa.nombre}`);
    console.log(`   📞 Teléfono: ${empresa.telefono}`);
    
    // 2. Desactivar bot de pasos
    console.log('\n2️⃣ Desactivando bot de pasos...');
    const configBot = await ConfiguracionBotModel.findOne({ empresaId: EMPRESA_NOMBRE });
    
    if (configBot) {
      if (configBot.activo) {
        configBot.activo = false;
        await configBot.save();
        console.log('   ✅ Bot de pasos DESACTIVADO');
        cambiosRealizados++;
      } else {
        console.log('   ✅ Bot de pasos ya estaba desactivado');
      }
    } else {
      console.log('   ℹ️ No existe configuración del bot (correcto)');
    }
    
    // 3. Eliminar configuración del módulo de calendario
    console.log('\n3️⃣ Eliminando configuración del módulo de calendario...');
    const configModulo = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_NOMBRE });
    
    if (configModulo) {
      await ConfiguracionModuloModel.deleteOne({ empresaId: EMPRESA_NOMBRE });
      console.log('   ✅ Configuración del módulo eliminada');
      cambiosRealizados++;
    } else {
      console.log('   ✅ No existe configuración del módulo (correcto)');
    }
    
    // 4. Verificar turnos (no eliminar, solo informar)
    console.log('\n4️⃣ Verificando turnos...');
    const turnosCount = await TurnoModel.countDocuments({ empresaId: EMPRESA_NOMBRE });
    
    if (turnosCount > 0) {
      console.log(`   ⚠️ Existen ${turnosCount} turno(s) para esta empresa`);
      console.log('   ℹ️ Los turnos NO se eliminarán (pueden ser históricos)');
    } else {
      console.log('   ✅ No hay turnos registrados');
    }
    
    // 5. Verificar agentes
    console.log('\n5️⃣ Verificando agentes/choferes...');
    const agentesCount = await AgenteModel.countDocuments({ empresaId: EMPRESA_NOMBRE });
    
    if (agentesCount > 0) {
      console.log(`   ⚠️ Existen ${agentesCount} agente(s) para esta empresa`);
      console.log('   ℹ️ Los agentes NO se eliminarán (pueden ser necesarios)');
    } else {
      console.log('   ✅ No hay agentes registrados');
    }
    
    // 6. Limpiar estados de conversación relacionados con flujos de turnos
    console.log('\n6️⃣ Limpiando estados de conversación...');
    const estadosLimpiados = await ConversationStateModel.deleteMany({
      empresaId: EMPRESA_NOMBRE,
      flujo_activo: { $in: ['menu_principal', 'confirmacion_turnos'] }
    });
    
    if (estadosLimpiados.deletedCount > 0) {
      console.log(`   ✅ ${estadosLimpiados.deletedCount} estado(s) de conversación eliminado(s)`);
      cambiosRealizados++;
    } else {
      console.log('   ✅ No hay estados de conversación activos');
    }
    
    // 7. Verificar módulos en la empresa
    console.log('\n7️⃣ Verificando módulos de la empresa...');
    if (empresa.modulos && empresa.modulos.length > 0) {
      console.log(`   📋 Módulos actuales: ${empresa.modulos.length}`);
      
      const moduloCalendario = empresa.modulos.find((m: any) => 
        m.id === 'calendario' || m.nombre?.toLowerCase().includes('calendario')
      );
      
      if (moduloCalendario) {
        console.log('   ⚠️ Módulo de calendario encontrado en empresa.modulos');
        console.log('   🔄 Eliminando módulo de calendario...');
        
        empresa.modulos = empresa.modulos.filter((m: any) => 
          m.id !== 'calendario' && !m.nombre?.toLowerCase().includes('calendario')
        );
        
        await empresa.save();
        console.log('   ✅ Módulo de calendario eliminado de empresa.modulos');
        cambiosRealizados++;
      } else {
        console.log('   ✅ No tiene módulo de calendario (correcto)');
      }
    } else {
      console.log('   ✅ No tiene módulos configurados (plan base)');
    }
    
    // 8. Verificar plan de la empresa
    console.log('\n8️⃣ Verificando plan de la empresa...');
    console.log(`   📊 Plan actual: ${empresa.plan || 'basico'}`);
    
    if (empresa.plan && empresa.plan !== 'basico') {
      console.log('   ⚠️ La empresa tiene un plan diferente a "basico"');
      console.log('   ℹ️ Si debe tener solo plan base, actualízalo manualmente');
    } else {
      console.log('   ✅ Plan correcto (basico)');
    }
    
    // RESUMEN FINAL
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DE LIMPIEZA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`✅ Cambios realizados: ${cambiosRealizados}`);
    console.log('');
    
    // Verificación final
    const configBotFinal = await ConfiguracionBotModel.findOne({ empresaId: EMPRESA_NOMBRE });
    const configModuloFinal = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_NOMBRE });
    const estadosActivos = await ConversationStateModel.countDocuments({
      empresaId: EMPRESA_NOMBRE,
      flujo_activo: { $ne: null }
    });
    
    console.log('📋 Estado Final:');
    console.log(`   Bot de pasos: ${configBotFinal?.activo ? '🔴 ACTIVO (ERROR)' : '🟢 DESACTIVADO'}`);
    console.log(`   Módulo calendario: ${configModuloFinal ? '🔴 EXISTE (ERROR)' : '🟢 NO EXISTE'}`);
    console.log(`   Estados activos: ${estadosActivos}`);
    console.log(`   Turnos históricos: ${turnosCount}`);
    console.log(`   Agentes: ${agentesCount}`);
    console.log('');
    
    if (!configBotFinal?.activo && !configModuloFinal && estadosActivos === 0) {
      console.log('✅ Paraná Lodge configurado correctamente para usar SOLO GPT');
      console.log('🧠 La empresa ahora responderá con conversación de IA');
    } else {
      console.log('⚠️ Aún hay configuraciones pendientes de limpiar');
    }
    
    console.log('\n🔄 IMPORTANTE: Reinicia el servidor backend para aplicar cambios');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

limpiarModuloParanaLodge();
