// 🔍 Script para verificar inconsistencias en teléfonos
import mongoose from 'mongoose';
import { ClienteModel } from '../models/Cliente.js';
import { ConversationStateModel } from '../models/ConversationState.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';

async function verificarTelefonos() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // 1. Verificar clientes con teléfonos no normalizados
    console.log('\n📋 VERIFICANDO CLIENTES...');
    const clientes = await ClienteModel.find({});
    
    let clientesConProblemas = 0;
    for (const cliente of clientes) {
      const telefonoNormalizado = normalizarTelefono(cliente.telefono);
      if (cliente.telefono !== telefonoNormalizado) {
        clientesConProblemas++;
        console.log(`❌ Cliente con teléfono NO normalizado:`);
        console.log(`   ID: ${cliente._id}`);
        console.log(`   Nombre: ${cliente.nombre} ${cliente.apellido}`);
        console.log(`   Teléfono actual: "${cliente.telefono}"`);
        console.log(`   Teléfono normalizado: "${telefonoNormalizado}"`);
        console.log(`   Empresa: ${cliente.empresaId}`);
      }
    }
    
    console.log(`\n📊 Total clientes: ${clientes.length}`);
    console.log(`❌ Clientes con problemas: ${clientesConProblemas}`);
    console.log(`✅ Clientes correctos: ${clientes.length - clientesConProblemas}`);

    // 2. Verificar estados de conversación con teléfonos no normalizados
    console.log('\n📋 VERIFICANDO CONVERSATION STATES...');
    const estados = await ConversationStateModel.find({});
    
    let estadosConProblemas = 0;
    for (const estado of estados) {
      const telefonoNormalizado = normalizarTelefono(estado.telefono);
      if (estado.telefono !== telefonoNormalizado) {
        estadosConProblemas++;
        console.log(`❌ Estado con teléfono NO normalizado:`);
        console.log(`   ID: ${estado._id}`);
        console.log(`   Teléfono actual: "${estado.telefono}"`);
        console.log(`   Teléfono normalizado: "${telefonoNormalizado}"`);
        console.log(`   Empresa: ${estado.empresaId}`);
        console.log(`   Flujo activo: ${estado.flujo_activo}`);
      }
    }
    
    console.log(`\n📊 Total estados: ${estados.length}`);
    console.log(`❌ Estados con problemas: ${estadosConProblemas}`);
    console.log(`✅ Estados correctos: ${estados.length - estadosConProblemas}`);

    // 3. Buscar duplicados (mismo teléfono normalizado, diferentes formatos)
    console.log('\n📋 BUSCANDO DUPLICADOS...');
    const telefonosNormalizados = new Map<string, any[]>();
    
    for (const cliente of clientes) {
      const telefonoNorm = normalizarTelefono(cliente.telefono);
      if (!telefonosNormalizados.has(telefonoNorm)) {
        telefonosNormalizados.set(telefonoNorm, []);
      }
      telefonosNormalizados.get(telefonoNorm)!.push(cliente);
    }
    
    let duplicados = 0;
    for (const [telefonoNorm, clientesList] of telefonosNormalizados) {
      if (clientesList.length > 1) {
        duplicados++;
        console.log(`⚠️ DUPLICADO encontrado para teléfono normalizado: ${telefonoNorm}`);
        clientesList.forEach((c, i) => {
          console.log(`   ${i + 1}. ID: ${c._id}, Nombre: ${c.nombre} ${c.apellido}, Tel: "${c.telefono}", Empresa: ${c.empresaId}`);
        });
      }
    }
    
    console.log(`\n📊 Teléfonos únicos (normalizados): ${telefonosNormalizados.size}`);
    console.log(`⚠️ Duplicados encontrados: ${duplicados}`);

    // 4. Verificar turnos con clienteId que no existen
    console.log('\n📋 VERIFICANDO TURNOS...');
    const turnos = await TurnoModel.find({}).limit(100);
    let turnosSinCliente = 0;
    
    for (const turno of turnos) {
      const cliente = await ClienteModel.findById(turno.clienteId);
      if (!cliente) {
        turnosSinCliente++;
        console.log(`❌ Turno sin cliente válido:`);
        console.log(`   Turno ID: ${turno._id}`);
        console.log(`   Cliente ID: ${turno.clienteId}`);
        console.log(`   Empresa: ${turno.empresaId}`);
        console.log(`   Fecha: ${turno.fechaInicio}`);
      }
    }
    
    console.log(`\n📊 Turnos verificados: ${turnos.length}`);
    console.log(`❌ Turnos sin cliente: ${turnosSinCliente}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

// Ejecutar
verificarTelefonos();
