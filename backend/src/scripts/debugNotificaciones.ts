// 🔍 Script para debuggear notificaciones
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ConversationStateModel } from '../models/ConversationState.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugNotificaciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    const telefonoProblema = '5493794765394';
    const empresaId = 'San Jose';

    console.log('📊 DEBUGGEANDO TELÉFONO:', telefonoProblema);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Verificar contacto
    console.log('1️⃣ VERIFICANDO CONTACTO:');
    const contacto = await ContactoEmpresaModel.findOne({
      telefono: telefonoProblema,
      empresaId
    });

    if (!contacto) {
      console.log('❌ NO SE ENCONTRÓ CONTACTO');
      console.log('   Buscando con variaciones...');
      
      const contactoSinNormalizar = await ContactoEmpresaModel.findOne({
        empresaId,
        $or: [
          { telefono: telefonoProblema },
          { telefono: `+${telefonoProblema}` },
          { telefono: telefonoProblema.substring(2) }
        ]
      });
      
      if (contactoSinNormalizar) {
        console.log('⚠️ ENCONTRADO CON FORMATO DIFERENTE:');
        console.log('   Teléfono en BD:', contactoSinNormalizar.telefono);
        console.log('   Teléfono buscado:', telefonoProblema);
      } else {
        console.log('❌ NO EXISTE EN contactos_empresa');
      }
    } else {
      console.log('✅ Contacto encontrado:');
      console.log('   ID:', contacto._id);
      console.log('   Nombre:', contacto.nombre, contacto.apellido);
      console.log('   Teléfono:', contacto.telefono);
      console.log('   Empresa:', contacto.empresaId);
    }
    console.log('');

    // 2. Verificar turnos
    console.log('2️⃣ VERIFICANDO TURNOS:');
    
    if (contacto) {
      const turnos = await TurnoModel.find({
        clienteId: contacto._id.toString(),
        empresaId
      }).sort({ fechaInicio: -1 }).limit(5);

      console.log(`   Total de turnos: ${turnos.length}`);
      
      turnos.forEach((turno, i) => {
        console.log(`\n   Turno ${i + 1}:`);
        console.log('   - ID:', turno._id);
        console.log('   - Fecha:', new Date(turno.fechaInicio).toLocaleString('es-AR'));
        console.log('   - Estado:', turno.estado);
        console.log('   - Origen:', turno.datos?.origen);
        console.log('   - Destino:', turno.datos?.destino);
        console.log('   - Notificaciones enviadas:', turno.notificaciones?.length || 0);
      });
    } else {
      console.log('   ⚠️ No se puede buscar turnos sin contacto');
    }
    console.log('');

    // 3. Verificar conversation_state
    console.log('3️⃣ VERIFICANDO CONVERSATION STATE:');
    const state = await ConversationStateModel.findOne({
      telefono: telefonoProblema,
      empresaId
    });

    if (!state) {
      console.log('❌ NO SE ENCONTRÓ CONVERSATION STATE');
    } else {
      console.log('✅ Conversation State encontrado:');
      console.log('   ID:', state._id);
      console.log('   Teléfono:', state.telefono);
      console.log('   Flujo activo:', state.flujo_activo || 'null');
      console.log('   Estado actual:', state.estado_actual || 'null');
      console.log('   Última interacción:', new Date(state.ultima_interaccion).toLocaleString('es-AR'));
      console.log('   Data:', JSON.stringify(state.data, null, 2));
    }
    console.log('');

    // 4. Comparar con el que funciona
    console.log('4️⃣ COMPARANDO CON NÚMERO QUE FUNCIONA:');
    const telefonoFunciona = '5493794946066';
    
    const contactoFunciona = await ContactoEmpresaModel.findOne({
      telefono: telefonoFunciona,
      empresaId
    });

    const stateFunciona = await ConversationStateModel.findOne({
      telefono: telefonoFunciona,
      empresaId
    });

    console.log('   Contacto que funciona:');
    console.log('   - Existe:', !!contactoFunciona ? 'SÍ' : 'NO');
    if (contactoFunciona) {
      console.log('   - ID:', contactoFunciona._id);
      console.log('   - Teléfono:', contactoFunciona.telefono);
    }

    console.log('\n   State que funciona:');
    console.log('   - Existe:', !!stateFunciona ? 'SÍ' : 'NO');
    if (stateFunciona) {
      console.log('   - Flujo activo:', stateFunciona.flujo_activo);
      console.log('   - Estado actual:', stateFunciona.estado_actual);
      console.log('   - Tiene viajes:', !!stateFunciona.data?.viajes);
    }
    console.log('');

    // 5. Diagnóstico
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DIAGNÓSTICO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!contacto) {
      console.log('❌ PROBLEMA 1: El contacto NO existe en contactos_empresa');
      console.log('   SOLUCIÓN: El turno tiene clienteId pero no hay contacto');
      console.log('   CAUSA: Posiblemente el turno se creó antes de la migración');
    }

    if (state && !state.flujo_activo) {
      console.log('❌ PROBLEMA 2: El flujo NO se inició correctamente');
      console.log('   SOLUCIÓN: Revisar iniciarFlujoNotificacionViajes()');
      console.log('   CAUSA: El servicio de notificaciones no llamó al flujo');
    }

    if (state && !state.data?.viajes) {
      console.log('❌ PROBLEMA 3: Los viajes NO se guardaron en el state');
      console.log('   SOLUCIÓN: Revisar que se pasan los viajes al iniciar el flujo');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

debugNotificaciones();
