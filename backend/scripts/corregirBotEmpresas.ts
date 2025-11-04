// 🔧 Script para corregir configuración de bots por empresa
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import { ConfiguracionBotModel } from '../src/modules/calendar/models/ConfiguracionBot.js';
import { EmpresaModel } from '../src/models/Empresa.js';

async function corregirBotEmpresas() {
  try {
    console.log('🔧 Corrigiendo configuración de bots por empresa...\n');
    await connectDB();
    
    // 1. Verificar empresas existentes
    console.log('1️⃣ Verificando empresas...');
    const empresas = await EmpresaModel.find({});
    console.log(`   ✅ ${empresas.length} empresa(s) encontrada(s)\n`);
    
    for (const empresa of empresas) {
      console.log(`📋 Empresa: ${empresa.nombre}`);
      console.log(`   Teléfono: ${empresa.telefono}`);
      
      // Buscar configuración del bot
      const configBot = await ConfiguracionBotModel.findOne({ empresaId: empresa.nombre });
      
      if (configBot) {
        console.log(`   ✅ Configuración del bot encontrada`);
        console.log(`   📊 Estado actual: ${configBot.activo ? '🟢 ACTIVO' : '🔴 DESACTIVADO'}`);
        
        // Determinar si debe tener bot de pasos o GPT
        if (empresa.nombre === 'San Jose') {
          // San Jose debe tener bot de pasos ACTIVO
          if (!configBot.activo) {
            console.log(`   🔄 Activando bot de pasos para San Jose...`);
            configBot.activo = true;
            await configBot.save();
            console.log(`   ✅ Bot de pasos ACTIVADO para San Jose`);
          } else {
            console.log(`   ✅ Bot de pasos ya está activo (correcto)`);
          }
        } else if (empresa.nombre === 'Parana Lodge' || empresa.nombre === 'Paraná Lodge') {
          // Parana/Paraná Lodge NO debe tener bot de pasos (debe usar GPT)
          if (configBot.activo) {
            console.log(`   🔄 Desactivando bot de pasos para ${empresa.nombre}...`);
            configBot.activo = false;
            await configBot.save();
            console.log(`   ✅ Bot de pasos DESACTIVADO para ${empresa.nombre} (usará GPT)`);
          } else {
            console.log(`   ✅ Bot de pasos ya está desactivado (correcto, usará GPT)`);
          }
        } else {
          console.log(`   ℹ️ Empresa desconocida, manteniendo configuración actual`);
        }
      } else {
        console.log(`   ⚠️ No tiene configuración del bot`);
        
        // Crear configuración según la empresa
        if (empresa.nombre === 'San Jose') {
          console.log(`   🔄 Creando configuración con bot de pasos ACTIVO para San Jose...`);
          await ConfiguracionBotModel.create({
            empresaId: empresa.nombre,
            activo: true
          });
          console.log(`   ✅ Bot de pasos ACTIVADO para San Jose`);
        } else if (empresa.nombre === 'Parana Lodge' || empresa.nombre === 'Paraná Lodge') {
          console.log(`   🔄 Creando configuración con bot de pasos DESACTIVADO para ${empresa.nombre}...`);
          await ConfiguracionBotModel.create({
            empresaId: empresa.nombre,
            activo: false
          });
          console.log(`   ✅ Bot de pasos DESACTIVADO para ${empresa.nombre} (usará GPT)`);
        }
      }
      
      console.log('');
    }
    
    // 2. Resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const empresa of empresas) {
      const configBot = await ConfiguracionBotModel.findOne({ empresaId: empresa.nombre });
      const tipoBot = configBot?.activo ? '🤖 Bot de Pasos' : '🧠 GPT';
      const estado = configBot?.activo ? '🟢 ACTIVO' : '🔴 DESACTIVADO';
      
      console.log(`${empresa.nombre}:`);
      console.log(`   Tipo: ${tipoBot}`);
      console.log(`   Estado bot de pasos: ${estado}`);
      console.log('');
    }
    
    console.log('✅ Corrección completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

corregirBotEmpresas();
