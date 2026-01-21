/**
 * 🔍 AUDITORÍA RÁPIDA - EMPRESA SAN JOSE
 * 
 * Script para auditar rápidamente toda la configuración de San Jose:
 * - Empresa y configuración básica
 * - Chatbot y phoneNumberId
 * - API Configurations y workflows
 * - Flujos activos
 * - Configuración de módulos (calendario/turnos)
 * - Agentes
 * - Turnos activos
 * - Contactos
 * 
 * Uso: node scripts/auditar-sanjose.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

async function auditarSanJose() {
  try {
    console.log('\n🔍 AUDITORÍA COMPLETA - SAN JOSE\n');
    console.log('='.repeat(80));
    
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    const resultado = {
      fecha: new Date().toISOString(),
      empresa: null,
      chatbot: null,
      apiConfigurations: [],
      flujos: [],
      configuracionModulo: null,
      agentes: [],
      turnos: [],
      contactos: [],
      usuarios: []
    };

    // 1. EMPRESA
    console.log('📊 1. EMPRESA');
    console.log('-'.repeat(80));
    const empresa = await db.collection('empresas').findOne({ 
      $or: [
        { nombre: 'San Jose' },
        { nombre: /san jose/i }
      ]
    });
    
    if (empresa) {
      resultado.empresa = empresa;
      console.log(`✅ Encontrada: ${empresa.nombre}`);
      console.log(`   ID: ${empresa._id}`);
      console.log(`   Teléfono: ${empresa.telefono || 'N/A'}`);
      console.log(`   PhoneNumberId: ${empresa.phoneNumberId || 'N/A'}`);
      console.log(`   Plan: ${empresa.plan || 'N/A'}`);
      console.log(`   Módulos activos: ${empresa.modulos?.join(', ') || 'N/A'}`);
      console.log(`   Activo: ${empresa.activo !== false ? 'SÍ' : 'NO'}`);
    } else {
      console.log('❌ Empresa NO encontrada');
      console.log('   Buscando variantes...');
      const todasEmpresas = await db.collection('empresas').find({}).toArray();
      console.log(`   Empresas disponibles: ${todasEmpresas.map(e => e.nombre).join(', ')}`);
    }

    if (!empresa) {
      console.log('\n⚠️  No se puede continuar sin empresa. Verifica el nombre.\n');
      await mongoose.disconnect();
      return;
    }

    const empresaId = empresa.nombre;

    // 2. CHATBOT
    console.log('\n📱 2. CHATBOT');
    console.log('-'.repeat(80));
    const chatbot = await db.collection('chatbots').findOne({ empresaId });
    
    if (chatbot) {
      resultado.chatbot = chatbot;
      console.log(`✅ Chatbot encontrado`);
      console.log(`   ID: ${chatbot._id}`);
      console.log(`   PhoneNumberId: ${chatbot.whatsapp?.phoneNumberId || 'N/A'}`);
      console.log(`   Activo: ${chatbot.activo !== false ? 'SÍ' : 'NO'}`);
      console.log(`   Flujo activo: ${chatbot.flujoActivo || 'N/A'}`);
    } else {
      console.log('❌ Chatbot NO encontrado');
    }

    // 3. API CONFIGURATIONS
    console.log('\n🔌 3. API CONFIGURATIONS');
    console.log('-'.repeat(80));
    const apiConfigs = await db.collection('api_configurations').find({ empresaId }).toArray();
    resultado.apiConfigurations = apiConfigs;
    
    if (apiConfigs.length > 0) {
      console.log(`✅ ${apiConfigs.length} configuración(es) encontrada(s):`);
      apiConfigs.forEach((config, i) => {
        console.log(`\n   ${i + 1}. ${config.nombre || 'Sin nombre'}`);
        console.log(`      ID: ${config._id}`);
        console.log(`      Base URL: ${config.baseUrl || 'N/A'}`);
        console.log(`      Endpoints: ${config.endpoints?.length || 0}`);
        console.log(`      Workflows: ${config.workflows?.length || 0}`);
        
        if (config.workflows && config.workflows.length > 0) {
          console.log(`\n      📋 Workflows:`);
          config.workflows.forEach((wf, j) => {
            console.log(`         ${j + 1}. ${wf.nombre || 'Sin nombre'} (${wf.pasos?.length || 0} pasos)`);
            console.log(`            Trigger: ${wf.trigger || 'N/A'}`);
            console.log(`            Activo: ${wf.activo !== false ? 'SÍ' : 'NO'}`);
          });
        }
      });
    } else {
      console.log('❌ No hay API configurations');
    }

    // 4. FLUJOS
    console.log('\n🔀 4. FLUJOS');
    console.log('-'.repeat(80));
    const flujos = await db.collection('flujos').find({ empresaId }).toArray();
    resultado.flujos = flujos;
    
    if (flujos.length > 0) {
      console.log(`✅ ${flujos.length} flujo(s) encontrado(s):`);
      flujos.forEach((flujo, i) => {
        console.log(`\n   ${i + 1}. ${flujo.nombre || 'Sin nombre'}`);
        console.log(`      ID: ${flujo._id}`);
        console.log(`      Nodos: ${flujo.nodes?.length || 0}`);
        console.log(`      Edges: ${flujo.edges?.length || 0}`);
        console.log(`      Activo: ${flujo.activo !== false ? 'SÍ' : 'NO'}`);
        console.log(`      Versión: ${flujo.version || 'N/A'}`);
      });
    } else {
      console.log('❌ No hay flujos');
    }

    // 5. CONFIGURACIÓN MÓDULO CALENDARIO
    console.log('\n📅 5. CONFIGURACIÓN MÓDULO CALENDARIO');
    console.log('-'.repeat(80));
    const configModulo = await db.collection('configuraciones_modulo').findOne({ empresaId });
    resultado.configuracionModulo = configModulo;
    
    if (configModulo) {
      console.log(`✅ Configuración encontrada`);
      console.log(`   ID: ${configModulo._id}`);
      console.log(`   Tipo negocio: ${configModulo.tipoNegocio || 'N/A'}`);
      console.log(`   Plantillas Meta configuradas: ${Object.keys(configModulo.plantillasMeta || {}).length}`);
      
      if (configModulo.plantillasMeta) {
        console.log(`\n   📧 Plantillas Meta:`);
        for (const [key, value] of Object.entries(configModulo.plantillasMeta)) {
          console.log(`      - ${key}: ${value.activa ? '✅ ACTIVA' : '❌ INACTIVA'}`);
          if (value.nombre) console.log(`        Nombre: ${value.nombre}`);
          if (value.programacion) {
            console.log(`        Programación: ${value.programacion.metodoVerificacion || 'N/A'}`);
            console.log(`        Hora: ${value.programacion.horaEnvio || 'N/A'}`);
          }
        }
      }
      
      if (configModulo.notificacionDiariaAgentes) {
        console.log(`\n   🔔 Notificación Diaria Agentes:`);
        console.log(`      Activa: ${configModulo.notificacionDiariaAgentes.activa ? 'SÍ' : 'NO'}`);
        console.log(`      Hora: ${configModulo.notificacionDiariaAgentes.horaEnvio || 'N/A'}`);
      }
    } else {
      console.log('❌ Configuración de módulo NO encontrada');
    }

    // 6. AGENTES
    console.log('\n👥 6. AGENTES');
    console.log('-'.repeat(80));
    const agentes = await db.collection('agentes').find({ empresaId }).toArray();
    resultado.agentes = agentes;
    
    if (agentes.length > 0) {
      console.log(`✅ ${agentes.length} agente(s) encontrado(s):`);
      agentes.forEach((agente, i) => {
        console.log(`\n   ${i + 1}. ${agente.nombre} ${agente.apellido || ''}`);
        console.log(`      ID: ${agente._id}`);
        console.log(`      Email: ${agente.email || 'N/A'}`);
        console.log(`      Teléfono: ${agente.telefono || 'N/A'}`);
        console.log(`      Activo: ${agente.activo !== false ? 'SÍ' : 'NO'}`);
        console.log(`      Duración turno: ${agente.duracionTurnoPorDefecto || 'N/A'} min`);
      });
    } else {
      console.log('❌ No hay agentes');
    }

    // 7. TURNOS
    console.log('\n📆 7. TURNOS RECIENTES (últimos 10)');
    console.log('-'.repeat(80));
    const turnos = await db.collection('turnos')
      .find({ empresaId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    resultado.turnos = turnos;
    
    if (turnos.length > 0) {
      console.log(`✅ ${turnos.length} turno(s) encontrado(s):`);
      turnos.forEach((turno, i) => {
        console.log(`\n   ${i + 1}. Turno ${turno._id}`);
        console.log(`      Cliente: ${turno.clienteId || 'N/A'}`);
        console.log(`      Agente: ${turno.agenteId || 'N/A'}`);
        console.log(`      Fecha: ${turno.fechaInicio ? new Date(turno.fechaInicio).toLocaleString('es-AR') : 'N/A'}`);
        console.log(`      Estado: ${turno.estado || 'N/A'}`);
        console.log(`      Notificaciones: ${turno.notificaciones?.length || 0}`);
      });
    } else {
      console.log('❌ No hay turnos');
    }

    // 8. CONTACTOS
    console.log('\n👤 8. CONTACTOS (últimos 5)');
    console.log('-'.repeat(80));
    const contactos = await db.collection('contactos_empresa')
      .find({ empresaId })
      .sort({ 'metricas.ultimaInteraccion': -1 })
      .limit(5)
      .toArray();
    resultado.contactos = contactos;
    
    const totalContactos = await db.collection('contactos_empresa').countDocuments({ empresaId });
    console.log(`📊 Total de contactos: ${totalContactos}`);
    
    if (contactos.length > 0) {
      console.log(`\n✅ Últimos ${contactos.length} contacto(s):`);
      contactos.forEach((contacto, i) => {
        console.log(`\n   ${i + 1}. ${contacto.nombre || 'Sin nombre'}`);
        console.log(`      Teléfono: ${contacto.telefono}`);
        console.log(`      Última interacción: ${contacto.metricas?.ultimaInteraccion ? new Date(contacto.metricas.ultimaInteraccion).toLocaleString('es-AR') : 'N/A'}`);
        console.log(`      Mensajes: ${contacto.metricas?.totalMensajes || 0}`);
        console.log(`      Chatbot pausado: ${contacto.chatbotPausado ? 'SÍ' : 'NO'}`);
      });
    } else {
      console.log('❌ No hay contactos');
    }

    // 9. USUARIOS CRM
    console.log('\n🔐 9. USUARIOS CRM');
    console.log('-'.repeat(80));
    const usuarios = await db.collection('usuarios_empresa').find({ empresaId }).toArray();
    resultado.usuarios = usuarios;
    
    if (usuarios.length > 0) {
      console.log(`✅ ${usuarios.length} usuario(s) encontrado(s):`);
      usuarios.forEach((usuario, i) => {
        console.log(`\n   ${i + 1}. ${usuario.username}`);
        console.log(`      Rol: ${usuario.rol || 'N/A'}`);
        console.log(`      Email: ${usuario.email || 'N/A'}`);
        console.log(`      Activo: ${usuario.activo !== false ? 'SÍ' : 'NO'}`);
        console.log(`      Permisos: ${usuario.permisos?.join(', ') || 'N/A'}`);
      });
    } else {
      console.log('❌ No hay usuarios');
    }

    // RESUMEN FINAL
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('📊 RESUMEN FINAL - SAN JOSE');
    console.log('='.repeat(80));
    console.log(`\n✅ Empresa: ${empresa ? 'ENCONTRADA' : 'NO ENCONTRADA'}`);
    console.log(`${chatbot ? '✅' : '❌'} Chatbot: ${chatbot ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
    console.log(`${apiConfigs.length > 0 ? '✅' : '❌'} API Configurations: ${apiConfigs.length}`);
    console.log(`${flujos.length > 0 ? '✅' : '❌'} Flujos: ${flujos.length}`);
    console.log(`${configModulo ? '✅' : '❌'} Config Módulo: ${configModulo ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
    console.log(`${agentes.length > 0 ? '✅' : '❌'} Agentes: ${agentes.length}`);
    console.log(`${turnos.length > 0 ? '✅' : '⚠️ '} Turnos: ${turnos.length} (últimos 10)`);
    console.log(`${totalContactos > 0 ? '✅' : '❌'} Contactos: ${totalContactos}`);
    console.log(`${usuarios.length > 0 ? '✅' : '❌'} Usuarios CRM: ${usuarios.length}`);

    // GUARDAR REPORTE
    const reportPath = path.join(__dirname, '..', 'analysis-reports', `sanjose-audit-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(resultado, null, 2));
    console.log(`\n💾 Reporte completo guardado en: ${reportPath}`);

    // RECOMENDACIONES
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('💡 RECOMENDACIONES');
    console.log('='.repeat(80));
    
    if (!chatbot) {
      console.log('⚠️  1. Crear chatbot para San Jose');
    }
    if (apiConfigs.length === 0) {
      console.log('⚠️  2. Configurar API Configuration si se necesita integración externa');
    }
    if (flujos.length === 0) {
      console.log('⚠️  3. Crear flujo conversacional para San Jose');
    }
    if (!configModulo) {
      console.log('⚠️  4. Configurar módulo de calendario/turnos');
    }
    if (agentes.length === 0) {
      console.log('⚠️  5. Agregar agentes/choferes para gestionar turnos');
    }
    if (usuarios.length === 0) {
      console.log('⚠️  6. Crear usuarios para acceder al CRM');
    }

    console.log('\n✅ Auditoría completada\n');
    
  } catch (error) {
    console.error('❌ Error durante la auditoría:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB\n');
  }
}

auditarSanJose().catch(console.error);
