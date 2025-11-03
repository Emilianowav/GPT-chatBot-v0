// 🔍 Script para verificar contenido de la BD
import mongoose from 'mongoose';
import { ClienteModel } from '../models/Cliente.js';
import { ConversationStateModel } from '../models/ConversationState.js';
import { EmpresaModel } from '../models/Empresa.js';
import dotenv from 'dotenv';

dotenv.config();

async function verificarBD() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.db?.databaseName}\n`);

    // Verificar empresas
    console.log('🏢 EMPRESAS:');
    const empresas = await EmpresaModel.find({});
    console.log(`   Total: ${empresas.length}`);
    empresas.forEach(e => {
      console.log(`   - ${e.nombre} (${e.telefono})`);
    });
    console.log('');

    // Verificar clientes
    console.log('👥 CLIENTES:');
    const clientes = await ClienteModel.find({});
    console.log(`   Total: ${clientes.length}`);
    clientes.forEach(c => {
      console.log(`   - ${c.nombre} ${c.apellido} (${c.telefono}) - Empresa: ${c.empresaId}`);
    });
    console.log('');

    // Verificar estados
    console.log('💬 CONVERSATION STATES:');
    const estados = await ConversationStateModel.find({});
    console.log(`   Total: ${estados.length}`);
    estados.forEach(e => {
      console.log(`   - ${e.telefono} (${e.empresaId}): flujo=${e.flujo_activo || 'null'}, estado=${e.estado_actual || 'null'}`);
    });
    console.log('');

    // Verificar colecciones disponibles
    console.log('📋 COLECCIONES EN LA BD:');
    const collections = await mongoose.connection.db?.listCollections().toArray();
    collections?.forEach(c => {
      console.log(`   - ${c.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar script
verificarBD();
