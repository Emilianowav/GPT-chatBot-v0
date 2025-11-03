// 🧹 Script para limpiar TODOS los estados incorrectos
import mongoose from 'mongoose';
import { ConversationStateModel } from '../models/ConversationState.js';
import { ClienteModel } from '../models/Cliente.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

async function limpiarEstadosCompleto() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.db?.databaseName}\n`);

    // 1. Eliminar TODOS los estados con empresaId como ObjectId
    console.log('🗑️ Eliminando estados con empresaId como ObjectId...');
    const resultadoObjectId = await ConversationStateModel.deleteMany({
      empresaId: { $regex: /^[0-9a-f]{24}$/i }
    });
    console.log(`✅ Eliminados ${resultadoObjectId.deletedCount} estados con ObjectId\n`);

    // 2. Normalizar teléfonos en todos los clientes
    console.log('📞 Normalizando teléfonos en Clientes...');
    const clientes = await ClienteModel.find({});
    let clientesActualizados = 0;

    for (const cliente of clientes) {
      const telefonoOriginal = cliente.telefono;
      const telefonoNormalizado = normalizarTelefono(telefonoOriginal);

      if (telefonoOriginal !== telefonoNormalizado) {
        console.log(`   ${cliente.nombre}: ${telefonoOriginal} → ${telefonoNormalizado}`);
        await ClienteModel.updateOne(
          { _id: cliente._id },
          { $set: { telefono: telefonoNormalizado } }
        );
        clientesActualizados++;
      }
    }
    console.log(`✅ Clientes actualizados: ${clientesActualizados}\n`);

    // 3. Normalizar teléfonos en todos los estados
    console.log('📞 Normalizando teléfonos en ConversationStates...');
    const estados = await ConversationStateModel.find({});
    let estadosActualizados = 0;

    for (const estado of estados) {
      const telefonoOriginal = estado.telefono;
      const telefonoNormalizado = normalizarTelefono(telefonoOriginal);

      if (telefonoOriginal !== telefonoNormalizado) {
        console.log(`   ${telefonoOriginal} → ${telefonoNormalizado}`);
        await ConversationStateModel.updateOne(
          { _id: estado._id },
          { $set: { telefono: telefonoNormalizado } }
        );
        estadosActualizados++;
      }
    }
    console.log(`✅ Estados actualizados: ${estadosActualizados}\n`);

    // 4. Eliminar duplicados
    console.log('🔍 Eliminando duplicados...');
    const todosLosEstados = await ConversationStateModel.find({});
    const mapaEstados = new Map<string, any[]>();

    todosLosEstados.forEach(estado => {
      const key = `${estado.telefono}|${estado.empresaId}`;
      if (!mapaEstados.has(key)) {
        mapaEstados.set(key, []);
      }
      mapaEstados.get(key)!.push(estado);
    });

    const duplicados = Array.from(mapaEstados.entries()).filter(([_, estados]) => estados.length > 1);
    let duplicadosEliminados = 0;

    for (const [key, estados] of duplicados) {
      const [telefono, empresaId] = key.split('|');
      console.log(`   📱 ${telefono} (${empresaId}): ${estados.length} registros`);

      // Mantener el más reciente
      const masReciente = estados.sort((a, b) => 
        b.ultima_interaccion.getTime() - a.ultima_interaccion.getTime()
      )[0];

      const aEliminar = estados.filter(e => e._id.toString() !== masReciente._id.toString());

      for (const estado of aEliminar) {
        await ConversationStateModel.deleteOne({ _id: estado._id });
        duplicadosEliminados++;
      }
    }
    console.log(`✅ Duplicados eliminados: ${duplicadosEliminados}\n`);

    // 5. Resumen final
    console.log('📊 Resumen final:');
    const totalClientes = await ClienteModel.countDocuments({});
    const totalEstados = await ConversationStateModel.countDocuments({});
    
    console.log(`   Clientes: ${totalClientes}`);
    console.log(`   Estados: ${totalEstados}`);

    // Mostrar estados actuales
    const estadosActuales = await ConversationStateModel.find({}).limit(10);
    if (estadosActuales.length > 0) {
      console.log('\n📋 Estados actuales:');
      estadosActuales.forEach(estado => {
        console.log(`   - ${estado.telefono} (${estado.empresaId}): ${estado.flujo_activo || 'sin flujo'}`);
      });
    }

    console.log('\n✅ Limpieza completa exitosa');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar script
limpiarEstadosCompleto();
