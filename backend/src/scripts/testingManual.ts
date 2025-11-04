// 🧪 Script de Testing Manual Automatizado
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { TurnoModel } from '../modules/calendar/models/Turno.js';
import { ConversationStateModel } from '../models/ConversationState.js';
import { EmpresaModel } from '../models/Empresa.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { buscarOCrearContacto } from '../services/contactoService.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

interface TestResult {
  nombre: string;
  pasado: boolean;
  mensaje: string;
  detalles?: any;
}

const resultados: TestResult[] = [];

function agregarResultado(nombre: string, pasado: boolean, mensaje: string, detalles?: any) {
  resultados.push({ nombre, pasado, mensaje, detalles });
  const emoji = pasado ? '✅' : '❌';
  console.log(`${emoji} ${nombre}: ${mensaje}`);
  if (detalles) {
    console.log('   Detalles:', JSON.stringify(detalles, null, 2));
  }
}

async function testingManual() {
  console.log('\n🧪 ========== INICIANDO TESTING MANUAL ==========\n');

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // Limpiar datos de prueba
    console.log('🧹 Limpiando datos de prueba...');
    await ContactoEmpresaModel.deleteMany({ telefono: { $regex: '^549379494' } });
    await ConversationStateModel.deleteMany({ telefono: { $regex: '^549379494' } });
    await TurnoModel.deleteMany({ datos: { origen: 'TEST' } });
    console.log('✅ Datos limpiados\n');

    // ========== TEST 1: Crear Contacto ==========
    console.log('📝 TEST 1: Crear Contacto desde WhatsApp');
    try {
      const contacto = await buscarOCrearContacto({
        telefono: '+54 9 379 494-6066',
        profileName: 'Juan Pérez Test',
        empresaId: 'San Jose'
      });

      const checks = {
        telefonoNormalizado: contacto.telefono === '5493794946066',
        nombreExtraido: contacto.nombre === 'Juan',
        apellidoExtraido: contacto.apellido === 'Pérez Test',
        origenChatbot: contacto.origen === 'chatbot',
        metricasInicializadas: contacto.metricas.interacciones === 0,
        historialVacio: contacto.conversaciones.historial.length === 0
      };

      const todosPasan = Object.values(checks).every(v => v);
      agregarResultado(
        'Crear Contacto',
        todosPasan,
        todosPasan ? 'Contacto creado correctamente' : 'Algunos checks fallaron',
        checks
      );
    } catch (error) {
      agregarResultado('Crear Contacto', false, `Error: ${(error as Error).message}`);
    }

    // ========== TEST 2: Normalización de Teléfonos ==========
    console.log('\n📝 TEST 2: Normalización de Teléfonos');
    try {
      const formatos = [
        '+54 9 379 494-6067',
        '5493794946068',
        '+5493794946069',
        '54 9 379 494 6070'
      ];

      const resultadosNormalizacion = [];
      for (const telefono of formatos) {
        const normalizado = normalizarTelefono(telefono);
        const esValido = /^\d+$/.test(normalizado) && normalizado.length >= 10;
        resultadosNormalizacion.push({
          original: telefono,
          normalizado,
          valido: esValido
        });
      }

      const todosPasan = resultadosNormalizacion.every(r => r.valido);
      agregarResultado(
        'Normalización de Teléfonos',
        todosPasan,
        todosPasan ? 'Todos los formatos normalizados correctamente' : 'Algunos formatos fallaron',
        resultadosNormalizacion
      );
    } catch (error) {
      agregarResultado('Normalización de Teléfonos', false, `Error: ${(error as Error).message}`);
    }

    // ========== TEST 3: Contacto Duplicado ==========
    console.log('\n📝 TEST 3: Evitar Duplicados');
    try {
      const contacto1 = await buscarOCrearContacto({
        telefono: '5493794946071',
        profileName: 'Test Duplicado',
        empresaId: 'San Jose'
      });

      const contacto2 = await buscarOCrearContacto({
        telefono: '+54 9 379 494-6071', // Mismo número, diferente formato
        profileName: 'Test Duplicado',
        empresaId: 'San Jose'
      });

      const sonElMismo = contacto1._id.toString() === contacto2._id.toString();
      agregarResultado(
        'Evitar Duplicados',
        sonElMismo,
        sonElMismo ? 'No se crearon duplicados' : 'Se creó un duplicado',
        {
          contacto1Id: contacto1._id.toString(),
          contacto2Id: contacto2._id.toString()
        }
      );
    } catch (error) {
      agregarResultado('Evitar Duplicados', false, `Error: ${(error as Error).message}`);
    }

    // ========== TEST 4: Verificar Empresa y Agente ==========
    console.log('\n📝 TEST 4: Verificar Empresa y Agente');
    try {
      const empresa = await EmpresaModel.findOne({ nombre: 'San Jose' });
      const agente = await AgenteModel.findOne({ empresaId: 'San Jose', activo: true });

      const checks = {
        empresaExiste: !!empresa,
        empresaTienePhoneNumberId: !!empresa?.phoneNumberId,
        agenteExiste: !!agente,
        agenteActivo: agente?.activo === true
      };

      const todosPasan = Object.values(checks).every(v => v);
      agregarResultado(
        'Verificar Empresa y Agente',
        todosPasan,
        todosPasan ? 'Empresa y agente configurados correctamente' : 'Faltan configuraciones',
        checks
      );
    } catch (error) {
      agregarResultado('Verificar Empresa y Agente', false, `Error: ${(error as Error).message}`);
    }

    // ========== TEST 5: Crear Turno ==========
    console.log('\n📝 TEST 5: Crear Turno');
    try {
      const contacto = await buscarOCrearContacto({
        telefono: '5493794946072',
        profileName: 'Test Turno',
        empresaId: 'San Jose'
      });

      const agente = await AgenteModel.findOne({ empresaId: 'San Jose', activo: true });

      if (!agente) {
        throw new Error('No hay agentes activos');
      }

      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() + 1); // Mañana
      fechaInicio.setHours(14, 30, 0, 0);

      const fechaFin = new Date(fechaInicio);
      fechaFin.setMinutes(fechaFin.getMinutes() + 30);

      const turno = await TurnoModel.create({
        empresaId: 'San Jose',
        agenteId: agente._id,
        clienteId: contacto._id.toString(),
        fechaInicio,
        fechaFin,
        duracion: 30,
        estado: 'pendiente',
        tipoReserva: 'viaje',
        datos: {
          origen: 'TEST Origen',
          destino: 'TEST Destino',
          pasajeros: 3
        },
        notas: 'Turno de prueba',
        creadoPor: 'bot'
      });

      const checks = {
        turnoCreado: !!turno,
        clienteIdCorrecto: turno.clienteId === contacto._id.toString(),
        estadoPendiente: turno.estado === 'pendiente',
        datosGuardados: turno.datos?.origen === 'TEST Origen'
      };

      const todosPasan = Object.values(checks).every(v => v);
      agregarResultado(
        'Crear Turno',
        todosPasan,
        todosPasan ? 'Turno creado correctamente' : 'Algunos checks fallaron',
        checks
      );
    } catch (error) {
      agregarResultado('Crear Turno', false, `Error: ${(error as Error).message}`);
    }

    // ========== TEST 6: Consultar Turnos ==========
    console.log('\n📝 TEST 6: Consultar Turnos');
    try {
      const contacto = await ContactoEmpresaModel.findOne({ telefono: '5493794946072' });
      
      if (!contacto) {
        throw new Error('Contacto no encontrado');
      }

      const turnos = await TurnoModel.find({
        empresaId: 'San Jose',
        clienteId: contacto._id.toString(),
        estado: { $in: ['pendiente', 'confirmado'] },
        fechaInicio: { $gte: new Date() }
      });

      agregarResultado(
        'Consultar Turnos',
        turnos.length > 0,
        `Se encontraron ${turnos.length} turnos`,
        { cantidadTurnos: turnos.length }
      );
    } catch (error) {
      agregarResultado('Consultar Turnos', false, `Error: ${(error as Error).message}`);
    }

    // ========== TEST 7: Cancelar Turno ==========
    console.log('\n📝 TEST 7: Cancelar Turno');
    try {
      // Buscar turno con query más específica
      const turno = await TurnoModel.findOne({
        empresaId: 'San Jose',
        'datos.origen': 'TEST Origen',
        estado: 'pendiente'
      });

      if (!turno) {
        // Si no hay turno, crear uno para el test
        const contacto = await ContactoEmpresaModel.findOne({ telefono: '5493794946072' });
        const agente = await AgenteModel.findOne({ empresaId: 'San Jose', activo: true });
        
        if (!contacto || !agente) {
          throw new Error('No se pudo crear turno para test de cancelación');
        }

        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        fechaInicio.setHours(15, 0, 0, 0);

        const fechaFin = new Date(fechaInicio);
        fechaFin.setMinutes(fechaFin.getMinutes() + 30);

        const nuevoTurno = await TurnoModel.create({
          empresaId: 'San Jose',
          agenteId: agente._id,
          clienteId: contacto._id.toString(),
          fechaInicio,
          fechaFin,
          duracion: 30,
          estado: 'pendiente',
          tipoReserva: 'viaje',
          datos: {
            origen: 'TEST Origen',
            destino: 'TEST Destino',
            pasajeros: 2
          },
          notas: 'Turno para test de cancelación',
          creadoPor: 'bot'
        });

        await TurnoModel.findByIdAndUpdate(nuevoTurno._id, {
          estado: 'cancelado',
          canceladoEn: new Date()
        });

        const turnoCancelado = await TurnoModel.findById(nuevoTurno._id);
        
        agregarResultado(
          'Cancelar Turno',
          turnoCancelado?.estado === 'cancelado',
          'Turno creado y cancelado correctamente',
          { estadoFinal: turnoCancelado?.estado }
        );
      } else {
        await TurnoModel.findByIdAndUpdate(turno._id, {
          estado: 'cancelado',
          canceladoEn: new Date()
        });

        const turnoCancelado = await TurnoModel.findById(turno._id);
        
        agregarResultado(
          'Cancelar Turno',
          turnoCancelado?.estado === 'cancelado',
          'Turno cancelado correctamente',
          { estadoFinal: turnoCancelado?.estado }
        );
      }
    } catch (error) {
      agregarResultado('Cancelar Turno', false, `Error: ${(error as Error).message}`);
    }

    // ========== TEST 8: Verificar Índices ==========
    console.log('\n📝 TEST 8: Verificar Índices de BD');
    try {
      const indicesContacto = await ContactoEmpresaModel.collection.getIndexes();
      const indicesState = await ConversationStateModel.collection.getIndexes();
      const indicesTurno = await TurnoModel.collection.getIndexes();

      const checks = {
        contactoTieneIndices: Object.keys(indicesContacto).length > 1,
        stateTieneIndices: Object.keys(indicesState).length > 1,
        turnoTieneIndices: Object.keys(indicesTurno).length > 1
      };

      const todosPasan = Object.values(checks).every(v => v);
      agregarResultado(
        'Verificar Índices',
        todosPasan,
        todosPasan ? 'Todos los índices configurados' : 'Faltan índices',
        {
          contacto: Object.keys(indicesContacto).length,
          state: Object.keys(indicesState).length,
          turno: Object.keys(indicesTurno).length
        }
      );
    } catch (error) {
      agregarResultado('Verificar Índices', false, `Error: ${(error as Error).message}`);
    }

    // ========== TEST 9: Performance - Crear 100 Contactos ==========
    console.log('\n📝 TEST 9: Performance - Crear 100 Contactos');
    try {
      const inicio = Date.now();
      const promesas = [];

      for (let i = 0; i < 100; i++) {
        promesas.push(
          buscarOCrearContacto({
            telefono: `549379494${6100 + i}`,
            profileName: `Test Performance ${i}`,
            empresaId: 'San Jose'
          })
        );
      }

      await Promise.all(promesas);
      const duracion = Date.now() - inicio;
      const promedioMs = duracion / 100;

      agregarResultado(
        'Performance - Crear 100 Contactos',
        promedioMs < 100, // Menos de 100ms por contacto
        `${duracion}ms total, ${promedioMs.toFixed(2)}ms promedio`,
        { duracionTotal: duracion, promedioPorContacto: promedioMs }
      );
    } catch (error) {
      agregarResultado('Performance - Crear 100 Contactos', false, `Error: ${(error as Error).message}`);
    }

    // ========== TEST 10: Limpieza Final ==========
    console.log('\n📝 TEST 10: Limpieza de Datos de Prueba');
    try {
      const contactosEliminados = await ContactoEmpresaModel.deleteMany({ 
        telefono: { $regex: '^549379494' } 
      });
      const turnosEliminados = await TurnoModel.deleteMany({ 
        datos: { origen: 'TEST Origen' } 
      });

      agregarResultado(
        'Limpieza de Datos',
        true,
        `${contactosEliminados.deletedCount} contactos y ${turnosEliminados.deletedCount} turnos eliminados`,
        {
          contactos: contactosEliminados.deletedCount,
          turnos: turnosEliminados.deletedCount
        }
      );
    } catch (error) {
      agregarResultado('Limpieza de Datos', false, `Error: ${(error as Error).message}`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }

  // ========== RESUMEN ==========
  console.log('\n📊 ========== RESUMEN DE TESTING ==========\n');
  
  const pasados = resultados.filter(r => r.pasado).length;
  const fallados = resultados.filter(r => !r.pasado).length;
  const total = resultados.length;
  const porcentaje = ((pasados / total) * 100).toFixed(1);

  console.log(`Total de tests: ${total}`);
  console.log(`✅ Pasados: ${pasados}`);
  console.log(`❌ Fallados: ${fallados}`);
  console.log(`📈 Porcentaje de éxito: ${porcentaje}%\n`);

  if (fallados > 0) {
    console.log('❌ Tests fallados:');
    resultados.filter(r => !r.pasado).forEach(r => {
      console.log(`   - ${r.nombre}: ${r.mensaje}`);
    });
  }

  console.log('\n✅ Testing completado\n');
  process.exit(fallados > 0 ? 1 : 0);
}

// Ejecutar
testingManual();
