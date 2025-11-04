// 🔍 Script para verificar configuración de notificaciones
import mongoose from 'mongoose';
import { EmpresaModel } from '../models/Empresa.js';
import { ClienteModel } from '../models/Cliente.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

async function verificarConfiguracion() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // 1. Verificar empresas
    console.log('📋 ========== EMPRESAS ==========');
    const empresas = await EmpresaModel.find({});
    console.log(`Total empresas: ${empresas.length}\n`);

    for (const empresa of empresas) {
      console.log(`🏢 Empresa: ${empresa.nombre}`);
      console.log(`   _id: ${empresa._id}`);
      console.log(`   Teléfono: ${empresa.telefono}`);
      console.log(`   phoneNumberId: ${(empresa as any).phoneNumberId || '❌ NO CONFIGURADO'}`);
      
      if (!(empresa as any).phoneNumberId) {
        console.log('   ⚠️ PROBLEMA: Esta empresa NO tiene phoneNumberId configurado');
        console.log('   📝 Solución: Agregar phoneNumberId en MongoDB');
        console.log('   Ejemplo: db.empresas.updateOne({ nombre: "' + empresa.nombre + '" }, { $set: { phoneNumberId: "768730689655171" } })');
      }
      console.log('');
    }

    // 2. Verificar clientes
    console.log('\n📋 ========== CLIENTES ==========');
    const clientes = await ClienteModel.find({}).limit(10);
    console.log(`Total clientes (mostrando primeros 10): ${clientes.length}\n`);

    for (const cliente of clientes) {
      const telefonoNormalizado = normalizarTelefono(cliente.telefono);
      const esNormalizado = cliente.telefono === telefonoNormalizado;
      
      console.log(`👤 Cliente: ${cliente.nombre} ${cliente.apellido}`);
      console.log(`   _id: ${cliente._id}`);
      console.log(`   Teléfono: ${cliente.telefono}`);
      console.log(`   Normalizado: ${esNormalizado ? '✅' : '❌ ' + telefonoNormalizado}`);
      console.log(`   Empresa: ${cliente.empresaId}`);
      
      if (!esNormalizado) {
        console.log('   ⚠️ PROBLEMA: Teléfono NO normalizado');
        console.log('   📝 Solución: npm run normalizar:telefonos');
      }
      console.log('');
    }

    // 3. Verificar turnos recientes
    console.log('\n📋 ========== TURNOS RECIENTES ==========');
    const turnos = await TurnoModel.find({})
      .sort({ creadoEn: -1 })
      .limit(5)
      .populate('agenteId');
    
    console.log(`Total turnos (mostrando últimos 5): ${turnos.length}\n`);

    for (const turno of turnos) {
      console.log(`📅 Turno: ${turno._id}`);
      console.log(`   Empresa: ${turno.empresaId}`);
      console.log(`   Cliente ID: ${turno.clienteId}`);
      console.log(`   Fecha: ${new Date(turno.fechaInicio).toLocaleString('es-AR')}`);
      console.log(`   Estado: ${turno.estado}`);
      console.log(`   Notificaciones programadas: ${turno.notificaciones?.length || 0}`);
      
      if (turno.notificaciones && turno.notificaciones.length > 0) {
        turno.notificaciones.forEach((notif: any, i: number) => {
          console.log(`     ${i + 1}. Tipo: ${notif.tipo}`);
          console.log(`        Programada para: ${new Date(notif.programadaPara).toLocaleString('es-AR')}`);
          console.log(`        Enviada: ${notif.enviada ? '✅' : '❌ Pendiente'}`);
        });
      } else {
        console.log('   ⚠️ PROBLEMA: Sin notificaciones programadas');
      }

      // Verificar cliente
      const cliente = await ClienteModel.findOne({ 
        _id: turno.clienteId,
        empresaId: turno.empresaId
      });

      if (cliente) {
        const telefonoNormalizado = normalizarTelefono(cliente.telefono);
        console.log(`   Cliente: ${cliente.nombre} ${cliente.apellido}`);
        console.log(`   Teléfono cliente: ${cliente.telefono}`);
        console.log(`   Teléfono normalizado: ${telefonoNormalizado === cliente.telefono ? '✅' : '❌ ' + telefonoNormalizado}`);
      } else {
        console.log('   ❌ PROBLEMA: Cliente no encontrado');
      }

      // Verificar empresa
      const empresa = await EmpresaModel.findOne({ nombre: turno.empresaId });
      if (empresa) {
        console.log(`   Empresa encontrada: ✅`);
        console.log(`   phoneNumberId: ${(empresa as any).phoneNumberId || '❌ NO CONFIGURADO'}`);
      } else {
        console.log(`   ❌ PROBLEMA: Empresa no encontrada`);
      }

      console.log('');
    }

    // 4. Verificar configuración de módulo
    console.log('\n📋 ========== CONFIGURACIÓN MÓDULO ==========');
    const configs = await ConfiguracionModuloModel.find({ activo: true });
    console.log(`Total configuraciones activas: ${configs.length}\n`);

    for (const config of configs) {
      console.log(`⚙️ Configuración: ${config.empresaId}`);
      console.log(`   Tipo negocio: ${config.tipoNegocio}`);
      console.log(`   Notificaciones configuradas: ${config.notificaciones?.length || 0}`);
      
      if (config.notificaciones && config.notificaciones.length > 0) {
        config.notificaciones.forEach((notif: any, i: number) => {
          console.log(`     ${i + 1}. Tipo: ${notif.tipo}`);
          console.log(`        Activa: ${notif.activa ? '✅' : '❌'}`);
          console.log(`        Momento: ${notif.momento}`);
          console.log(`        Ejecución: ${notif.ejecucion}`);
        });
      } else {
        console.log('   ⚠️ ADVERTENCIA: Sin notificaciones configuradas');
      }
      console.log('');
    }

    // 5. Verificar modo DEV
    console.log('\n📋 ========== CONFIGURACIÓN SISTEMA ==========');
    console.log(`MODO_DEV: ${process.env.MODO_DEV}`);
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`META_WHATSAPP_TOKEN: ${process.env.META_WHATSAPP_TOKEN ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`TEST_PHONE_NUMBER_ID: ${process.env.TEST_PHONE_NUMBER_ID || '❌ No configurado'}`);

    if (process.env.MODO_DEV === 'true') {
      console.log('\n⚠️ ADVERTENCIA: MODO_DEV está en TRUE');
      console.log('   Los mensajes NO se enviarán realmente a WhatsApp');
      console.log('   Cambiar a MODO_DEV=false en .env para enviar mensajes reales');
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar script
verificarConfiguracion();
