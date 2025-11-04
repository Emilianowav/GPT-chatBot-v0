// 🧹 Script para limpiar completamente un número de Paraná Lodge
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import { ContactoEmpresaModel } from '../src/models/ContactoEmpresa.js';
import { ConversationStateModel } from '../src/models/ConversationState.js';
import { TurnoModel } from '../src/modules/calendar/models/Turno.js';

const TELEFONO = '5493794946066';
const EMPRESA_NOMBRE = 'Paraná Lodge';

async function limpiarNumeroParanaLodge() {
  try {
    console.log(`🧹 Limpiando número ${TELEFONO} de ${EMPRESA_NOMBRE}...\n`);
    await connectDB();
    
    // 1. Limpiar ContactoEmpresa
    console.log('1️⃣ Limpiando ContactoEmpresa...');
    const contacto = await ContactoEmpresaModel.findOne({ 
      telefono: TELEFONO,
      empresaId: EMPRESA_NOMBRE
    });
    
    if (contacto) {
      console.log(`   📋 Contacto encontrado:`);
      console.log(`      ID: ${contacto._id}`);
      console.log(`      Nombre: ${contacto.nombre} ${contacto.apellido}`);
      console.log(`      Historial: ${contacto.conversaciones.historial.length} mensajes`);
      console.log(`      Interacciones: ${contacto.metricas.interacciones}`);
      
      // Eliminar
      await ContactoEmpresaModel.deleteOne({ _id: contacto._id });
      console.log(`   ✅ Contacto eliminado`);
    } else {
      console.log('   ℹ️ No se encontró contacto');
    }
    
    // 2. Limpiar ConversationState
    console.log('\n2️⃣ Limpiando ConversationState...');
    const estados = await ConversationStateModel.find({ 
      telefono: TELEFONO,
      empresaId: EMPRESA_NOMBRE
    });
    
    if (estados.length > 0) {
      console.log(`   📋 ${estados.length} estado(s) encontrado(s)`);
      for (const estado of estados) {
        console.log(`      - Flujo activo: ${estado.flujo_activo || 'ninguno'}`);
        console.log(`        Estado actual: ${estado.estado_actual || 'ninguno'}`);
      }
      
      await ConversationStateModel.deleteMany({ 
        telefono: TELEFONO,
        empresaId: EMPRESA_NOMBRE
      });
      console.log(`   ✅ ${estados.length} estado(s) eliminado(s)`);
    } else {
      console.log('   ℹ️ No se encontraron estados');
    }
    
    // 3. Verificar turnos (no eliminar, solo informar)
    console.log('\n3️⃣ Verificando turnos...');
    const turnos = await TurnoModel.find({ 
      clienteTelefono: TELEFONO,
      empresaId: EMPRESA_NOMBRE
    });
    
    if (turnos.length > 0) {
      console.log(`   ⚠️ ${turnos.length} turno(s) encontrado(s) (NO se eliminarán)`);
    } else {
      console.log('   ✅ No hay turnos registrados');
    }
    
    // RESUMEN
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`✅ Número ${TELEFONO} limpiado completamente`);
    console.log(`   - ContactoEmpresa: ${contacto ? 'Eliminado' : 'No existía'}`);
    console.log(`   - ConversationState: ${estados.length > 0 ? `${estados.length} eliminado(s)` : 'No existían'}`);
    console.log(`   - Turnos: ${turnos.length} (conservados)`);
    console.log('');
    console.log('🔄 El próximo mensaje creará un contacto nuevo y limpio');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

limpiarNumeroParanaLodge();
