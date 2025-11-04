// 🔄 Script para migrar clienteId de turnos a contactos_empresa
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { ClienteModel } from '../models/Cliente.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrarClienteIdTurnos() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    console.log('🔄 MIGRANDO clienteId DE TURNOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Obtener todos los turnos
    const turnos = await TurnoModel.find({});
    console.log(`📊 Total de turnos encontrados: ${turnos.length}\n`);

    let actualizados = 0;
    let noEncontrados = 0;
    let yaCorrectos = 0;
    let errores = 0;

    for (const turno of turnos) {
      try {
        // Verificar si el clienteId ya apunta a contactos_empresa
        const contactoExiste = await ContactoEmpresaModel.findById(turno.clienteId);
        
        if (contactoExiste) {
          yaCorrectos++;
          continue;
        }

        // Buscar en la colección antigua
        const clienteAntiguo = await ClienteModel.findById(turno.clienteId);
        
        if (!clienteAntiguo) {
          console.log(`⚠️ Turno ${turno._id}: Cliente no encontrado en ninguna colección`);
          noEncontrados++;
          continue;
        }

        // Buscar el contacto correcto por teléfono
        const contactoCorrecto = await ContactoEmpresaModel.findOne({
          telefono: clienteAntiguo.telefono,
          empresaId: turno.empresaId
        });

        if (!contactoCorrecto) {
          console.log(`⚠️ Turno ${turno._id}: No se encontró contacto para ${clienteAntiguo.telefono}`);
          noEncontrados++;
          continue;
        }

        // Actualizar el turno
        const clienteIdAntiguo = turno.clienteId;
        const clienteIdNuevo = contactoCorrecto._id.toString();

        if (clienteIdAntiguo === clienteIdNuevo) {
          yaCorrectos++;
          continue;
        }

        await TurnoModel.findByIdAndUpdate(turno._id, {
          clienteId: clienteIdNuevo
        });

        console.log(`✅ Turno ${turno._id}:`);
        console.log(`   Cliente: ${clienteAntiguo.nombre} ${clienteAntiguo.apellido}`);
        console.log(`   Antiguo ID: ${clienteIdAntiguo}`);
        console.log(`   Nuevo ID: ${clienteIdNuevo}`);
        console.log('');

        actualizados++;

      } catch (error) {
        console.error(`❌ Error procesando turno ${turno._id}:`, error);
        errores++;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`   Total de turnos: ${turnos.length}`);
    console.log(`   ✅ Actualizados: ${actualizados}`);
    console.log(`   ✓ Ya correctos: ${yaCorrectos}`);
    console.log(`   ⚠️ No encontrados: ${noEncontrados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log('');

    if (actualizados > 0) {
      console.log('🎉 ¡Migración completada exitosamente!');
      console.log('');
      console.log('📝 Próximos pasos:');
      console.log('   1. Verificar que las notificaciones funcionen');
      console.log('   2. Ejecutar: npm run debug:notificaciones');
      console.log('   3. Probar envío de notificaciones');
    } else if (yaCorrectos === turnos.length) {
      console.log('✅ Todos los turnos ya tienen el clienteId correcto');
    } else {
      console.log('⚠️ No se actualizó ningún turno');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

migrarClienteIdTurnos();
