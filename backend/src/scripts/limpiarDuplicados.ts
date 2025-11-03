// 🧹 Script para eliminar estados duplicados y corregir teléfonos
import mongoose from 'mongoose';
import { ConversationStateModel } from '../models/ConversationState.js';
import { ClienteModel } from '../models/Cliente.js';
import dotenv from 'dotenv';

dotenv.config();

async function limpiarDuplicados() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.db?.databaseName}\n`);

    // 1. Eliminar estado con teléfono incorrecto (543794946066)
    console.log('🗑️ Eliminando estado con teléfono incorrecto...');
    const resultadoEstado = await ConversationStateModel.deleteOne({
      telefono: '543794946066',
      empresaId: 'San Jose'
    });
    console.log(`✅ Estados eliminados: ${resultadoEstado.deletedCount}\n`);

    // 2. Corregir teléfono del cliente
    console.log('📞 Corrigiendo teléfono del cliente...');
    const resultadoCliente = await ClienteModel.updateOne(
      { telefono: '543794946066' },
      { $set: { telefono: '5493794946066' } }
    );
    console.log(`✅ Clientes actualizados: ${resultadoCliente.modifiedCount}\n`);

    // 3. Mostrar estados actuales
    console.log('📋 Estados actuales en la BD:');
    const estados = await ConversationStateModel.find({ empresaId: 'San Jose' });
    estados.forEach(e => {
      console.log(`   - ${e.telefono}: flujo=${e.flujo_activo || 'null'}, estado=${e.estado_actual || 'null'}`);
    });

    console.log('\n✅ Limpieza completada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar script
limpiarDuplicados();
