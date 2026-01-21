/**
 * 🧪 PRUEBA 4: Asignación automática de agente al crear turno
 */

import mongoose from 'mongoose';
import { TurnoModel } from '../src/modules/calendar/models/Turno.js';
import { crearTurno } from '../src/modules/calendar/services/turnoService.js';
import { connectDB } from '../src/config/database.js';

async function testAsignacionAutomatica() {
  try {
    console.log('\n🧪 PRUEBA 4: Asignación automática de agente\n');
    console.log('='.repeat(80));
    
    await connectDB();
    const db = mongoose.connection.db;
    
    // 1. Obtener cliente de prueba
    const cliente = await db.collection('contactos_empresa').findOne({
      empresaId: 'San Jose',
      telefono: '5493794999999'
    });
    
    if (!cliente) {
      console.log('❌ Cliente de prueba no encontrado. Ejecuta test-crear-cliente-con-agente.js primero');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ Cliente encontrado:');
    console.log(`   Nombre: ${cliente.nombre} ${cliente.apellido}`);
    console.log(`   ID: ${cliente._id}`);
    console.log(`   Agentes asignados: ${cliente.agentesAsignados?.length || 0}`);
    
    if (cliente.agentesAsignados && cliente.agentesAsignados.length > 0) {
      const agente = await db.collection('agentes').findOne({ _id: cliente.agentesAsignados[0] });
      console.log(`   ✅ Agente asignado: ${agente.nombre} ${agente.apellido} (${agente._id})`);
    }
    
    // 2. Crear turno SIN especificar agente (debe asignarse automáticamente)
    console.log('\n📝 Creando turno SIN especificar agente...');
    console.log('   (El sistema debe asignar automáticamente el agente del cliente)');
    
    const fechaTurno = new Date();
    fechaTurno.setDate(fechaTurno.getDate() + 2); // 2 días en el futuro
    fechaTurno.setHours(14, 0, 0, 0);
    
    console.log(`\n🔍 Datos del turno:`);
    console.log(`   Cliente ID: ${cliente._id}`);
    console.log(`   Agente ID: NO ESPECIFICADO (debe auto-asignarse)`);
    console.log(`   Fecha: ${fechaTurno.toLocaleString('es-AR')}`);
    console.log(`   Datos: { fecha: "25/01/2026", pasajeros: "2" }`);
    
    const turno = await crearTurno({
      empresaId: 'San Jose',
      // agenteId: NO SE ESPECIFICA - debe auto-asignarse
      clienteId: cliente._id.toString(),
      fechaInicio: fechaTurno,
      duracion: 30,
      datos: {
        fecha: '25/01/2026',
        pasajeros: '2'
      },
      notas: 'Turno de prueba - asignación automática',
      creadoPor: 'bot'
    });
    
    console.log('\n✅ Turno creado exitosamente!');
    console.log(`   ID Turno: ${turno._id}`);
    console.log(`   Estado: ${turno.estado}`);
    console.log(`   Agente asignado: ${turno.agenteId || 'NO ASIGNADO'}`);
    
    // 3. Verificar que se asignó correctamente
    if (turno.agenteId) {
      const agenteAsignado = await db.collection('agentes').findOne({ _id: turno.agenteId });
      console.log(`   ✅ ÉXITO: Agente auto-asignado: ${agenteAsignado.nombre} ${agenteAsignado.apellido}`);
      
      // Verificar que es el mismo agente del cliente
      const esElMismo = cliente.agentesAsignados[0].toString() === turno.agenteId.toString();
      console.log(`   ${esElMismo ? '✅' : '❌'} Es el agente asignado al cliente: ${esElMismo ? 'SÍ' : 'NO'}`);
    } else {
      console.log('   ❌ ERROR: No se asignó ningún agente');
    }
    
    console.log('\n📋 Datos del turno:');
    console.log(`   Fecha: ${turno.datos?.fecha || 'N/A'}`);
    console.log(`   Pasajeros: ${turno.datos?.pasajeros || 'N/A'}`);
    console.log(`   Origen: ${turno.datos?.origen || '⚠️ PENDIENTE (se completa en CRM)'}`);
    console.log(`   Destino: ${turno.datos?.destino || '⚠️ PENDIENTE (se completa en CRM)'}`);
    console.log(`   Horario: ${turno.datos?.horario || '⚠️ PENDIENTE (se completa en CRM)'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ PRUEBA COMPLETADA\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await mongoose.disconnect();
  }
}

testAsignacionAutomatica();
