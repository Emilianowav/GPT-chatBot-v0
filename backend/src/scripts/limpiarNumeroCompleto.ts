// 🧹 Script para limpiar COMPLETAMENTE un número de teléfono
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ConversationStateModel } from '../models/ConversationState.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

async function limpiarNumeroCompleto() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    const telefonoOriginal = '+54 9 3794 94-6066';
    const telefonoNormalizado = normalizarTelefono(telefonoOriginal);
    const empresaId = 'San Jose';

    console.log('🧹 LIMPIEZA COMPLETA DE NÚMERO DE TELÉFONO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📱 Teléfono original:', telefonoOriginal);
    console.log('📱 Teléfono normalizado:', telefonoNormalizado);
    console.log('🏢 Empresa:', empresaId);
    console.log('');

    // 1. Buscar y eliminar contacto
    console.log('1️⃣ BUSCANDO Y ELIMINANDO CONTACTO...');
    const contacto = await ContactoEmpresaModel.findOne({
      empresaId,
      telefono: telefonoNormalizado
    });

    if (contacto) {
      console.log('✅ Contacto encontrado:');
      console.log('   ID:', contacto._id);
      console.log('   Nombre:', contacto.nombre);
      console.log('   Teléfono:', contacto.telefono);
      
      const contactoId = contacto._id.toString();
      
      // 2. Buscar y eliminar turnos asociados
      console.log('\n2️⃣ BUSCANDO Y ELIMINANDO TURNOS...');
      const turnos = await TurnoModel.find({
        clienteId: contactoId,
        empresaId
      });
      
      if (turnos.length > 0) {
        console.log(`✅ Encontrados ${turnos.length} turno(s):`);
        turnos.forEach((turno, index) => {
          console.log(`   Turno ${index + 1}:`);
          console.log('      ID:', turno._id);
          console.log('      Fecha:', turno.fechaInicio);
          console.log('      Estado:', turno.estado);
        });
        
        const resultTurnos = await TurnoModel.deleteMany({
          clienteId: contactoId,
          empresaId
        });
        console.log(`✅ ${resultTurnos.deletedCount} turno(s) eliminado(s)`);
      } else {
        console.log('⚠️ No se encontraron turnos');
      }
      
      // 3. Buscar y eliminar conversation states
      console.log('\n3️⃣ BUSCANDO Y ELIMINANDO CONVERSATION STATES...');
      const states = await ConversationStateModel.find({
        telefono: telefonoNormalizado,
        empresaId
      });
      
      if (states.length > 0) {
        console.log(`✅ Encontrados ${states.length} conversation state(s):`);
        states.forEach((state, index) => {
          console.log(`   State ${index + 1}:`);
          console.log('      ID:', state._id);
          console.log('      Teléfono:', state.telefono);
          console.log('      Empresa:', state.empresaId);
        });
        
        const resultStates = await ConversationStateModel.deleteMany({
          telefono: telefonoNormalizado,
          empresaId
        });
        console.log(`✅ ${resultStates.deletedCount} conversation state(s) eliminado(s)`);
      } else {
        console.log('⚠️ No se encontraron conversation states');
      }
      
      // 4. Eliminar el contacto
      console.log('\n4️⃣ ELIMINANDO CONTACTO...');
      await ContactoEmpresaModel.deleteOne({ _id: contacto._id });
      console.log('✅ Contacto eliminado');
      
    } else {
      console.log('⚠️ No se encontró contacto con ese teléfono');
    }

    // 5. Verificación final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5️⃣ VERIFICACIÓN FINAL...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const contactoFinal = await ContactoEmpresaModel.findOne({
      empresaId,
      telefono: telefonoNormalizado
    });
    
    const turnosFinal = await TurnoModel.find({
      empresaId,
      $or: [
        { clienteId: contacto?._id.toString() },
        { 'datos.telefono': telefonoNormalizado }
      ]
    });
    
    const statesFinal = await ConversationStateModel.find({
      telefono: telefonoNormalizado,
      empresaId
    });
    
    console.log('📊 Resultados:');
    console.log('   Contactos:', contactoFinal ? '❌ AÚN EXISTE' : '✅ ELIMINADO');
    console.log('   Turnos:', turnosFinal.length > 0 ? `❌ AÚN EXISTEN (${turnosFinal.length})` : '✅ ELIMINADOS');
    console.log('   States:', statesFinal.length > 0 ? `❌ AÚN EXISTEN (${statesFinal.length})` : '✅ ELIMINADOS');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!contactoFinal && turnosFinal.length === 0 && statesFinal.length === 0) {
      console.log('✅ ¡LIMPIEZA COMPLETA EXITOSA!');
      console.log('✅ El número está completamente limpio');
      console.log('✅ Listo para empezar un flujo nuevo');
    } else {
      console.log('⚠️ ADVERTENCIA: Algunos datos no se eliminaron');
      console.log('⚠️ Revisar manualmente');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

limpiarNumeroCompleto();
