// 📞 Script para normalizar todos los teléfonos en la BD
import mongoose from 'mongoose';
import { ClienteModel } from '../models/Cliente.js';
import { ConversationStateModel } from '../models/ConversationState.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

async function normalizarTelefonos() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // 1. Normalizar teléfonos en Clientes
    console.log('📋 Normalizando teléfonos en Clientes...');
    const clientes = await ClienteModel.find({});
    console.log(`   Encontrados ${clientes.length} clientes`);

    let clientesActualizados = 0;
    for (const cliente of clientes) {
      const telefonoOriginal = cliente.telefono;
      const telefonoNormalizado = normalizarTelefono(telefonoOriginal);

      if (telefonoOriginal !== telefonoNormalizado) {
        console.log(`   📞 ${cliente.nombre}: ${telefonoOriginal} → ${telefonoNormalizado}`);
        await ClienteModel.updateOne(
          { _id: cliente._id },
          { $set: { telefono: telefonoNormalizado } }
        );
        clientesActualizados++;
      }
    }

    console.log(`✅ Clientes actualizados: ${clientesActualizados}\n`);

    // 2. Normalizar teléfonos en ConversationStates
    console.log('📋 Normalizando teléfonos en ConversationStates...');
    const states = await ConversationStateModel.find({});
    console.log(`   Encontrados ${states.length} estados`);

    let statesActualizados = 0;
    for (const state of states) {
      const telefonoOriginal = state.telefono;
      const telefonoNormalizado = normalizarTelefono(telefonoOriginal);

      if (telefonoOriginal !== telefonoNormalizado) {
        console.log(`   📞 ${telefonoOriginal} → ${telefonoNormalizado}`);
        await ConversationStateModel.updateOne(
          { _id: state._id },
          { $set: { telefono: telefonoNormalizado } }
        );
        statesActualizados++;
      }
    }

    console.log(`✅ Estados actualizados: ${statesActualizados}\n`);

    // 3. Eliminar duplicados en ConversationStates
    console.log('🔍 Buscando duplicados en ConversationStates...');
    const todosLosStates = await ConversationStateModel.find({});
    const telefonosMap = new Map<string, any[]>();

    todosLosStates.forEach(state => {
      const key = `${state.telefono}|${state.empresaId}`;
      if (!telefonosMap.has(key)) {
        telefonosMap.set(key, []);
      }
      telefonosMap.get(key)!.push(state);
    });

    const duplicados = Array.from(telefonosMap.entries()).filter(([_, states]) => states.length > 1);

    if (duplicados.length > 0) {
      console.log(`⚠️ Encontrados ${duplicados.length} duplicados:`);
      
      for (const [key, states] of duplicados) {
        const [telefono, empresaId] = key.split('|');
        console.log(`\n   📱 ${telefono} (${empresaId}): ${states.length} registros`);

        // Mantener el más reciente
        const masReciente = states.sort((a, b) => 
          b.ultima_interaccion.getTime() - a.ultima_interaccion.getTime()
        )[0];

        const aEliminar = states.filter(s => s._id.toString() !== masReciente._id.toString());

        console.log(`   ✅ Manteniendo: ${masReciente.flujo_activo || 'sin flujo'}`);
        console.log(`   🗑️ Eliminando ${aEliminar.length} registros antiguos`);

        for (const state of aEliminar) {
          await ConversationStateModel.deleteOne({ _id: state._id });
        }
      }
    } else {
      console.log('✅ No se encontraron duplicados\n');
    }

    // 4. Resumen final
    console.log('📊 Resumen final:');
    const totalClientes = await ClienteModel.countDocuments({});
    const totalStates = await ConversationStateModel.countDocuments({});
    console.log(`   Clientes: ${totalClientes}`);
    console.log(`   Estados: ${totalStates}`);

    console.log('\n✅ Normalización completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la normalización:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar script
normalizarTelefonos();
