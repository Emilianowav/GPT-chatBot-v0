// 🔍 Script para verificar clienteId del turno
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { ClienteModel } from '../models/Cliente.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import dotenv from 'dotenv';

dotenv.config();

async function verificarClienteId() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    const clienteIdProblema = '69097c079b50423cf7ec5d7d';
    const telefonoProblema = '5493794765394';

    console.log('🔍 INVESTIGANDO clienteId:', clienteIdProblema);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Buscar en contactos_empresa
    console.log('1️⃣ Buscando en contactos_empresa:');
    const contactoNuevo = await ContactoEmpresaModel.findById(clienteIdProblema);
    
    if (contactoNuevo) {
      console.log('✅ ENCONTRADO en contactos_empresa:');
      console.log('   Nombre:', contactoNuevo.nombre, contactoNuevo.apellido);
      console.log('   Teléfono:', contactoNuevo.telefono);
      console.log('   Empresa:', contactoNuevo.empresaId);
    } else {
      console.log('❌ NO encontrado en contactos_empresa');
    }
    console.log('');

    // 2. Buscar en clientes (colección antigua)
    console.log('2️⃣ Buscando en clientes (antigua):');
    const clienteAntiguo = await ClienteModel.findById(clienteIdProblema);
    
    if (clienteAntiguo) {
      console.log('✅ ENCONTRADO en clientes (antigua):');
      console.log('   Nombre:', clienteAntiguo.nombre, clienteAntiguo.apellido);
      console.log('   Teléfono:', clienteAntiguo.telefono);
      console.log('   Empresa:', clienteAntiguo.empresaId);
    } else {
      console.log('❌ NO encontrado en clientes');
    }
    console.log('');

    // 3. Buscar el contacto correcto por teléfono
    console.log('3️⃣ Buscando contacto correcto por teléfono:');
    const contactoCorrecto = await ContactoEmpresaModel.findOne({
      telefono: telefonoProblema,
      empresaId: 'San Jose'
    });

    if (contactoCorrecto) {
      console.log('✅ Contacto correcto encontrado:');
      console.log('   ID correcto:', contactoCorrecto._id);
      console.log('   Nombre:', contactoCorrecto.nombre, contactoCorrecto.apellido);
      console.log('   Teléfono:', contactoCorrecto.telefono);
    }
    console.log('');

    // 4. Buscar turno
    console.log('4️⃣ Verificando turno:');
    const turno = await TurnoModel.findOne({
      clienteId: clienteIdProblema,
      empresaId: 'San Jose'
    });

    if (turno) {
      console.log('✅ Turno encontrado:');
      console.log('   ID:', turno._id);
      console.log('   clienteId:', turno.clienteId);
      console.log('   Fecha:', new Date(turno.fechaInicio).toLocaleString('es-AR'));
      console.log('   Origen:', turno.datos?.origen);
      console.log('   Destino:', turno.datos?.destino);
    }
    console.log('');

    // 5. Diagnóstico
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DIAGNÓSTICO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (clienteAntiguo && contactoCorrecto) {
      console.log('❌ PROBLEMA ENCONTRADO:');
      console.log('   El turno apunta a:', clienteIdProblema);
      console.log('   Pero el contacto real es:', contactoCorrecto._id.toString());
      console.log('');
      console.log('   CAUSA:');
      console.log('   - El turno se creó con el ID de la colección "clientes" (antigua)');
      console.log('   - La migración creó un nuevo contacto con ID diferente');
      console.log('   - El turno quedó apuntando al ID antiguo');
      console.log('');
      console.log('   SOLUCIÓN:');
      console.log('   - Actualizar el clienteId del turno al ID correcto');
      console.log('   - O migrar los IDs de los turnos existentes');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

verificarClienteId();
