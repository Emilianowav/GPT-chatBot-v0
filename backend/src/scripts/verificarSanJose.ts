// 🔍 Script de Verificación para San Jose
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { EmpresaModel } from '../models/Empresa.js';
import { AdminUserModel } from '../models/AdminUser.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { ConfiguracionBotModel } from '../modules/calendar/models/ConfiguracionBot.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';

async function verificarSanJose() {
  try {
    console.log('🔍 Verificando configuración de San Jose...\n');
    await connectDB();
    
    let todoBien = true;
    
    // 1. Verificar empresa
    console.log('1️⃣ Verificando empresa...');
    const empresa = await EmpresaModel.findOne({ nombre: 'San Jose' });
    if (empresa) {
      console.log('   ✅ Empresa encontrada');
      console.log(`   📞 Teléfono: ${empresa.telefono}`);
      console.log(`   📱 Phone Number ID: ${empresa.phoneNumberId}`);
      console.log(`   📦 Plan: ${empresa.plan}`);
      console.log(`   🔧 Módulos activos: ${empresa.modulos?.length || 0}`);
      
      if (empresa.modulos && empresa.modulos.length > 0) {
        empresa.modulos.forEach((mod: any) => {
          console.log(`      - ${mod.nombre} (${mod.activo ? '✅' : '❌'})`);
        });
      }
    } else {
      console.log('   ❌ Empresa NO encontrada');
      todoBien = false;
    }
    
    // 2. Verificar usuario admin
    console.log('\n2️⃣ Verificando usuario admin...');
    const admin = await AdminUserModel.findOne({ 
      empresaId: 'San Jose',
      role: 'admin'
    });
    if (admin) {
      console.log('   ✅ Usuario admin encontrado');
      console.log(`   👤 Username: ${admin.username}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔓 Activo: ${admin.activo ? 'Sí' : 'No'}`);
    } else {
      console.log('   ❌ Usuario admin NO encontrado');
      todoBien = false;
    }
    
    // 3. Verificar configuración del módulo
    console.log('\n3️⃣ Verificando configuración del módulo de calendario...');
    const configModulo = await ConfiguracionModuloModel.findOne({ 
      empresaId: 'San Jose' 
    });
    if (configModulo) {
      console.log('   ✅ Configuración del módulo encontrada');
      console.log(`   🏢 Tipo de negocio: ${configModulo.tipoNegocio}`);
      console.log(`   📝 Campos personalizados: ${configModulo.camposPersonalizados.length}`);
      console.log(`   👥 Usa agentes: ${configModulo.usaAgentes ? 'Sí' : 'No'}`);
      console.log(`   🤖 Chatbot activo: ${configModulo.chatbotActivo ? 'Sí' : 'No'}`);
      console.log(`   📅 Notificaciones: ${configModulo.notificaciones.length}`);
      
      console.log('\n   📝 Campos configurados:');
      configModulo.camposPersonalizados.forEach((campo: any) => {
        console.log(`      - ${campo.etiqueta} (${campo.tipo}) ${campo.requerido ? '*' : ''}`);
      });
    } else {
      console.log('   ❌ Configuración del módulo NO encontrada');
      todoBien = false;
    }
    
    // 4. Verificar configuración del bot
    console.log('\n4️⃣ Verificando configuración del bot de pasos...');
    const configBot = await ConfiguracionBotModel.findOne({ 
      empresaId: 'San Jose' 
    });
    if (configBot) {
      console.log('   ✅ Configuración del bot encontrada');
      console.log(`   🤖 Activo: ${configBot.activo ? 'Sí' : 'No'}`);
      console.log(`   ⏱️  Timeout: ${configBot.timeoutMinutos} minutos`);
      console.log(`   ✅ Permite cancelación: ${configBot.permiteCancelacion ? 'Sí' : 'No'}`);
      
      if (configBot.horariosAtencion?.activo) {
        console.log(`   🕐 Horario: ${configBot.horariosAtencion.inicio} - ${configBot.horariosAtencion.fin}`);
        console.log(`   📅 Días: ${configBot.horariosAtencion.diasSemana.length} días activos`);
      }
    } else {
      console.log('   ❌ Configuración del bot NO encontrada');
      todoBien = false;
    }
    
    // 5. Verificar choferes/agentes
    console.log('\n5️⃣ Verificando choferes...');
    const choferes = await AgenteModel.find({ empresaId: 'San Jose' });
    if (choferes.length > 0) {
      console.log(`   ✅ ${choferes.length} chofer(es) encontrado(s)`);
      choferes.forEach((chofer: any) => {
        console.log(`      - ${chofer.nombre} ${chofer.apellido} (${chofer.activo ? '✅' : '❌'})`);
        if (chofer.especialidad) {
          console.log(`        Especialidad: ${chofer.especialidad}`);
        }
      });
    } else {
      console.log('   ⚠️  No se encontraron choferes');
    }
    
    // Resumen final
    console.log('\n' + '='.repeat(60));
    if (todoBien) {
      console.log('✅ VERIFICACIÓN EXITOSA - Todo está configurado correctamente');
    } else {
      console.log('⚠️  VERIFICACIÓN CON ERRORES - Revisar los puntos marcados');
    }
    console.log('='.repeat(60));
    
    console.log('\n📋 DATOS PARA CONFIGURAR WEBHOOK DE WHATSAPP:');
    console.log(`   Webhook URL: ${process.env.WEBHOOK_URL || 'https://gpt-chatbot-v0.onrender.com'}/webhook`);
    console.log(`   Verify Token: ${process.env.WEBHOOK_VERIFY_TOKEN || 'tu_verify_token'}`);
    console.log(`   Phone Number ID: ${empresa?.phoneNumberId || 'N/A'}`);
    
    console.log('\n🧪 PARA PROBAR EL BOT:');
    console.log('   1. Asegúrate de que el webhook esté configurado en Meta');
    console.log('   2. Envía un mensaje de WhatsApp a: +5493794044092');
    console.log('   3. El bot debe responder con el menú de opciones');
    console.log('   4. Prueba el flujo completo: Reservar -> Consultar -> Cancelar');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR EN VERIFICACIÓN:', error);
    process.exit(1);
  }
}

verificarSanJose();
