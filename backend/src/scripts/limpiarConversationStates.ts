// 🧹 Script para limpiar registros duplicados en ConversationState
import mongoose from 'mongoose';
import { ConversationStateModel } from '../models/ConversationState.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

async function limpiarConversationStates() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB');

    // 1. Buscar todos los registros con empresaId que parezca ObjectId
    console.log('\n🔍 Buscando registros con empresaId como ObjectId...');
    
    const registrosIncorrectos = await ConversationStateModel.find({
      empresaId: { $regex: /^[0-9a-f]{24}$/i }
    });

    console.log(`📊 Encontrados ${registrosIncorrectos.length} registros con empresaId como ObjectId`);

    if (registrosIncorrectos.length > 0) {
      console.log('\n📋 Registros a eliminar:');
      registrosIncorrectos.forEach((reg, index) => {
        console.log(`   ${index + 1}. telefono: ${reg.telefono}, empresaId: ${reg.empresaId}, flujo: ${reg.flujo_activo}`);
      });

      // 2. Eliminar registros incorrectos
      console.log('\n🗑️ Eliminando registros incorrectos...');
      const resultado = await ConversationStateModel.deleteMany({
        empresaId: { $regex: /^[0-9a-f]{24}$/i }
      });

      console.log(`✅ Eliminados ${resultado.deletedCount} registros`);
    } else {
      console.log('✅ No se encontraron registros incorrectos');
    }

    // 3. Verificar registros duplicados por telefono (incluyendo variaciones con/sin +)
    console.log('\n🔍 Buscando registros duplicados por teléfono...');
    
    const todosLosRegistros = await ConversationStateModel.find({});
    const telefonosMap = new Map<string, any[]>();

    todosLosRegistros.forEach(reg => {
      // Normalizar teléfono para agrupar variaciones
      const key = normalizarTelefono(reg.telefono) + '|' + reg.empresaId;
      if (!telefonosMap.has(key)) {
        telefonosMap.set(key, []);
      }
      telefonosMap.get(key)!.push(reg);
    });

    const duplicados = Array.from(telefonosMap.entries()).filter(([_, regs]) => regs.length > 1);

    if (duplicados.length > 0) {
      console.log(`⚠️ Encontrados ${duplicados.length} teléfonos con registros duplicados:`);
      
      for (const [telefono, registros] of duplicados) {
        console.log(`\n   📱 ${telefono} (${registros.length} registros):`);
        registros.forEach((reg, index) => {
          console.log(`      ${index + 1}. empresaId: ${reg.empresaId}, flujo: ${reg.flujo_activo}, última interacción: ${reg.ultima_interaccion}`);
        });

        // Mantener solo el más reciente
        const masReciente = registros.sort((a, b) => 
          b.ultima_interaccion.getTime() - a.ultima_interaccion.getTime()
        )[0];

        const aEliminar = registros.filter(r => r._id.toString() !== masReciente._id.toString());

        console.log(`   ✅ Manteniendo: empresaId: ${masReciente.empresaId}, flujo: ${masReciente.flujo_activo}`);
        console.log(`   🗑️ Eliminando ${aEliminar.length} registros antiguos...`);

        for (const reg of aEliminar) {
          await ConversationStateModel.deleteOne({ _id: reg._id });
        }
      }
    } else {
      console.log('✅ No se encontraron duplicados');
    }

    // 4. Normalizar teléfonos en todos los registros
    console.log('\n🔧 Normalizando teléfonos en todos los registros...');
    
    const registrosConMas = await ConversationStateModel.find({
      telefono: { $regex: /^\+/ }
    });

    if (registrosConMas.length > 0) {
      console.log(`📞 Encontrados ${registrosConMas.length} registros con + en el teléfono`);
      
      for (const reg of registrosConMas) {
        const telefonoNormalizado = normalizarTelefono(reg.telefono);
        console.log(`   Actualizando: ${reg.telefono} → ${telefonoNormalizado}`);
        
        await ConversationStateModel.updateOne(
          { _id: reg._id },
          { $set: { telefono: telefonoNormalizado } }
        );
      }
      
      console.log(`✅ Normalizados ${registrosConMas.length} teléfonos`);
    } else {
      console.log('✅ Todos los teléfonos ya están normalizados');
    }

    // 5. Resumen final
    console.log('\n📊 Resumen final:');
    const totalRegistros = await ConversationStateModel.countDocuments({});
    console.log(`   Total de registros: ${totalRegistros}`);

    const porEmpresa = await ConversationStateModel.aggregate([
      {
        $group: {
          _id: '$empresaId',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n   Registros por empresa:');
    porEmpresa.forEach(({ _id, count }) => {
      console.log(`      ${_id}: ${count} registros`);
    });

    console.log('\n✅ Limpieza completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar script
limpiarConversationStates();
