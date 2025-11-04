// 🔍 Script para verificar contacto nuevo
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import dotenv from 'dotenv';

dotenv.config();

async function verificarContactoNuevo() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    // Buscar el contacto más reciente
    const contacto = await ContactoEmpresaModel.findOne({
      empresaId: 'San Jose'
    }).sort({ createdAt: -1 });

    if (!contacto) {
      console.log('❌ No se encontró ningún contacto');
      return;
    }

    console.log('📊 CONTACTO MÁS RECIENTE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🆔 Identificación:');
    console.log('   _id:', contacto._id);
    console.log('   Teléfono:', contacto.telefono);
    console.log('   Nombre:', contacto.nombre);
    console.log('   Apellido:', contacto.apellido);
    console.log('   ProfileName:', contacto.profileName || 'N/A');
    console.log('   Email:', contacto.email || 'N/A');
    console.log('   DNI:', contacto.dni || 'N/A');
    console.log('');

    console.log('🏢 Empresa:');
    console.log('   empresaId:', contacto.empresaId);
    console.log('   Origen:', contacto.origen);
    console.log('   Activo:', contacto.activo);
    console.log('');

    console.log('⚙️ Preferencias:');
    console.log('   aceptaWhatsApp:', contacto.preferencias?.aceptaWhatsApp);
    console.log('   aceptaSMS:', contacto.preferencias?.aceptaSMS);
    console.log('   aceptaEmail:', contacto.preferencias?.aceptaEmail);
    console.log('   recordatorioTurnos:', contacto.preferencias?.recordatorioTurnos);
    console.log('');

    console.log('💬 Conversaciones:');
    console.log('   Historial:', contacto.conversaciones?.historial?.length || 0, 'mensajes');
    console.log('   Última conversación:', contacto.conversaciones?.ultimaConversacion);
    console.log('   Saludado:', contacto.conversaciones?.saludado);
    console.log('   Despedido:', contacto.conversaciones?.despedido);
    console.log('');

    console.log('📊 Métricas:');
    console.log('   Interacciones:', contacto.metricas?.interacciones);
    console.log('   Mensajes enviados:', contacto.metricas?.mensajesEnviados);
    console.log('   Mensajes recibidos:', contacto.metricas?.mensajesRecibidos);
    console.log('   Turnos realizados:', contacto.metricas?.turnosRealizados);
    console.log('   Última interacción:', contacto.metricas?.ultimaInteraccion);
    console.log('');

    console.log('📅 Fechas:');
    console.log('   Creado:', contacto.createdAt);
    console.log('   Actualizado:', contacto.updatedAt);
    console.log('');

    console.log('📝 Notas:');
    console.log('   ', contacto.notas || 'Sin notas');
    console.log('');

    // Verificar campos faltantes
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFICACIÓN DE CAMPOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const camposFaltantes = [];
    const camposIncompletos = [];

    // Campos obligatorios
    if (!contacto.telefono) camposFaltantes.push('telefono');
    if (!contacto.nombre) camposFaltantes.push('nombre');
    if (!contacto.empresaId) camposFaltantes.push('empresaId');

    // Campos opcionales pero importantes
    if (!contacto.email) camposIncompletos.push('email');
    if (!contacto.dni) camposIncompletos.push('dni');
    if (!contacto.profileName) camposIncompletos.push('profileName');

    // Verificar preferencias
    if (!contacto.preferencias) {
      camposFaltantes.push('preferencias (objeto completo)');
    } else {
      if (contacto.preferencias.aceptaWhatsApp === undefined) camposIncompletos.push('preferencias.aceptaWhatsApp');
      if (contacto.preferencias.recordatorioTurnos === undefined) camposIncompletos.push('preferencias.recordatorioTurnos');
    }

    // Verificar conversaciones
    if (!contacto.conversaciones) {
      camposFaltantes.push('conversaciones (objeto completo)');
    } else {
      if (!contacto.conversaciones.historial) camposFaltantes.push('conversaciones.historial');
      if (!contacto.conversaciones.ultimaConversacion) camposIncompletos.push('conversaciones.ultimaConversacion');
    }

    // Verificar métricas
    if (!contacto.metricas) {
      camposFaltantes.push('metricas (objeto completo)');
    } else {
      if (contacto.metricas.interacciones === undefined) camposIncompletos.push('metricas.interacciones');
      if (!contacto.metricas.ultimaInteraccion) camposIncompletos.push('metricas.ultimaInteraccion');
    }

    if (camposFaltantes.length > 0) {
      console.log('❌ CAMPOS FALTANTES (CRÍTICOS):');
      camposFaltantes.forEach(campo => console.log('   -', campo));
      console.log('');
    } else {
      console.log('✅ Todos los campos obligatorios están presentes\n');
    }

    if (camposIncompletos.length > 0) {
      console.log('⚠️ CAMPOS INCOMPLETOS (NO CRÍTICOS):');
      camposIncompletos.forEach(campo => console.log('   -', campo));
      console.log('');
    } else {
      console.log('✅ Todos los campos opcionales están completos\n');
    }

    // Mostrar JSON completo
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 JSON COMPLETO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(JSON.stringify(contacto.toObject(), null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

verificarContactoNuevo();
