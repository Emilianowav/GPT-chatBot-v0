// 🧪 Script para probar creación de turno
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { buscarOCrearContacto } from '../services/contactoService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCrearTurno() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    const telefono = '5493794765394';
    const empresaId = 'San Jose';

    console.log('🧪 PROBANDO CREACIÓN DE TURNO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Buscar o crear contacto
    console.log('1️⃣ Buscando/creando contacto...');
    const contacto = await buscarOCrearContacto({
      telefono,
      profileName: 'Bruno Test',
      empresaId
    });
    
    console.log('✅ Contacto:', {
      id: contacto._id,
      nombre: contacto.nombre,
      telefono: contacto.telefono
    });
    console.log('');

    // 2. Buscar agente
    console.log('2️⃣ Buscando agente activo...');
    const agente = await AgenteModel.findOne({
      empresaId,
      activo: true
    });

    if (!agente) {
      console.error('❌ No hay agentes activos');
      return;
    }

    console.log('✅ Agente:', {
      id: agente._id,
      nombre: agente.nombre,
      apellido: agente.apellido
    });
    console.log('');

    // 3. Preparar datos del turno
    const fechaInicio = new Date();
    fechaInicio.setHours(19, 50, 0, 0);
    
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(fechaFin.getMinutes() + 30);

    const datosTurno = {
      empresaId,
      agenteId: agente._id,
      clienteId: contacto._id.toString(),
      fechaInicio,
      fechaFin,
      duracion: 30,
      estado: 'pendiente',
      tipoReserva: 'viaje',
      datos: {
        origen: 'Corrientes capital',
        destino: 'Salta',
        pasajeros: 4
      },
      notas: 'Reservado vía WhatsApp - TEST',
      creadoPor: 'bot'
    };

    console.log('3️⃣ Datos del turno a crear:');
    console.log(JSON.stringify(datosTurno, null, 2));
    console.log('');

    // 4. Intentar crear turno
    console.log('4️⃣ Creando turno...');
    try {
      const nuevoTurno = await TurnoModel.create(datosTurno);
      
      console.log('✅ ¡Turno creado exitosamente!');
      console.log('   ID:', nuevoTurno._id);
      console.log('   Cliente ID:', nuevoTurno.clienteId);
      console.log('   Fecha:', nuevoTurno.fechaInicio);
      console.log('   Estado:', nuevoTurno.estado);
      console.log('');

      // 5. Verificar que se puede buscar
      console.log('5️⃣ Verificando que se puede buscar el turno...');
      const turnoEncontrado = await TurnoModel.findOne({
        clienteId: contacto._id.toString(),
        empresaId
      });

      if (turnoEncontrado) {
        console.log('✅ Turno encontrado correctamente');
      } else {
        console.log('❌ No se pudo encontrar el turno');
      }

    } catch (errorCreacion) {
      console.error('❌ ERROR AL CREAR TURNO:');
      console.error('   Mensaje:', (errorCreacion as Error).message);
      console.error('   Stack:', (errorCreacion as Error).stack);
      
      // Mostrar detalles del error de validación si existe
      if ((errorCreacion as any).errors) {
        console.error('   Errores de validación:');
        Object.keys((errorCreacion as any).errors).forEach(campo => {
          console.error(`      - ${campo}:`, (errorCreacion as any).errors[campo].message);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

testCrearTurno();
