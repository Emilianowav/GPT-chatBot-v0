// Script para verificar turnos que deberían recibir notificación
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TurnoModel } from '../modules/calendar/models/Turno.js';

dotenv.config();

async function verificarTurnos() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Conectado a MongoDB\n');

    const empresaId = 'San Jose';
    
    // Simular el cálculo del backend
    const ahora = new Date();
    const diasAntes = 1;
    
    const fechaInicio = new Date(ahora);
    fechaInicio.setDate(fechaInicio.getDate() + diasAntes);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);
    
    console.log('📅 RANGO DE BÚSQUEDA:');
    console.log(`   Desde: ${fechaInicio.toISOString()}`);
    console.log(`   Hasta: ${fechaFin.toISOString()}`);
    console.log(`   Fecha local: ${fechaInicio.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}\n`);
    
    // Query exacto que usa el backend
    const query: any = {
      empresaId,
      fechaInicio: { $gte: fechaInicio, $lte: fechaFin },
      estado: { $in: ['no_confirmado', 'pendiente'] }
    };
    
    console.log('🔎 QUERY MONGODB:');
    console.log(JSON.stringify(query, null, 2));
    console.log('');
    
    const turnos = await TurnoModel.find(query)
      .populate('agenteId')
      .populate('clienteId')
      .sort({ fechaInicio: 1 });
    
    console.log(`📊 TURNOS ENCONTRADOS: ${turnos.length}\n`);
    
    if (turnos.length === 0) {
      console.log('❌ No se encontraron turnos con el query.\n');
      
      // Buscar TODOS los turnos de mañana sin filtros
      console.log('🔍 Buscando TODOS los turnos del día objetivo (sin filtros)...\n');
      const todosTurnos = await TurnoModel.find({
        empresaId,
        fechaInicio: { $gte: fechaInicio, $lte: fechaFin }
      }).populate('agenteId').populate('clienteId');
      
      console.log(`📊 Total de turnos (sin filtros): ${todosTurnos.length}\n`);
      
      if (todosTurnos.length > 0) {
        todosTurnos.forEach((turno: any, index: number) => {
          console.log(`${index + 1}. Turno ${turno._id}:`);
          console.log(`   - Fecha (ISO): ${turno.fechaInicio.toISOString()}`);
          console.log(`   - Fecha (ARG): ${turno.fechaInicio.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
          console.log(`   - Estado: "${turno.estado}" (tipo: ${typeof turno.estado})`);
          console.log(`   - Cliente: ${turno.clienteId?.nombre || 'Sin nombre'}`);
          console.log(`   - Agente: ${(turno.agenteId as any)?.nombre || 'Sin nombre'}`);
          console.log(`   - Notificaciones: ${turno.notificaciones?.length || 0}`);
          if (turno.notificaciones && turno.notificaciones.length > 0) {
            turno.notificaciones.forEach((notif: any, i: number) => {
              console.log(`      ${i + 1}. Tipo: ${notif.tipo}, Enviada: ${notif.enviada}, EnviadaEn: ${notif.enviadaEn}`);
            });
          }
          console.log('');
        });
        
        console.log('\n🔍 ANÁLISIS:');
        console.log('Los turnos existen pero NO coinciden con el query.');
        console.log('Posibles causas:');
        console.log('1. Estado incorrecto (debe ser exactamente "pendiente" o "no_confirmado")');
        console.log('2. Ya tienen notificación de confirmación enviada hoy');
        console.log('3. Fecha fuera del rango (revisar zona horaria)');
      } else {
        console.log('❌ No hay turnos en ese rango de fechas.');
        console.log('\n🔍 Buscando turnos cercanos...\n');
        
        const turnosCercanos = await TurnoModel.find({
          empresaId
        }).sort({ fechaInicio: 1 }).limit(10);
        
        console.log(`📊 Próximos 10 turnos de ${empresaId}:\n`);
        turnosCercanos.forEach((turno: any, index: number) => {
          console.log(`${index + 1}. ${turno.fechaInicio.toISOString()} - Estado: ${turno.estado}`);
        });
      }
    } else {
      turnos.forEach((turno: any, index: number) => {
        console.log(`${index + 1}. Turno ${turno._id}:`);
        console.log(`   - Fecha (ISO): ${turno.fechaInicio.toISOString()}`);
        console.log(`   - Fecha (ARG): ${turno.fechaInicio.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
        console.log(`   - Estado: ${turno.estado}`);
        console.log(`   - Cliente: ${turno.clienteId?.nombre || 'Sin nombre'}`);
        console.log(`   - Agente: ${(turno.agenteId as any)?.nombre || 'Sin nombre'}`);
        console.log(`   - Notificaciones: ${turno.notificaciones?.length || 0}`);
        console.log('');
      });
    }
    
    console.log('✅ Script completado');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarTurnos();
