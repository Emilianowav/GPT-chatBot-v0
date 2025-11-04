// 🔍 Script para verificar configuración de Paraná Lodge
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import { EmpresaModel } from '../src/models/Empresa.js';
import { ConfiguracionBotModel } from '../src/modules/calendar/models/ConfiguracionBot.js';
import { ConfiguracionModuloModel } from '../src/modules/calendar/models/ConfiguracionModulo.js';
import { ConversationStateModel } from '../src/models/ConversationState.js';

const EMPRESA_NOMBRE = 'Paraná Lodge';

async function verificarParanaLodge() {
  try {
    console.log('🔍 Verificando configuración de Paraná Lodge...\n');
    await connectDB();
    
    // 1. Verificar empresa
    console.log('1️⃣ Verificando empresa...');
    const empresa = await EmpresaModel.findOne({ nombre: EMPRESA_NOMBRE });
    
    if (!empresa) {
      console.error(`❌ Empresa "${EMPRESA_NOMBRE}" no encontrada`);
      process.exit(1);
    }
    
    console.log(`   ✅ Empresa encontrada`);
    console.log(`   📋 Nombre: ${empresa.nombre}`);
    console.log(`   📞 Teléfono: ${empresa.telefono}`);
    console.log(`   📊 Plan: ${empresa.plan || 'basico'}`);
    console.log(`   🤖 Modelo GPT: ${empresa.modelo || 'gpt-3.5-turbo'}`);
    console.log(`   📝 Prompt: ${empresa.prompt ? 'Configurado ✅' : 'No configurado ⚠️'}`);
    if (empresa.prompt) {
      console.log(`   📄 Prompt (primeros 100 chars): ${empresa.prompt.substring(0, 100)}...`);
    }
    
    // 2. Verificar ConfiguracionBot
    console.log('\n2️⃣ Verificando ConfiguracionBot...');
    const configBot = await ConfiguracionBotModel.findOne({ empresaId: EMPRESA_NOMBRE });
    
    if (configBot) {
      console.log(`   📋 Estado: ${configBot.activo ? '🔴 ACTIVO (PROBLEMA)' : '🟢 DESACTIVADO'}`);
    } else {
      console.log('   ✅ No existe configuración del bot (correcto)');
    }
    
    // 3. Verificar ConfiguracionModulo
    console.log('\n3️⃣ Verificando ConfiguracionModulo...');
    const configModulo = await ConfiguracionModuloModel.findOne({ empresaId: EMPRESA_NOMBRE });
    
    if (configModulo) {
      console.log('   🔴 EXISTE configuración del módulo (PROBLEMA)');
      console.log(`   📋 Activo: ${configModulo.activo}`);
    } else {
      console.log('   ✅ No existe configuración del módulo (correcto)');
    }
    
    // 4. Verificar estados de conversación
    console.log('\n4️⃣ Verificando estados de conversación...');
    const estados = await ConversationStateModel.find({ empresaId: EMPRESA_NOMBRE });
    
    console.log(`   📊 Total estados: ${estados.length}`);
    
    if (estados.length > 0) {
      console.log('\n   Estados encontrados:');
      for (const estado of estados) {
        console.log(`   - Teléfono: ${estado.telefono}`);
        console.log(`     Flujo activo: ${estado.flujo_activo || 'ninguno'}`);
        console.log(`     Estado actual: ${estado.estado_actual || 'ninguno'}`);
        console.log(`     Última interacción: ${estado.ultima_interaccion}`);
        console.log('');
      }
    }
    
    // 5. Verificar módulos de la empresa
    console.log('5️⃣ Verificando módulos...');
    if (empresa.modulos && empresa.modulos.length > 0) {
      console.log(`   ⚠️ Tiene ${empresa.modulos.length} módulo(s):`);
      for (const modulo of empresa.modulos) {
        console.log(`   - ${(modulo as any).nombre || (modulo as any).id}`);
      }
    } else {
      console.log('   ✅ No tiene módulos (plan base)');
    }
    
    // RESUMEN
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const problemas: string[] = [];
    
    if (configBot?.activo) {
      problemas.push('Bot de pasos está ACTIVO (debería estar desactivado)');
    }
    
    if (configModulo) {
      problemas.push('Existe ConfiguracionModulo (debería no existir)');
    }
    
    if (!empresa.prompt) {
      problemas.push('No tiene prompt configurado para GPT');
    }
    
    if (empresa.modulos && empresa.modulos.length > 0) {
      problemas.push('Tiene módulos configurados (debería ser plan base)');
    }
    
    if (problemas.length > 0) {
      console.log('⚠️ PROBLEMAS ENCONTRADOS:');
      for (const problema of problemas) {
        console.log(`   - ${problema}`);
      }
    } else {
      console.log('✅ Configuración correcta para usar GPT');
    }
    
    console.log('\n📋 Configuración esperada:');
    console.log('   - Bot de pasos: DESACTIVADO ✅');
    console.log('   - Módulo calendario: NO EXISTE ✅');
    console.log('   - Prompt GPT: CONFIGURADO ✅');
    console.log('   - Plan: basico ✅');
    console.log('   - Modelo: gpt-3.5-turbo o gpt-4 ✅');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verificarParanaLodge();
